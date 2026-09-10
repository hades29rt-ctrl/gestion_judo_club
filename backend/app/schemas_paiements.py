from datetime import datetime
from typing import Literal
from pydantic import BaseModel, model_validator

TypePaiement = Literal["cotisation", "stage", "tournoi", "autre"]
StatutPaiement = Literal["en_attente", "paye", "echoue", "annule"]


class PaiementCreate(BaseModel):
    judoka_id: int
    competition_id: int | None = None
    type: TypePaiement = "cotisation"
    libelle: str
    montant_centimes: int  # tarif plein, avant réduction
    reduction_centimes: int = 0  # ex : réduction fratrie, montant fixe
    saison: str | None = None

    @model_validator(mode="after")
    def _verifier_reduction(self):
        if self.reduction_centimes < 0:
            raise ValueError("La réduction ne peut pas être négative.")
        if self.reduction_centimes >= self.montant_centimes:
            raise ValueError("La réduction ne peut pas être supérieure ou égale au montant.")
        return self

    @property
    def montant_net_centimes(self) -> int:
        return self.montant_centimes - self.reduction_centimes


class PaiementOut(BaseModel):
    id: int
    judoka_id: int
    competition_id: int | None
    type: TypePaiement
    libelle: str
    montant_centimes: int
    reduction_centimes: int
    montant_net_centimes: int
    saison: str | None
    statut: StatutPaiement
    checkout_intent_id: int | None
    date_creation: datetime
    date_paiement: datetime | None
    judoka_nom: str | None = None
    judoka_prenom: str | None = None


class PaiementInitieOut(BaseModel):
    """Réponse renvoyée à la création : le paiement local + le lien HelloAsso à ouvrir."""
    paiement: PaiementOut
    redirect_url: str
