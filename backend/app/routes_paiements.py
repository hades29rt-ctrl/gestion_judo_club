from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_pool
from app.dependencies import get_current_user
from app.schemas_paiements import (
    PaiementCreate,
    PaiementOut,
    PaiementInitieOut,
    PaiementUpdate,
    ValiderPaiementManuelRequest,
)
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
           p.reduction_centimes, (p.montant_centimes - p.reduction_centimes) AS montant_net_centimes,
           p.mode_paiement, p.saison, p.statut, p.checkout_intent_id, p.date_creation, p.date_paiement,
           a.nom AS judoka_nom, a.prenom AS judoka_prenom
    FROM paiements p
    JOIN judokas j ON j.id = p.judoka_id
    JOIN adherents a ON a.id = j.adherent_id
"""


@router.post("", response_model=PaiementInitieOut, status_code=status.HTTP_201_CREATED)
async def creer_paiement(payload: PaiementCreate):
    pool = get_pool()

    judoka_row = await pool.fetchrow(
        """
        SELECT a.nom, a.prenom, f.email
        FROM judokas j
        JOIN adherents a ON a.id = j.adherent_id
        LEFT JOIN familles f ON f.id = a.famille_id
        WHERE j.id = $1
        """,
        payload.judoka_id,
    )
    if judoka_row is None:
        raise HTTPException(status_code=404, detail="Judoka introuvable.")

    # ---- Mode manuel (chèque / espèces / virement) : pas de HelloAsso ----
    if payload.mode_paiement != "helloasso":
        paiement_row = await pool.fetchrow(
            """
            INSERT INTO paiements (judoka_id, competition_id, type, libelle, montant_centimes,
                                    reduction_centimes, mode_paiement, saison)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id
            """,
            payload.judoka_id, payload.competition_id, payload.type,
            payload.libelle, payload.montant_centimes, payload.reduction_centimes,
            payload.mode_paiement, payload.saison,
        )
        result = await pool.fetchrow(_SELECT_PAIEMENTS + " WHERE p.id = $1", paiement_row["id"])
        return PaiementInitieOut(paiement=PaiementOut(**dict(result)), redirect_url=None)

    # ---- Mode HelloAsso : paiement en ligne ----
    if not judoka_row["email"]:
        raise HTTPException(
            status_code=400,
            detail="La famille de cet adhérent doit avoir une adresse email renseignée pour initier un paiement HelloAsso.",
        )

    paiement_row = await pool.fetchrow(
        """
        INSERT INTO paiements (judoka_id, competition_id, type, libelle, montant_centimes,
                                reduction_centimes, mode_paiement, saison)
        VALUES ($1, $2, $3, $4, $5, $6, 'helloasso', $7)
        RETURNING id
        """,
        payload.judoka_id, payload.competition_id, payload.type,
        payload.libelle, payload.montant_centimes, payload.reduction_centimes, payload.saison,
    )

    try:
        checkout = await creer_checkout_intent(
            montant_centimes=payload.montant_net_centimes,
            libelle=payload.libelle,
            prenom_payeur=judoka_row["prenom"],
            nom_payeur=judoka_row["nom"],
            email_payeur=judoka_row["email"],
            reference_interne=paiement_row["id"],
        )
    except HelloAssoError as e:
        raise HTTPException(status_code=502, detail=str(e))

    updated = await pool.fetchrow(
        "UPDATE paiements SET checkout_intent_id = $2 WHERE id = $1 RETURNING id",
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


@router.put("/{paiement_id}", response_model=PaiementOut)
async def modifier_paiement(paiement_id: int, payload: PaiementUpdate):
    """
    Corrige un paiement déjà saisi (montant, libellé, type, saison, réduction)
    sans devoir en recréer un — évite les doublons en cas d'erreur de saisie.
    Ne touche ni au statut, ni au mode de paiement, ni à HelloAsso : utilise
    /verifier ou /valider-manuel pour faire évoluer le statut.
    """
    pool = get_pool()
    champs = payload.model_dump(exclude_unset=True)
    if not champs:
        raise HTTPException(status_code=400, detail="Aucune donnée à mettre à jour.")

    existant = await pool.fetchrow(
        "SELECT montant_centimes, reduction_centimes FROM paiements WHERE id = $1", paiement_id
    )
    if existant is None:
        raise HTTPException(status_code=404, detail="Paiement introuvable.")

    nouveau_montant = champs.get("montant_centimes", existant["montant_centimes"])
    nouvelle_reduction = champs.get("reduction_centimes", existant["reduction_centimes"])
    if nouvelle_reduction >= nouveau_montant:
        raise HTTPException(
            status_code=422,
            detail="La réduction ne peut pas être supérieure ou égale au montant.",
        )

    set_clauses = [f"{champ} = ${i + 2}" for i, champ in enumerate(champs.keys())]
    query = f"UPDATE paiements SET {', '.join(set_clauses)} WHERE id = $1 RETURNING id"
    updated = await pool.fetchrow(query, paiement_id, *champs.values())

    result = await pool.fetchrow(_SELECT_PAIEMENTS + " WHERE p.id = $1", updated["id"])
    return PaiementOut(**dict(result))


@router.delete("/{paiement_id}", status_code=status.HTTP_204_NO_CONTENT)
async def supprimer_paiement(paiement_id: int):
    pool = get_pool()
    result = await pool.execute("DELETE FROM paiements WHERE id = $1", paiement_id)
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Paiement introuvable.")


@router.post("/{paiement_id}/verifier", response_model=PaiementOut)
async def verifier_statut_paiement(paiement_id: int):
    """Vérifie le statut réel d'un paiement HelloAsso (polling manuel)."""
    pool = get_pool()
    paiement = await pool.fetchrow(
        "SELECT checkout_intent_id, statut, mode_paiement FROM paiements WHERE id = $1", paiement_id
    )
    if paiement is None:
        raise HTTPException(status_code=404, detail="Paiement introuvable.")
    if paiement["mode_paiement"] != "helloasso":
        raise HTTPException(status_code=400, detail="Ce paiement n'est pas un paiement HelloAsso, utilise la validation manuelle.")
    if paiement["checkout_intent_id"] is None:
        raise HTTPException(status_code=400, detail="Ce paiement n'a pas encore été initié auprès de HelloAsso.")

    try:
        checkout = await obtenir_statut_checkout(paiement["checkout_intent_id"])
    except HelloAssoError as e:
        raise HTTPException(status_code=502, detail=str(e))

    code_statut = checkout.get("order", {}).get("payments", [{}])[0].get("state") if checkout.get("order") else None

    nouveau_statut = paiement["statut"]
    if code_statut == "Authorized":
        nouveau_statut = "paye"
    elif code_statut in ("Refused", "Expired"):
        nouveau_statut = "echoue"

    updated = await pool.fetchrow(
        """
        UPDATE paiements
        SET statut = $2,
            date_paiement = CASE WHEN $2 = 'paye' THEN now() ELSE date_paiement END
        WHERE id = $1
        RETURNING id
        """,
        paiement_id, nouveau_statut,
    )

    result = await pool.fetchrow(_SELECT_PAIEMENTS + " WHERE p.id = $1", updated["id"])
    return PaiementOut(**dict(result))


