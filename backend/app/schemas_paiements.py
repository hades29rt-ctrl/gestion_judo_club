from datetime import datetime
from typing import Literal
from pydantic import BaseModel

TypePaiement = Literal["cotisation", "stage", "tournoi", "autre"]
StatutPaiement = Literal["en_attente", "paye", "echoue", "annule"]


class PaiementCreate(BaseModel):
    judoka_id: int
    competition_id: int | None = None
    type: TypePaiement = "cotisation"
    libelle: str
    montant_centimes: int
    saison: str | None = None


class PaiementOut(BaseModel):
    id: int
    judoka_id: int
    competition_id: int | None
    type: TypePaiement
    libelle: str
    montant_centimes: int
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
