from datetime import date
from typing import Literal
from pydantic import BaseModel

TypeCompetition = Literal["tournoi", "stage", "competition_officielle", "animation"]


# ---------- Compétition ----------

class CompetitionBase(BaseModel):
    nom: str
    type: TypeCompetition = "tournoi"
    date_debut: date
    date_fin: date | None = None
    lieu: str | None = None
    notes: str | None = None


class CompetitionCreate(CompetitionBase):
    pass


class CompetitionUpdate(BaseModel):
    nom: str | None = None
    type: TypeCompetition | None = None
    date_debut: date | None = None
    date_fin: date | None = None
    lieu: str | None = None
    notes: str | None = None


class CompetitionOut(CompetitionBase):
    id: int


# ---------- Résultat ----------

class ResultatCreate(BaseModel):
    judoka_id: int
    categorie_poids: str | None = None
    rang: int | None = None
    victoires: int = 0
    defaites: int = 0
    notes: str | None = None


class ResultatOut(BaseModel):
    id: int
    judoka_id: int
    competition_id: int
    categorie_poids: str | None
    rang: int | None
    victoires: int
    defaites: int
    notes: str | None
    judoka_nom: str | None = None
    judoka_prenom: str | None = None


class PalmaresJudoka(BaseModel):
    """Historique complet des résultats d'un judoka, toutes compétitions confondues."""
    resultat_id: int
    competition_id: int
    competition_nom: str
    competition_date: date
    categorie_poids: str | None
    rang: int | None
    victoires: int
    defaites: int
