from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt

from app.config import JWT_SECRET_KEY, JWT_ALGORITHM, JWT_EXPIRE_MINUTES

# bcrypt limite les mots de passe à 72 octets : on tronque proprement
# (limite très large en pratique, aucun impact pour un usage normal).
_MAX_BYTES = 72


def hash_password(mot_de_passe: str) -> str:
    mdp_bytes = mot_de_passe.encode("utf-8")[:_MAX_BYTES]
    hashed = bcrypt.hashpw(mdp_bytes, bcrypt.gensalt())
    return hashed.decode("utf-8")


def verify_password(mot_de_passe: str, mot_de_passe_hash: str) -> bool:
    mdp_bytes = mot_de_passe.encode("utf-8")[:_MAX_BYTES]
    return bcrypt.checkpw(mdp_bytes, mot_de_passe_hash.encode("utf-8"))


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def create_temp_2fa_token(user_id: int) -> str:
    """Token de très courte durée (5 min) utilisé uniquement entre l'étape mot de passe et l'étape code TOTP."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=5)
    return jwt.encode(
        {"sub": str(user_id), "scope": "2fa_pending", "exp": expire},
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM,
    )


def decode_temp_2fa_token(token: str) -> int | None:
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except JWTError:
        return None
    if payload.get("scope") != "2fa_pending":
        return None
    try:
        return int(payload["sub"])
    except (KeyError, ValueError):
        return None


def decode_access_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except JWTError:
        return None
