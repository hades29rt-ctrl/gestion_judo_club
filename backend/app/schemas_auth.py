from typing import Literal
from pydantic import BaseModel


class LoginRequest(BaseModel):
    identifiant: str
    mot_de_passe: str


class LoginResponse(BaseModel):
    """
    Si le compte n'a pas le 2FA activé : access_token directement rempli.
    Si le 2FA est activé : totp_requis=True et un token temporaire est renvoyé,
    à renvoyer avec le code TOTP sur /auth/login/2fa pour obtenir l'access_token final.
    """
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
    qr_code_base64: str  # image PNG encodée en base64, prête à afficher en <img>


class Confirmer2FARequest(BaseModel):
    code: str


class UtilisateurOut(BaseModel):
    id: int
    identifiant: str
    nom: str | None
    role: str


class RegisterRequest(BaseModel):
    identifiant: str
    mot_de_passe: str
    nom: str | None = None
    role: Literal["professeur", "secretaire", "lecture_seule"] = "lecture_seule"


class UtilisateurAdminOut(BaseModel):
    id: int
    identifiant: str
    nom: str | None
    role: str
    actif: bool
    created_at: datetime
    last_login_at: datetime | None


class ActiverUtilisateurRequest(BaseModel):
    actif: bool
