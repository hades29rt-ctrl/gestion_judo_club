from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.database import get_pool
from app.security import decode_access_token
from app.schemas_auth import UtilisateurOut

bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> UtilisateurOut:
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Identifiants invalides ou session expirée.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    pool = get_pool()
    row = await pool.fetchrow(
        "SELECT id, identifiant, nom, role FROM utilisateurs WHERE id = $1 AND actif = true",
        int(user_id),
    )
    if row is None:
        raise credentials_exception

    return UtilisateurOut(**dict(row))


async def get_current_admin(current_user: UtilisateurOut = Depends(get_current_user)) -> UtilisateurOut:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Réservé aux administrateurs.",
        )
    return current_user
