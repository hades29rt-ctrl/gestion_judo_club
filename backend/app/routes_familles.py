from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_pool
from app.dependencies import get_current_user
from app.schemas_familles import FamilleCreate, FamilleOut, FamilleUpdate, FamilleAvecEffectif

router = APIRouter(
    prefix="/familles",
    tags=["familles"],
    dependencies=[Depends(get_current_user)],
)


@router.post("", response_model=FamilleOut, status_code=status.HTTP_201_CREATED)
async def creer_famille(payload: FamilleCreate):
    pool = get_pool()
    row = await pool.fetchrow(
        """
        INSERT INTO familles (nom_famille, telephone, email)
        VALUES ($1, $2, $3)
        RETURNING id, nom_famille, telephone, email
        """,
        payload.nom_famille, payload.telephone, payload.email,
    )
    return FamilleOut(**dict(row))


@router.get("", response_model=list[FamilleAvecEffectif])
async def lister_familles(recherche: str | None = None):
    pool = get_pool()
    query = """
        SELECT f.id, f.nom_famille, f.telephone, f.email,
               COUNT(a.id) AS nombre_adherents
        FROM familles f
        LEFT JOIN adherents a ON a.famille_id = f.id
    """
    params = []
    if recherche:
        query += " WHERE f.nom_famille ILIKE $1"
        params.append(f"%{recherche}%")
    query += " GROUP BY f.id ORDER BY f.nom_famille"

    rows = await pool.fetch(query, *params)
    return [FamilleAvecEffectif(**dict(r)) for r in rows]


@router.get("/{famille_id}", response_model=FamilleOut)
async def obtenir_famille(famille_id: int):
    pool = get_pool()
    row = await pool.fetchrow(
        "SELECT id, nom_famille, telephone, email FROM familles WHERE id = $1", famille_id
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Famille introuvable.")
    return FamilleOut(**dict(row))


@router.put("/{famille_id}", response_model=FamilleOut)
async def modifier_famille(famille_id: int, payload: FamilleUpdate):
    pool = get_pool()
    champs = payload.model_dump(exclude_unset=True)
    if not champs:
        raise HTTPException(status_code=400, detail="Aucune donnée à mettre à jour.")

    set_clauses = [f"{champ} = ${i+2}" for i, champ in enumerate(champs.keys())]
    query = f"""
        UPDATE familles SET {', '.join(set_clauses)}
        WHERE id = $1
        RETURNING id, nom_famille, telephone, email
    """
    row = await pool.fetchrow(query, famille_id, *champs.values())
    if row is None:
        raise HTTPException(status_code=404, detail="Famille introuvable.")
    return FamilleOut(**dict(row))


@router.delete("/{famille_id}", status_code=status.HTTP_204_NO_CONTENT)
async def supprimer_famille(famille_id: int):
    pool = get_pool()
    result = await pool.execute("DELETE FROM familles WHERE id = $1", famille_id)
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Famille introuvable.")
