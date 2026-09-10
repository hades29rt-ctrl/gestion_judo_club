from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_pool
from app.dependencies import get_current_user
from app.schemas_cours import (
    CoursCreate,
    CoursOut,
    CoursUpdate,
    InscriptionCreate,
    InscriptionOut,
    AppelSeance,
    PresenceOut,
)

router = APIRouter(
    prefix="/cours",
    tags=["cours"],
    dependencies=[Depends(get_current_user)],
)


# ============================================================
# COURS
# ============================================================

@router.post("", response_model=CoursOut, status_code=status.HTTP_201_CREATED)
async def creer_cours(payload: CoursCreate):
    pool = get_pool()
    row = await pool.fetchrow(
        """
        INSERT INTO cours (nom, categorie_age_cible, professeur, jour_semaine, heure_debut, heure_fin, lieu, actif)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, nom, categorie_age_cible, professeur, jour_semaine, heure_debut, heure_fin, lieu, actif
        """,
        payload.nom, payload.categorie_age_cible, payload.professeur,
        payload.jour_semaine, payload.heure_debut, payload.heure_fin,
        payload.lieu, payload.actif,
    )
    return CoursOut(**dict(row))


@router.get("", response_model=list[CoursOut])
async def lister_cours(actif: bool | None = None):
    pool = get_pool()
    query = "SELECT id, nom, categorie_age_cible, professeur, jour_semaine, heure_debut, heure_fin, lieu, actif FROM cours"
    params = []
    if actif is not None:
        query += " WHERE actif = $1"
        params.append(actif)
    query += " ORDER BY jour_semaine NULLS LAST, heure_debut NULLS LAST"
    rows = await pool.fetch(query, *params)
    return [CoursOut(**dict(r)) for r in rows]


