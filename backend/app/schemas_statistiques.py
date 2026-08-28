from pydantic import BaseModel


class TauxPresenceCours(BaseModel):
    cours_id: int
    cours_nom: str
    total_seances: int
    total_presences_possibles: int
    total_presences_reelles: int
    taux_pourcentage: float


class RepartitionCategorieAge(BaseModel):
    categorie: str
    effectif: int


class RepartitionGrade(BaseModel):
    grade: str
    effectif: int


class RepartitionLicenceStatut(BaseModel):
    statut: str
    effectif: int


class PodiumsJudoka(BaseModel):
    judoka_id: int
    nom: str
    prenom: str
    premieres_places: int
    deuxiemes_places: int
    troisiemes_places: int
    total_podiums: int


class StatistiquesGlobales(BaseModel):
    taux_presence_par_cours: list[TauxPresenceCours]
    repartition_categorie_age: list[RepartitionCategorieAge]
    repartition_grade: list[RepartitionGrade]
    repartition_licence_statut: list[RepartitionLicenceStatut]
    podiums_par_judoka: list[PodiumsJudoka]
    total_adherents_actifs: int
    total_judokas: int
