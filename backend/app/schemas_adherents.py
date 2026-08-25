from datetime import date
from pydantic import BaseModel, EmailStr


# ---------- Adhérent ----------

class AdherentBase(BaseModel):
    nom: str
    prenom: str
    email: EmailStr | None = None
    telephone: str | None = None
    adresse: str | None = None
    code_postal: str | None = None
    ville: str | None = None
    actif: bool = True


class AdherentCreate(AdherentBase):
    pass


class AdherentUpdate(BaseModel):
    nom: str | None = None
    prenom: str | None = None
    email: EmailStr | None = None
    telephone: str | None = None
    adresse: str | None = None
    code_postal: str | None = None
    ville: str | None = None
    actif: bool | None = None


class AdherentOut(AdherentBase):
    id: int


# ---------- Judoka ----------

GRADES_VALIDES = [
    "blanche", "blanche-jaune", "jaune", "jaune-orange", "orange", "orange-verte",
    "verte", "verte-bleue", "bleue", "bleue-marron", "marron",
    "1er dan", "2eme dan", "3eme dan", "4eme dan", "5eme dan",
    "6eme dan", "7eme dan", "8eme dan", "9eme dan", "10eme dan",
]


class JudokaBase(BaseModel):
    date_naissance: date
    sexe: str  # 'M' ou 'F'
    numero_licence_ffj: str | None = None
    licence_saison: str | None = None
    licence_statut: str = "non_transmise"
    grade_actuel: str = "blanche"
    date_obtention_grade_actuel: date | None = None
    certificat_medical_date: date | None = None
    certificat_medical_validite: date | None = None
    contact_urgence_nom: str | None = None
    contact_urgence_tel: str | None = None


class JudokaCreate(JudokaBase):
    pass


class JudokaUpdate(BaseModel):
    date_naissance: date | None = None
    sexe: str | None = None
    numero_licence_ffj: str | None = None
    licence_saison: str | None = None
    licence_statut: str | None = None
    grade_actuel: str | None = None
    date_obtention_grade_actuel: date | None = None
    certificat_medical_date: date | None = None
    certificat_medical_validite: date | None = None
    contact_urgence_nom: str | None = None
    contact_urgence_tel: str | None = None


class JudokaOut(JudokaBase):
    id: int
    adherent_id: int
    categorie_age: str | None = None  # calculée, non stockée


# ---------- Combiné (création en une fois) ----------

class AdherentJudokaCreate(BaseModel):
    """Créer un adhérent et sa fiche judoka en une seule requête."""
    adherent: AdherentCreate
    judoka: JudokaCreate


class AdherentJudokaOut(BaseModel):
    adherent: AdherentOut
    judoka: JudokaOut | None = None
