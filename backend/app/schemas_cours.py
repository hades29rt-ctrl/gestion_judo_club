from datetime import date, time
from pydantic import BaseModel, Field


# ---------- Cours ----------

class CoursBase(BaseModel):
    nom: str
    categorie_age_cible: str | None = None
    professeur: str | None = None
    jour_semaine: int | None = Field(default=None, ge=1, le=6)  # 1 = lundi ... 6 = samedi (pas de cours le dimanche)
    heure_debut: time | None = None
    heure_fin: time | None = None
    lieu: str | None = None
    actif: bool = True


class CoursCreate(CoursBase):
    pass


class CoursUpdate(BaseModel):
    nom: str | None = None
    categorie_age_cible: str | None = None
    professeur: str | None = None
    jour_semaine: int | None = Field(default=None, ge=1, le=6)
    heure_debut: time | None = None
    heure_fin: time | None = None
    lieu: str | None = None
    actif: bool | None = None


class CoursOut(CoursBase):
    id: int


# ---------- Inscription à un cours ----------

class InscriptionCreate(BaseModel):
    judoka_id: int
    cours_id: int
    saison: str  # ex : '2025-2026'


class InscriptionOut(BaseModel):
    id: int
    judoka_id: int
    cours_id: int
    saison: str
    date_inscription: date
    # infos jointes pour affichage direct côté frontend
    judoka_nom: str | None = None
    judoka_prenom: str | None = None
    judoka_email: str | None = None


# ---------- Présences ----------

class PresenceUpsert(BaseModel):
    """Une ligne d'appel pour un judoka donné à une séance donnée."""
    judoka_id: int
    present: bool
    notes: str | None = None


class AppelSeance(BaseModel):
    """Corps de requête pour enregistrer l'appel complet d'une séance."""
    cours_id: int
    date_seance: date
    presences: list[PresenceUpsert]


class PresenceOut(BaseModel):
    id: int
    judoka_id: int
    cours_id: int
    date_seance: date
    present: bool
    notes: str | None = None
    judoka_nom: str | None = None
    judoka_prenom: str | None = None
