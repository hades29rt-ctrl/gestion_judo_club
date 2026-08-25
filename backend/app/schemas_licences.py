from datetime import datetime
from typing import Literal
from pydantic import BaseModel

StatutLicence = Literal["non_transmise", "en_attente", "transmise", "validee", "expiree"]


class LicenceUpdate(BaseModel):
    numero_licence_ffj: str | None = None
    licence_saison: str | None = None
    licence_statut: StatutLicence


class LicenceOut(BaseModel):
    judoka_id: int
    adherent_nom: str
    adherent_prenom: str
    numero_licence_ffj: str | None
    licence_saison: str | None
    licence_statut: StatutLicence
