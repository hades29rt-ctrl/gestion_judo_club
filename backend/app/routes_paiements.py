from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_pool
from app.dependencies import get_current_user
from app.schemas_paiements import PaiementCreate, PaiementOut, PaiementInitieOut
from app.services_helloasso import (
    creer_checkout_intent,
    obtenir_statut_checkout,
    HelloAssoError,
)

router = APIRouter(
    prefix="/paiements",
    tags=["paiements"],
    dependencies=[Depends(get_current_user)],
)


_SELECT_PAIEMENTS = """
    SELECT p.id, p.judoka_id, p.competition_id, p.type, p.libelle, p.montant_centimes,
           p.saison, p.statut, p.checkout_intent_id, p.date_creation, p.date_paiement,
           a.nom AS judoka_nom, a.prenom AS judoka_prenom
    FROM paiements p
    JOIN judokas j ON j.id = p.judoka_id
    JOIN adherents a ON a.id = j.adherent_id
"""


@router.post("", response_model=PaiementInitieOut, status_code=status.HTTP_201_CREATED)
async def creer_paiement(payload: PaiementCreate):
    pool = get_pool()

    # Récupère les infos du judoka/adhérent pour préremplir le payeur HelloAsso.
    judoka_row = await pool.fetchrow(
        """
        SELECT a.nom, a.prenom, a.email
        FROM judokas j
        JOIN adherents a ON a.id = j.adherent_id
        WHERE j.id = $1
        """,
        payload.judoka_id,
    )
    if judoka_row is None:
        raise HTTPException(status_code=404, detail="Judoka introuvable.")
    if not judoka_row["email"]:
        raise HTTPException(
            status_code=400,
            detail="L'adhérent doit avoir une adresse email renseignée pour initier un paiement.",
        )

    # Crée d'abord l'enregistrement local en attente.
    paiement_row = await pool.fetchrow(
        """
        INSERT INTO paiements (judoka_id, competition_id, type, libelle, montant_centimes, saison)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, judoka_id, competition_id, type, libelle, montant_centimes,
                  saison, statut, checkout_intent_id, date_creation, date_paiement
        """,
        payload.judoka_id, payload.competition_id, payload.type,
        payload.libelle, payload.montant_centimes, payload.saison,
    )

    try:
        checkout = await creer_checkout_intent(
            montant_centimes=payload.montant_centimes,
            libelle=payload.libelle,
            prenom_payeur=judoka_row["prenom"],
            nom_payeur=judoka_row["nom"],
            email_payeur=judoka_row["email"],
            reference_interne=paiement_row["id"],
        )
    except HelloAssoError as e:
        # On garde l'enregistrement local mais on remonte l'erreur HelloAsso.
        raise HTTPException(status_code=502, detail=str(e))

    updated = await pool.fetchrow(
        """
        UPDATE paiements SET checkout_intent_id = $2
        WHERE id = $1
        RETURNING id, judoka_id, competition_id, type, libelle, montant_centimes,
                  saison, statut, checkout_intent_id, date_creation, date_paiement
        """,
        paiement_row["id"], checkout["id"],
    )

    result = await pool.fetchrow(_SELECT_PAIEMENTS + " WHERE p.id = $1", updated["id"])
    return PaiementInitieOut(
        paiement=PaiementOut(**dict(result)),
        redirect_url=checkout["redirectUrl"],
    )


@router.get("", response_model=list[PaiementOut])
async def lister_paiements(judoka_id: int | None = None, statut: str | None = None):
    pool = get_pool()
    query = _SELECT_PAIEMENTS
    clauses = []
    params = []

    if judoka_id is not None:
        clauses.append(f"p.judoka_id = ${len(params) + 1}")
        params.append(judoka_id)
    if statut is not None:
        clauses.append(f"p.statut = ${len(params) + 1}")
        params.append(statut)

    if clauses:
        query += " WHERE " + " AND ".join(clauses)
    query += " ORDER BY p.date_creation DESC"

    rows = await pool.fetch(query, *params)
    return [PaiementOut(**dict(r)) for r in rows]


@router.post("/{paiement_id}/verifier", response_model=PaiementOut)
async def verifier_statut_paiement(paiement_id: int):
    """
    Interroge HelloAsso pour connaître l'état réel du paiement et met à jour
    l'enregistrement local en conséquence (pas de webhook : vérification manuelle/polling).
    """
    pool = get_pool()
    paiement = await pool.fetchrow(
        "SELECT checkout_intent_id, statut FROM paiements WHERE id = $1", paiement_id
    )
    if paiement is None:
        raise HTTPException(status_code=404, detail="Paiement introuvable.")
    if paiement["checkout_intent_id"] is None:
        raise HTTPException(status_code=400, detail="Ce paiement n'a pas encore été initié auprès de HelloAsso.")

    try:
        checkout = await obtenir_statut_checkout(paiement["checkout_intent_id"])
    except HelloAssoError as e:
        raise HTTPException(status_code=502, detail=str(e))

    code_statut = checkout.get("order", {}).get("payments", [{}])[0].get("state") if checkout.get("order") else None

    nouveau_statut = paiement["statut"]
    date_paiement_sql = "date_paiement"
    if code_statut == "Authorized":
        nouveau_statut = "paye"
    elif code_statut in ("Refused", "Expired"):
        nouveau_statut = "echoue"

    updated = await pool.fetchrow(
        f"""
        UPDATE paiements
        SET statut = $2,
            date_paiement = CASE WHEN $2 = 'paye' THEN now() ELSE {date_paiement_sql} END
        WHERE id = $1
        RETURNING id
        """,
        paiement_id, nouveau_statut,
    )

    result = await pool.fetchrow(_SELECT_PAIEMENTS + " WHERE p.id = $1", updated["id"])
    return PaiementOut(**dict(result))
