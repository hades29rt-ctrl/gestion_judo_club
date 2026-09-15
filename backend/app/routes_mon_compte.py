from fastapi import APIRouter, Depends, HTTPException

from app.database import get_pool
from app.dependencies import get_current_user
from app.schemas_auth import UtilisateurOut
from app.schemas_familles import FamilleUpdate, FamilleOut

router = APIRouter(
    prefix="/moi",
    tags=["mon-compte"],
    dependencies=[Depends(get_current_user)],
)


@router.get("/famille")
async def obtenir_ma_famille(current_user: UtilisateurOut = Depends(get_current_user)):
    if current_user.famille_id is None:
        raise HTTPException(
            status_code=404,
            detail="Ton compte n'est pas encore relié à une famille. Contacte un administrateur du club.",
        )

    pool = get_pool()
    famille = await pool.fetchrow(
        "SELECT id, nom_famille, telephone, email FROM familles WHERE id = $1",
        current_user.famille_id,
    )
    if famille is None:
        raise HTTPException(status_code=404, detail="Famille introuvable.")

    adherents = await pool.fetch(
        """
        SELECT a.id, a.nom, a.prenom, a.adresse, a.code_postal, a.ville, a.actif,
               j.grade_actuel, j.licence_statut
        FROM adherents a
        LEFT JOIN judokas j ON j.adherent_id = a.id
        WHERE a.famille_id = $1
        ORDER BY a.nom, a.prenom
        """,
        current_user.famille_id,
    )

    return {
        "famille": dict(famille),
        "adherents": [dict(a) for a in adherents],
    }


@router.put("/famille", response_model=FamilleOut)
async def modifier_ma_famille(
    payload: FamilleUpdate,
    current_user: UtilisateurOut = Depends(get_current_user),
):
    if current_user.famille_id is None:
        raise HTTPException(
            status_code=404,
            detail="Ton compte n'est pas encore relié à une famille. Contacte un administrateur du club.",
        )

    pool = get_pool()
    champs = payload.model_dump(exclude_unset=True)
    if not champs:
        raise HTTPException(status_code=400, detail="Aucune donnée à mettre à jour.")

    set_clauses = [f"{champ} = ${i + 2}" for i, champ in enumerate(champs.keys())]
    query = f"""
        UPDATE familles SET {', '.join(set_clauses)}
        WHERE id = $1
        RETURNING id, nom_famille, telephone, email
    """
    row = await pool.fetchrow(query, current_user.famille_id, *champs.values())
    return FamilleOut(**dict(row))


@router.put("/adherents/{adherent_id}")
async def modifier_mon_adherent(
    adherent_id: int,
    adresse: str | None = None,
    code_postal: str | None = None,
    ville: str | None = None,
    current_user: UtilisateurOut = Depends(get_current_user),
):
    """Permet à la famille de mettre à jour l'adresse d'un de ses enfants inscrits."""
    if current_user.famille_id is None:
        raise HTTPException(
            status_code=404,
            detail="Ton compte n'est pas encore relié à une famille. Contacte un administrateur du club.",
        )

    pool = get_pool()
    # Vérifie que l'adhérent visé appartient bien à la famille du compte connecté.
    adherent = await pool.fetchrow(
        "SELECT famille_id FROM adherents WHERE id = $1", adherent_id
    )
    if adherent is None:
        raise HTTPException(status_code=404, detail="Adhérent introuvable.")
    if adherent["famille_id"] != current_user.famille_id:
        raise HTTPException(status_code=403, detail="Cet adhérent n'appartient pas à ta famille.")

    row = await pool.fetchrow(
        """
        UPDATE adherents SET adresse = $2, code_postal = $3, ville = $4
        WHERE id = $1
        RETURNING id, nom, prenom, adresse, code_postal, ville
        """,
        adherent_id, adresse, code_postal, ville,
    )
    return dict(row)
