from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_pool
from app.dependencies import get_current_user
from app.schemas_competitions import (
    CompetitionCreate,
    CompetitionOut,
    CompetitionUpdate,
    ResultatCreate,
    ResultatOut,
    PalmaresJudoka,
)

router = APIRouter(
    prefix="/competitions",
    tags=["competitions"],
    dependencies=[Depends(get_current_user)],
)


# ============================================================
# COMPETITIONS
# ============================================================

@router.post("", response_model=CompetitionOut, status_code=status.HTTP_201_CREATED)
async def creer_competition(payload: CompetitionCreate):
    pool = get_pool()
    row = await pool.fetchrow(
        """
        INSERT INTO competitions (nom, type, date_debut, date_fin, lieu, notes)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, nom, type, date_debut, date_fin, lieu, notes
        """,
        payload.nom, payload.type, payload.date_debut, payload.date_fin,
        payload.lieu, payload.notes,
    )
    return CompetitionOut(**dict(row))


@router.get("", response_model=list[CompetitionOut])
async def lister_competitions():
    pool = get_pool()
    rows = await pool.fetch(
        "SELECT id, nom, type, date_debut, date_fin, lieu, notes FROM competitions ORDER BY date_debut DESC"
    )
    return [CompetitionOut(**dict(r)) for r in rows]


@router.get("/{competition_id}", response_model=CompetitionOut)
async def obtenir_competition(competition_id: int):
    pool = get_pool()
    row = await pool.fetchrow(
        "SELECT id, nom, type, date_debut, date_fin, lieu, notes FROM competitions WHERE id = $1",
        competition_id,
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Compétition introuvable.")
    return CompetitionOut(**dict(row))


@router.put("/{competition_id}", response_model=CompetitionOut)
async def modifier_competition(competition_id: int, payload: CompetitionUpdate):
    pool = get_pool()
    champs = payload.model_dump(exclude_unset=True)
    if not champs:
        raise HTTPException(status_code=400, detail="Aucune donnée à mettre à jour.")

    set_clauses = [f"{champ} = ${i+2}" for i, champ in enumerate(champs.keys())]
    query = f"""
        UPDATE competitions SET {', '.join(set_clauses)}
        WHERE id = $1
        RETURNING id, nom, type, date_debut, date_fin, lieu, notes
    """
    row = await pool.fetchrow(query, competition_id, *champs.values())
    if row is None:
        raise HTTPException(status_code=404, detail="Compétition introuvable.")
    return CompetitionOut(**dict(row))


@router.delete("/{competition_id}", status_code=status.HTTP_204_NO_CONTENT)
async def supprimer_competition(competition_id: int):
    pool = get_pool()
    result = await pool.execute("DELETE FROM competitions WHERE id = $1", competition_id)
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Compétition introuvable.")


# ============================================================
# RESULTATS
# ============================================================

@router.post("/{competition_id}/resultats", response_model=ResultatOut, status_code=status.HTTP_201_CREATED)
async def ajouter_resultat(competition_id: int, payload: ResultatCreate):
    pool = get_pool()
    try:
        row = await pool.fetchrow(
            """
            INSERT INTO resultats (judoka_id, competition_id, categorie_poids, rang, victoires, defaites, notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, judoka_id, competition_id, categorie_poids, rang, victoires, defaites, notes
            """,
            payload.judoka_id, competition_id, payload.categorie_poids,
            payload.rang, payload.victoires, payload.defaites, payload.notes,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Impossible d'ajouter ce résultat : {e}")

    return ResultatOut(**dict(row))


@router.get("/{competition_id}/resultats", response_model=list[ResultatOut])
async def lister_resultats(competition_id: int):
    pool = get_pool()
    rows = await pool.fetch(
        """
        SELECT r.id, r.judoka_id, r.competition_id, r.categorie_poids, r.rang,
               r.victoires, r.defaites, r.notes,
               a.nom AS judoka_nom, a.prenom AS judoka_prenom
        FROM resultats r
        JOIN judokas j ON j.id = r.judoka_id
        JOIN adherents a ON a.id = j.adherent_id
        WHERE r.competition_id = $1
        ORDER BY r.rang NULLS LAST, a.nom, a.prenom
        """,
        competition_id,
    )
    return [ResultatOut(**dict(r)) for r in rows]


@router.delete("/{competition_id}/resultats/{resultat_id}", status_code=status.HTTP_204_NO_CONTENT)
async def supprimer_resultat(competition_id: int, resultat_id: int):
    pool = get_pool()
    result = await pool.execute(
        "DELETE FROM resultats WHERE id = $1 AND competition_id = $2",
        resultat_id, competition_id,
    )
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Résultat introuvable pour cette compétition.")


# ============================================================
# PALMARES PAR JUDOKA (historique complet, hors préfixe /competitions)
# ============================================================

palmares_router = APIRouter(
    prefix="/judokas",
    tags=["competitions"],
    dependencies=[Depends(get_current_user)],
)


@palmares_router.get("/{judoka_id}/palmares", response_model=list[PalmaresJudoka])
async def obtenir_palmares(judoka_id: int):
    pool = get_pool()
    rows = await pool.fetch(
        """
        SELECT r.id AS resultat_id, c.id AS competition_id, c.nom AS competition_nom,
               c.date_debut AS competition_date, r.categorie_poids, r.rang,
               r.victoires, r.defaites
        FROM resultats r
        JOIN competitions c ON c.id = r.competition_id
        WHERE r.judoka_id = $1
        ORDER BY c.date_debut DESC
        """,
        judoka_id,
    )
    return [PalmaresJudoka(**dict(r)) for r in rows]
