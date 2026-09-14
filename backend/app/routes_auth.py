import base64
import io

import pyotp
import qrcode
from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_pool
from app.security import (
    verify_password,
    hash_password,
    create_access_token,
    create_temp_2fa_token,
    decode_temp_2fa_token,
)
from app.schemas_auth import (
    LoginRequest,
    LoginResponse,
    Verifier2FARequest,
    TokenResponse,
    UtilisateurOut,
    Activer2FAOut,
    Confirmer2FARequest,
    RegisterRequest,
    UtilisateurAdminOut,
    ActiverUtilisateurRequest,
    ChangerRoleRequest,
)
from app.dependencies import get_current_user, get_current_admin

router = APIRouter(prefix="/auth", tags=["authentification"])


@router.post("/login", response_model=LoginResponse)
async def login(payload: LoginRequest):
    pool = get_pool()
    row = await pool.fetchrow(
        """
        SELECT id, identifiant, mot_de_passe_hash, actif, totp_active
        FROM utilisateurs
        WHERE identifiant = $1
        """,
        payload.identifiant,
    )

    if row is None or not verify_password(payload.mot_de_passe, row["mot_de_passe_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identifiant ou mot de passe incorrect.",
        )

    if not row["actif"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ce compte n'a pas encore été activé par un administrateur.",
        )

    if row["totp_active"]:
        return LoginResponse(
            totp_requis=True,
            token_temporaire=create_temp_2fa_token(row["id"]),
        )

    await pool.execute(
        "UPDATE utilisateurs SET last_login_at = now() WHERE id = $1", row["id"]
    )
    token = create_access_token(data={"sub": str(row["id"])})
    return LoginResponse(access_token=token)


@router.post("/login/2fa", response_model=TokenResponse)
async def verifier_2fa(payload: Verifier2FARequest):
    user_id = decode_temp_2fa_token(payload.token_temporaire)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session d'authentification expirée, reconnecte-toi.",
        )

    pool = get_pool()
    row = await pool.fetchrow(
        "SELECT totp_secret, actif FROM utilisateurs WHERE id = $1", user_id
    )
    if row is None or not row["actif"] or row["totp_secret"] is None:
        raise HTTPException(status_code=401, detail="Compte introuvable ou 2FA non configuré.")

    totp = pyotp.TOTP(row["totp_secret"])
    if not totp.verify(payload.code, valid_window=1):
        raise HTTPException(status_code=401, detail="Code de vérification incorrect.")

    await pool.execute(
        "UPDATE utilisateurs SET last_login_at = now() WHERE id = $1", user_id
    )
    token = create_access_token(data={"sub": str(user_id)})
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UtilisateurOut)
async def me(current_user: UtilisateurOut = Depends(get_current_user)):
    return current_user


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest):
    """
    Le tout premier compte créé sur l'instance devient automatiquement
    administrateur. Tous les suivants sont créés avec le rôle adhérent.
    Dans les deux cas, le compte est actif immédiatement (pas de validation
    manuelle) — seuls les droits du rôle restreignent ce que le compte peut
    faire (un adhérent ne peut ni modifier le logiciel, ni changer les
    privilèges des autres comptes ; seul un admin peut élever un rôle).
    """
    pool = get_pool()

    existe = await pool.fetchrow(
        "SELECT id FROM utilisateurs WHERE identifiant = $1", payload.identifiant
    )
    if existe is not None:
        raise HTTPException(status_code=409, detail="Cet identifiant est déjà utilisé.")

    nombre_comptes = await pool.fetchval("SELECT COUNT(*) FROM utilisateurs")
    est_premier_compte = nombre_comptes == 0

    hash_ = hash_password(payload.mot_de_passe)
    await pool.execute(
        """
        INSERT INTO utilisateurs (identifiant, mot_de_passe_hash, nom, role, actif)
        VALUES ($1, $2, $3, $4, true)
        """,
        payload.identifiant, hash_, payload.nom,
        "admin" if est_premier_compte else "adherent",
    )

    if est_premier_compte:
        return {"message": "Compte administrateur créé (premier compte de l'instance). Tu peux te connecter directement."}
    return {"message": "Compte créé avec le rôle adhérent. Tu peux te connecter directement."}


# ============================================================
# GESTION DES UTILISATEURS (réservé aux admins)
# ============================================================

@router.get("/utilisateurs", response_model=list[UtilisateurAdminOut])
async def lister_utilisateurs(current_admin: UtilisateurOut = Depends(get_current_admin)):
    pool = get_pool()
    rows = await pool.fetch(
        """
        SELECT id, identifiant, nom, role, actif, created_at, last_login_at
        FROM utilisateurs
        ORDER BY actif ASC, created_at DESC
        """
    )
    return [UtilisateurAdminOut(**dict(r)) for r in rows]


@router.put("/utilisateurs/{utilisateur_id}/statut", response_model=UtilisateurAdminOut)
async def changer_statut_utilisateur(
    utilisateur_id: int,
    payload: ActiverUtilisateurRequest,
    current_admin: UtilisateurOut = Depends(get_current_admin),
):
    pool = get_pool()
    row = await pool.fetchrow(
        """
        UPDATE utilisateurs SET actif = $2
        WHERE id = $1
        RETURNING id, identifiant, nom, role, actif, created_at, last_login_at
        """,
        utilisateur_id, payload.actif,
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable.")
    return UtilisateurAdminOut(**dict(row))


@router.put("/utilisateurs/{utilisateur_id}/role", response_model=UtilisateurAdminOut)
async def changer_role_utilisateur(
    utilisateur_id: int,
    payload: ChangerRoleRequest,
    current_admin: UtilisateurOut = Depends(get_current_admin),
):
    pool = get_pool()
    row = await pool.fetchrow(
        """
        UPDATE utilisateurs SET role = $2
        WHERE id = $1
        RETURNING id, identifiant, nom, role, actif, created_at, last_login_at
        """,
        utilisateur_id, payload.role,
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable.")
    return UtilisateurAdminOut(**dict(row))
