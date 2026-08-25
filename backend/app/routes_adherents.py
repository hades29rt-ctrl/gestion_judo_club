from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_pool
from app.dependencies import get_current_user
from app.schemas_auth import UtilisateurOut
from app.utils_licence import generer_numero_licence_ffj
from app.schemas_adherents import (
    AdherentJudokaCreate,
    AdherentJudokaOut,
    AdherentOut,
    AdherentUpdate,
    JudokaOut,
    JudokaUpdate,
)

router = APIRouter(
    prefix="/adherents",
    tags=["adherents"],
    dependencies=[Depends(get_current_user)],  # toutes les routes exigent d'être connecté
)


def _row_to_judoka_out(row) -> JudokaOut | None:
    if row is None or row["judoka_id"] is None:
        return None
    return JudokaOut(
        id=row["judoka_id"],
        adherent_id=row["adherent_id"],
        date_naissance=row["date_naissance"],
        sexe=row["sexe"],
        numero_licence_ffj=row["numero_licence_ffj"],
        licence_saison=row["licence_saison"],
        licence_statut=row["licence_statut"],
        grade_actuel=row["grade_actuel"],
        date_obtention_grade_actuel=row["date_obtention_grade_actuel"],
        certificat_medical_date=row["certificat_medical_date"],
        certificat_medical_validite=row["certificat_medical_validite"],
        contact_urgence_nom=row["contact_urgence_nom"],
        contact_urgence_tel=row["contact_urgence_tel"],
        categorie_age=row["categorie_age"],
    )


_SELECT_JOINT = """
    SELECT
        a.id AS adherent_id, a.nom, a.prenom, a.email, a.telephone,
        a.adresse, a.code_postal, a.ville, a.actif,
        j.id AS judoka_id, j.date_naissance, j.sexe,
        j.numero_licence_ffj, j.licence_saison, j.licence_statut,
        j.grade_actuel, j.date_obtention_grade_actuel,
        j.certificat_medical_date, j.certificat_medical_validite,
        j.contact_urgence_nom, j.contact_urgence_tel,
        CASE WHEN j.id IS NOT NULL
             THEN categorie_age_ffjda(j.date_naissance)
             ELSE NULL
        END AS categorie_age
    FROM adherents a
    LEFT JOIN judokas j ON j.adherent_id = a.id
"""


@router.post("", response_model=AdherentJudokaOut, status_code=status.HTTP_201_CREATED)
async def creer_adherent_judoka(payload: AdherentJudokaCreate):
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            adherent_row = await conn.fetchrow(
                """
                INSERT INTO adherents (nom, prenom, email, telephone, adresse, code_postal, ville, actif)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id, nom, prenom, email, telephone, adresse, code_postal, ville, actif
                """,
                payload.adherent.nom, payload.adherent.prenom, payload.adherent.email,
                payload.adherent.telephone, payload.adherent.adresse,
                payload.adherent.code_postal, payload.adherent.ville, payload.adherent.actif,
            )

            j = payload.judoka
            numero_licence = j.numero_licence_ffj or generer_numero_licence_ffj(
                j.sexe, j.date_naissance, payload.adherent.nom
            )
            judoka_row = await conn.fetchrow(
                """
                INSERT INTO judokas (
                    adherent_id, date_naissance, sexe, numero_licence_ffj, licence_saison,
                    licence_statut, grade_actuel, date_obtention_grade_actuel,
                    certificat_medical_date, certificat_medical_validite,
                    contact_urgence_nom, contact_urgence_tel
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING id, adherent_id, date_naissance, sexe, numero_licence_ffj,
                          licence_saison, licence_statut, grade_actuel,
                          date_obtention_grade_actuel, certificat_medical_date,
                          certificat_medical_validite, contact_urgence_nom, contact_urgence_tel,
                          categorie_age_ffjda(date_naissance) AS categorie_age
                """,
                adherent_row["id"], j.date_naissance, j.sexe, numero_licence,
                j.licence_saison, j.licence_statut, j.grade_actuel,
                j.date_obtention_grade_actuel, j.certificat_medical_date,
                j.certificat_medical_validite, j.contact_urgence_nom, j.contact_urgence_tel,
            )

    return AdherentJudokaOut(
        adherent=AdherentOut(**dict(adherent_row)),
        judoka=JudokaOut(**dict(judoka_row)),
    )