@router.post("/{paiement_id}/valider-manuel", response_model=PaiementOut)
async def valider_paiement_manuel(paiement_id: int, payload: ValiderPaiementManuelRequest):
    """
    Marque comme payé un paiement reçu par chèque, espèces ou virement
    (le club a physiquement reçu le règlement).
    """
    pool = get_pool()
    paiement = await pool.fetchrow(
        "SELECT mode_paiement, statut FROM paiements WHERE id = $1", paiement_id
    )
    if paiement is None:
        raise HTTPException(status_code=404, detail="Paiement introuvable.")
    if paiement["mode_paiement"] == "helloasso":
        raise HTTPException(
            status_code=400,
            detail="Ce paiement est en ligne (HelloAsso), utilise la vérification automatique plutôt que la validation manuelle.",
        )
    if paiement["statut"] == "paye":
        raise HTTPException(status_code=400, detail="Ce paiement est déjà marqué comme payé.")

    updated = await pool.fetchrow(
        """
        UPDATE paiements
        SET statut = 'paye', date_paiement = now()
        WHERE id = $1
        RETURNING id
        """,
        paiement_id,
    )

    result = await pool.fetchrow(_SELECT_PAIEMENTS + " WHERE p.id = $1", updated["id"])
    return PaiementOut(**dict(result))