@router.get("/{cours_id}", response_model=CoursOut)
async def obtenir_cours(cours_id: int):
    pool = get_pool()
    row = await pool.fetchrow(
        "SELECT id, nom, categorie_age_cible, professeur, jour_semaine, heure_debut, heure_fin, lieu, actif FROM cours WHERE id = $1",
        cours_id,
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Cours introuvable.")
    return CoursOut(**dict(row))


@router.put("/{cours_id}", response_model=CoursOut)
async def modifier_cours(cours_id: int, payload: CoursUpdate):
    pool = get_pool()
    champs = payload.model_dump(exclude_unset=True)
    if not champs:
        raise HTTPException(status_code=400, detail="Aucune donnée à mettre à jour.")

    set_clauses = [f"{champ} = ${i+2}" for i, champ in enumerate(champs.keys())]
    query = f"""
        UPDATE cours SET {', '.join(set_clauses)}
        WHERE id = $1
        RETURNING id, nom, categorie_age_cible, professeur, jour_semaine, heure_debut, heure_fin, lieu, actif
    """
    row = await pool.fetchrow(query, cours_id, *champs.values())
    if row is None:
        raise HTTPException(status_code=404, detail="Cours introuvable.")
    return CoursOut(**dict(row))


@router.delete("/{cours_id}", status_code=status.HTTP_204_NO_CONTENT)
async def supprimer_cours(cours_id: int):
    pool = get_pool()
    result = await pool.execute("DELETE FROM cours WHERE id = $1", cours_id)
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Cours introuvable.")


# ============================================================
# INSCRIPTIONS
# ============================================================

@router.post("/{cours_id}/inscriptions", response_model=InscriptionOut, status_code=status.HTTP_201_CREATED)
async def inscrire_judoka(cours_id: int, payload: InscriptionCreate):
    if payload.cours_id != cours_id:
        raise HTTPException(status_code=400, detail="cours_id incohérent entre l'URL et le corps de la requête.")

    pool = get_pool()
    try:
        row = await pool.fetchrow(
            """
            INSERT INTO inscriptions_cours (judoka_id, cours_id, saison)
            VALUES ($1, $2, $3)
            RETURNING id, judoka_id, cours_id, saison, date_inscription
            """,
            payload.judoka_id, cours_id, payload.saison,
        )
    except Exception as e:
        if "unique" in str(e).lower() or "duplicate" in str(e).lower():
            raise HTTPException(status_code=409, detail="Ce judoka est déjà inscrit à ce cours pour cette saison.")
        raise HTTPException(status_code=400, detail=f"Impossible d'inscrire ce judoka : {e}")

    return InscriptionOut(**dict(row))


@router.get("/{cours_id}/inscriptions", response_model=list[InscriptionOut])
async def lister_inscriptions(cours_id: int, saison: str | None = None):
    pool = get_pool()
    query = """
        SELECT ic.id, ic.judoka_id, ic.cours_id, ic.saison, ic.date_inscription,
               a.nom AS judoka_nom, a.prenom AS judoka_prenom, f.email AS judoka_email
        FROM inscriptions_cours ic
        JOIN judokas j ON j.id = ic.judoka_id
        JOIN adherents a ON a.id = j.adherent_id
        LEFT JOIN familles f ON f.id = a.famille_id
        WHERE ic.cours_id = $1
    """
    params = [cours_id]
    if saison is not None:
        query += " AND ic.saison = $2"
        params.append(saison)
    query += " ORDER BY a.nom, a.prenom"

    rows = await pool.fetch(query, *params)
    return [InscriptionOut(**dict(r)) for r in rows]


@router.delete("/{cours_id}/inscriptions/{inscription_id}", status_code=status.HTTP_204_NO_CONTENT)
async def desinscrire_judoka(cours_id: int, inscription_id: int):
    pool = get_pool()
    result = await pool.execute(
        "DELETE FROM inscriptions_cours WHERE id = $1 AND cours_id = $2",
        inscription_id, cours_id,
    )
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Inscription introuvable pour ce cours.")


# ============================================================
# PRESENCES (appel numérique)
# ============================================================

@router.post("/{cours_id}/appel", response_model=list[PresenceOut], status_code=status.HTTP_201_CREATED)
async def enregistrer_appel(cours_id: int, payload: AppelSeance):
    if payload.cours_id != cours_id:
        raise HTTPException(status_code=400, detail="cours_id incohérent entre l'URL et le corps de la requête.")

    pool = get_pool()
    resultats = []
    try:
        async with pool.acquire() as conn:
            async with conn.transaction():
                for p in payload.presences:
                    row = await conn.fetchrow(
                        """
                        INSERT INTO presences (judoka_id, cours_id, date_seance, present, notes)
                        VALUES ($1, $2, $3, $4, $5)
                        ON CONFLICT (judoka_id, cours_id, date_seance)
                        DO UPDATE SET present = EXCLUDED.present, notes = EXCLUDED.notes
                        RETURNING id, judoka_id, cours_id, date_seance, present, notes
                        """,
                        p.judoka_id, cours_id, payload.date_seance, p.present, p.notes,
                    )
                    resultats.append(row)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Impossible d'enregistrer l'appel : {e}")

    return [PresenceOut(**dict(r)) for r in resultats]


@router.get("/{cours_id}/appel", response_model=list[PresenceOut])
async def obtenir_appel(cours_id: int, date_seance: date):
    pool = get_pool()
    rows = await pool.fetch(
        """
        SELECT pr.id, pr.judoka_id, pr.cours_id, pr.date_seance, pr.present, pr.notes,
               a.nom AS judoka_nom, a.prenom AS judoka_prenom
        FROM presences pr
        JOIN judokas j ON j.id = pr.judoka_id
        JOIN adherents a ON a.id = j.adherent_id
        WHERE pr.cours_id = $1 AND pr.date_seance = $2
        ORDER BY a.nom, a.prenom
        """,
        cours_id, date_seance,
    )
    return [PresenceOut(**dict(r)) for r in rows]