@router.get("", response_model=list[AdherentJudokaOut])
async def lister_adherents(actif: bool | None = None):
    pool = get_pool()
    query = _SELECT_JOINT
    params = []
    if actif is not None:
        query += " WHERE a.actif = $1"
        params.append(actif)
    query += " ORDER BY a.nom, a.prenom"

    rows = await pool.fetch(query, *params)
    return [
        AdherentJudokaOut(
            adherent=AdherentOut(
                id=r["adherent_id"], nom=r["nom"], prenom=r["prenom"], email=r["email"],
                telephone=r["telephone"], adresse=r["adresse"], code_postal=r["code_postal"],
                ville=r["ville"], actif=r["actif"],
            ),
            judoka=_row_to_judoka_out(r),
        )
        for r in rows
    ]


@router.get("/{adherent_id}", response_model=AdherentJudokaOut)
async def obtenir_adherent(adherent_id: int):
    pool = get_pool()
    row = await pool.fetchrow(_SELECT_JOINT + " WHERE a.id = $1", adherent_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Adhérent introuvable.")

    return AdherentJudokaOut(
        adherent=AdherentOut(
            id=row["adherent_id"], nom=row["nom"], prenom=row["prenom"], email=row["email"],
            telephone=row["telephone"], adresse=row["adresse"], code_postal=row["code_postal"],
            ville=row["ville"], actif=row["actif"],
        ),
        judoka=_row_to_judoka_out(row),
    )


@router.put("/{adherent_id}", response_model=AdherentOut)
async def modifier_adherent(adherent_id: int, payload: AdherentUpdate):
    pool = get_pool()
    champs = payload.model_dump(exclude_unset=True)
    if not champs:
        raise HTTPException(status_code=400, detail="Aucune donnée à mettre à jour.")

    set_clauses = [f"{champ} = ${i+2}" for i, champ in enumerate(champs.keys())]
    query = f"""
        UPDATE adherents SET {', '.join(set_clauses)}
        WHERE id = $1
        RETURNING id, nom, prenom, email, telephone, adresse, code_postal, ville, actif
    """
    row = await pool.fetchrow(query, adherent_id, *champs.values())
    if row is None:
        raise HTTPException(status_code=404, detail="Adhérent introuvable.")
    return AdherentOut(**dict(row))


@router.put("/{adherent_id}/judoka", response_model=JudokaOut)
async def modifier_judoka(adherent_id: int, payload: JudokaUpdate):
    pool = get_pool()
    champs = payload.model_dump(exclude_unset=True)
    if not champs:
        raise HTTPException(status_code=400, detail="Aucune donnée à mettre à jour.")

    set_clauses = [f"{champ} = ${i+2}" for i, champ in enumerate(champs.keys())]
    query = f"""
        UPDATE judokas SET {', '.join(set_clauses)}
        WHERE adherent_id = $1
        RETURNING id, adherent_id, date_naissance, sexe, numero_licence_ffj,
                  licence_saison, licence_statut, grade_actuel,
                  date_obtention_grade_actuel, certificat_medical_date,
                  certificat_medical_validite, contact_urgence_nom, contact_urgence_tel,
                  categorie_age_ffjda(date_naissance) AS categorie_age
    """
    row = await pool.fetchrow(query, adherent_id, *champs.values())
    if row is None:
        raise HTTPException(status_code=404, detail="Fiche judoka introuvable pour cet adhérent.")
    return JudokaOut(**dict(row))


@router.post("/{adherent_id}/judoka/generer-licence", response_model=JudokaOut)
async def regenerer_numero_licence(adherent_id: int):
    """Régénère le numéro de licence FFJ à partir des infos actuelles du judoka."""
    pool = get_pool()
    row = await pool.fetchrow(
        """
        SELECT j.sexe, j.date_naissance, a.nom
        FROM judokas j
        JOIN adherents a ON a.id = j.adherent_id
        WHERE j.adherent_id = $1
        """,
        adherent_id,
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Fiche judoka introuvable pour cet adhérent.")

    numero = generer_numero_licence_ffj(row["sexe"], row["date_naissance"], row["nom"])

    updated = await pool.fetchrow(
        """
        UPDATE judokas SET numero_licence_ffj = $2
        WHERE adherent_id = $1
        RETURNING id, adherent_id, date_naissance, sexe, numero_licence_ffj,
                  licence_saison, licence_statut, grade_actuel,
                  date_obtention_grade_actuel, certificat_medical_date,
                  certificat_medical_validite, contact_urgence_nom, contact_urgence_tel,
                  categorie_age_ffjda(date_naissance) AS categorie_age
        """,
        adherent_id, numero,
    )
    return JudokaOut(**dict(updated))


@router.delete("/{adherent_id}", status_code=status.HTTP_204_NO_CONTENT)
async def supprimer_adherent(adherent_id: int):
    pool = get_pool()
    result = await pool.execute("DELETE FROM adherents WHERE id = $1", adherent_id)
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Adhérent introuvable.")
