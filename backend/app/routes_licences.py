import csv
import io

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse

from app.database import get_pool
from app.dependencies import get_current_user
from app.schemas_licences import LicenceOut, LicenceUpdate

router = APIRouter(
    prefix="/licences",
    tags=["licences"],
    dependencies=[Depends(get_current_user)],
)


_SELECT_LICENCES = """
    SELECT j.id AS judoka_id, a.nom AS adherent_nom, a.prenom AS adherent_prenom,
           j.numero_licence_ffj, j.licence_saison, j.licence_statut
    FROM judokas j
    JOIN adherents a ON a.id = j.adherent_id
"""


@router.get("", response_model=list[LicenceOut])
async def lister_licences(statut: str | None = None, saison: str | None = None):
    pool = get_pool()
    query = _SELECT_LICENCES
    clauses = []
    params = []

    if statut is not None:
        clauses.append(f"j.licence_statut = ${len(params) + 1}")
        params.append(statut)
    if saison is not None:
        clauses.append(f"j.licence_saison = ${len(params) + 1}")
        params.append(saison)

    if clauses:
        query += " WHERE " + " AND ".join(clauses)
    query += " ORDER BY a.nom, a.prenom"

    rows = await pool.fetch(query, *params)
    return [LicenceOut(**dict(r)) for r in rows]


@router.put("/{judoka_id}", response_model=LicenceOut)
async def modifier_licence(judoka_id: int, payload: LicenceUpdate):
    pool = get_pool()
    row = await pool.fetchrow(
        """
        UPDATE judokas
        SET numero_licence_ffj = $2, licence_saison = $3, licence_statut = $4
        WHERE id = $1
        RETURNING id
        """,
        judoka_id, payload.numero_licence_ffj, payload.licence_saison, payload.licence_statut,
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Judoka introuvable.")

    result = await pool.fetchrow(_SELECT_LICENCES + " WHERE j.id = $1", judoka_id)
    return LicenceOut(**dict(result))


@router.get("/export.csv")
async def exporter_licences_csv(saison: str | None = None):
    """
    Export CSV des licences, prêt à être utilisé comme base de saisie
    manuelle sur l'extranet FFJDA (pas d'API officielle disponible).
    """
    pool = get_pool()
    query = _SELECT_LICENCES
    params = []
    if saison is not None:
        query += " WHERE j.licence_saison = $1"
        params.append(saison)
    query += " ORDER BY a.nom, a.prenom"

    rows = await pool.fetch(query, *params)

    buffer = io.StringIO()
    writer = csv.writer(buffer, delimiter=";")
    writer.writerow(["Nom", "Prénom", "Numéro licence FFJ", "Saison", "Statut"])
    for r in rows:
        writer.writerow([
            r["adherent_nom"],
            r["adherent_prenom"],
            r["numero_licence_ffj"] or "",
            r["licence_saison"] or "",
            r["licence_statut"],
        ])

    buffer.seek(0)
    filename = f"licences_ffj{'_' + saison if saison else ''}.csv"
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
