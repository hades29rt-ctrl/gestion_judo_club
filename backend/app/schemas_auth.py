from datetime import datetime
from typing import Literal
from pydantic import BaseModel

RoleUtilisateur = Literal["admin", "president", "tresorier", "secretaire", "membre", "adherent"]


class LoginRequest(BaseModel):
    identifiant: str
    mot_de_passe: str


class LoginResponse(BaseModel):
    totp_requis: bool = False
    token_temporaire: str | None = None
    access_token: str | None = None
    token_type: str = "bearer"


class Verifier2FARequest(BaseModel):
    token_temporaire: str
    code: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class Activer2FAOut(BaseModel):
    secret: str
    qr_code_base64: str


class Confirmer2FARequest(BaseModel):
    code: str


class UtilisateurOut(BaseModel):
    id: int
    identifiant: str
    nom: str | None
    role: RoleUtilisateur


class RegisterRequest(BaseModel):
    """
    Inscription publique. Le rôle n'est pas choisi par l'utilisateur :
    - le tout premier compte créé sur l'instance devient automatiquement
      admin et actif immédiatement (bootstrap) ;
    - tous les suivants sont créés avec le rôle 'adherent', désactivés,
      en attente de validation par un administrateur.
    """
    identifiant: str
    mot_de_passe: str
    nom: str | None = None


class UtilisateurAdminOut(BaseModel):
    id: int
    identifiant: str
    nom: str | None
    role: RoleUtilisateur
    actif: bool
    created_at: datetime
    last_login_at: datetime | None


class ActiverUtilisateurRequest(BaseModel):
    actif: bool


class ChangerRoleRequest(BaseModel):
    role: RoleUtilisateur
