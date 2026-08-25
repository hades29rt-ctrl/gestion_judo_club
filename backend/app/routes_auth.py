from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_pool
from app.security import verify_password, create_access_token
from app.schemas_auth import LoginRequest, TokenResponse, UtilisateurOut
from app.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["authentification"])


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest):
    pool = get_pool()
    row = await pool.fetchrow(
        """
        SELECT id, identifiant, mot_de_passe_hash, actif
        FROM utilisateurs
        WHERE identifiant = $1
        """,
        payload.identifiant,
    )

    if row is None or not row["actif"] or not verify_password(
        payload.mot_de_passe, row["mot_de_passe_hash"]
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identifiant ou mot de passe incorrect.",
        )

    await pool.execute(
        "UPDATE utilisateurs SET last_login_at = now() WHERE id = $1", row["id"]
    )

    token = create_access_token(data={"sub": str(row["id"])})
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UtilisateurOut)
async def me(current_user: UtilisateurOut = Depends(get_current_user)):
    return current_user
