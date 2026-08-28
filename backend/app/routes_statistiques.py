from fastapi import APIRouter, Depends

from app.database import get_pool
from app.dependencies import get_current_user
from app.schemas_statistiques import (
    StatistiquesGlobales,
    TauxPresenceCours,
    RepartitionCategorieAge,
    RepartitionGrade,
    RepartitionLicenceStatut,
    PodiumsJudoka,
)

router = APIRouter(
    prefix="/statistiques",
    tags=["statistiques"],
    dependencies=[Depends(get_current_user)],
)


@router.get("", response_model=StatistiquesGlobales)
async def obtenir_statistiques():
    pool = get_pool()

    # ---- Taux de présence par cours ----
    rows_presence = await pool.fetch(
        """
        SELECT
            c.id AS cours_id,
            c.nom AS cours_nom,
            COUNT(DISTINCT pr.date_seance) AS total_seances,
            COUNT(pr.id) AS total_presences_possibles,
            COUNT(pr.id) FILTER (WHERE pr.present = true) AS total_presences_reelles
        FROM cours c
        LEFT JOIN presences pr ON pr.cours_id = c.id
        GROUP BY c.id, c.nom
        ORDER BY c.nom
        """
    )
    taux_presence = [
        TauxPresenceCours(
            cours_id=r["cours_id"],
            cours_nom=r["cours_nom"],
            total_seances=r["total_seances"],
            total_presences_possibles=r["total_presences_possibles"],
            total_presences_reelles=r["total_presences_reelles"],
            taux_pourcentage=round(
                (r["total_presences_reelles"] / r["total_presences_possibles"] * 100)
                if r["total_presences_possibles"] > 0 else 0,
                1,
            ),
        )
        for r in rows_presence
    ]

    # ---- Répartition par catégorie d'âge ----
    rows_categorie = await pool.fetch(
        """
        SELECT categorie_age_ffjda(j.date_naissance) AS categorie, COUNT(*) AS effectif
        FROM judokas j
        JOIN adherents a ON a.id = j.adherent_id
        WHERE a.actif = true
        GROUP BY categorie_age_ffjda(j.date_naissance)
        ORDER BY effectif DESC
        """
    )
    repartition_categorie = [RepartitionCategorieAge(**dict(r)) for r in rows_categorie]

    # ---- Répartition par grade ----
    rows_grade = await pool.fetch(
        """
        SELECT j.grade_actuel AS grade, COUNT(*) AS effectif
        FROM judokas j
        JOIN adherents a ON a.id = j.adherent_id
        WHERE a.actif = true
        GROUP BY j.grade_actuel
        ORDER BY effectif DESC
        """
    )
    repartition_grade = [RepartitionGrade(**dict(r)) for r in rows_grade]

    # ---- Répartition des licences par statut ----
    rows_licence = await pool.fetch(
        """
        SELECT j.licence_statut AS statut, COUNT(*) AS effectif
        FROM judokas j
        JOIN adherents a ON a.id = j.adherent_id
        WHERE a.actif = true
        GROUP BY j.licence_statut
        ORDER BY effectif DESC
        """
    )
    repartition_licence = [RepartitionLicenceStatut(**dict(r)) for r in rows_licence]

    # ---- Podiums par judoka ----
    rows_podiums = await pool.fetch(
        """
        SELECT
            j.id AS judoka_id,
            a.nom, a.prenom,
            COUNT(*) FILTER (WHERE r.rang = 1) AS premieres_places,
            COUNT(*) FILTER (WHERE r.rang = 2) AS deuxiemes_places,
            COUNT(*) FILTER (WHERE r.rang = 3) AS troisiemes_places,
            COUNT(*) FILTER (WHERE r.rang IN (1, 2, 3)) AS total_podiums
        FROM resultats r
        JOIN judokas j ON j.id = r.judoka_id
        JOIN adherents a ON a.id = j.adherent_id
        GROUP BY j.id, a.nom, a.prenom
        HAVING COUNT(*) FILTER (WHERE r.rang IN (1, 2, 3)) > 0
        ORDER BY total_podiums DESC
        LIMIT 20
        """
    )
    podiums = [PodiumsJudoka(**dict(r)) for r in rows_podiums]

    # ---- Totaux ----
    total_adherents = await pool.fetchval("SELECT COUNT(*) FROM adherents WHERE actif = true")
    total_judokas = await pool.fetchval(
        """
        SELECT COUNT(*) FROM judokas j
        JOIN adherents a ON a.id = j.adherent_id
        WHERE a.actif = true
        """
    )

    return StatistiquesGlobales(
        taux_presence_par_cours=taux_presence,
        repartition_categorie_age=repartition_categorie,
        repartition_grade=repartition_grade,
        repartition_licence_statut=repartition_licence,
        podiums_par_judoka=podiums,
        total_adherents_actifs=total_adherents,
        total_judokas=total_judokas,
    )
