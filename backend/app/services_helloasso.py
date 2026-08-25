"""
Service d'intégration avec l'API HelloAsso Checkout.
Doc : https://dev.helloasso.com/docs/api-overview

Flux : on obtient un access_token via OAuth2 client_credentials,
on initialise un "checkout intent" pour générer un lien de paiement,
puis on peut interroger le statut de ce paiement.
"""
import time
import httpx

from app.config import (
    HELLOASSO_API_BASE,
    HELLOASSO_CLIENT_ID,
    HELLOASSO_CLIENT_SECRET,
    HELLOASSO_ORGANIZATION_SLUG,
    HELLOASSO_BACK_URL,
    HELLOASSO_ERROR_URL,
    HELLOASSO_RETURN_URL,
)

# Cache mémoire simple du token (process unique ; suffisant pour un usage club).
_token_cache: dict = {"access_token": None, "expires_at": 0}


class HelloAssoError(Exception):
    pass


async def _obtenir_access_token() -> str:
    if _token_cache["access_token"] and _token_cache["expires_at"] > time.time() + 30:
        return _token_cache["access_token"]

    if not HELLOASSO_CLIENT_ID or not HELLOASSO_CLIENT_SECRET:
        raise HelloAssoError(
            "Identifiants HelloAsso non configurés (HELLOASSO_CLIENT_ID / HELLOASSO_CLIENT_SECRET)."
        )

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{HELLOASSO_API_BASE}/oauth2/token",
            data={
                "grant_type": "client_credentials",
                "client_id": HELLOASSO_CLIENT_ID,
                "client_secret": HELLOASSO_CLIENT_SECRET,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )

    if response.status_code != 200:
        raise HelloAssoError(f"Échec d'authentification HelloAsso : {response.text}")

    data = response.json()
    _token_cache["access_token"] = data["access_token"]
    _token_cache["expires_at"] = time.time() + int(data["expires_in"])
    return data["access_token"]


async def creer_checkout_intent(
    montant_centimes: int,
    libelle: str,
    prenom_payeur: str,
    nom_payeur: str,
    email_payeur: str,
    reference_interne: int,
) -> dict:
    """
    Initialise un paiement HelloAsso et renvoie la réponse brute de l'API,
    contenant notamment 'id' (checkoutIntentId) et 'redirectUrl'.
    """
    if not HELLOASSO_ORGANIZATION_SLUG:
        raise HelloAssoError("HELLOASSO_ORGANIZATION_SLUG non configuré.")

    token = await _obtenir_access_token()

    payload = {
        "totalAmount": montant_centimes,
        "initialAmount": montant_centimes,
        "itemName": libelle,
        "backUrl": HELLOASSO_BACK_URL,
        "errorUrl": HELLOASSO_ERROR_URL,
        "returnUrl": HELLOASSO_RETURN_URL,
        "containsDonation": False,
        "payer": {
            "firstName": prenom_payeur,
            "lastName": nom_payeur,
            "email": email_payeur,
        },
        "metadata": {"reference": reference_interne, "libelle": libelle},
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{HELLOASSO_API_BASE}/v5/organizations/{HELLOASSO_ORGANIZATION_SLUG}/checkout-intents",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
        )

    if response.status_code not in (200, 201):
        raise HelloAssoError(f"Échec de création du paiement HelloAsso : {response.text}")

    return response.json()


async def obtenir_statut_checkout(checkout_intent_id: int) -> dict:
    """Récupère l'état actuel d'une intention de paiement (et la commande associée si payée)."""
    token = await _obtenir_access_token()

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{HELLOASSO_API_BASE}/v5/organizations/{HELLOASSO_ORGANIZATION_SLUG}/checkout-intents/{checkout_intent_id}",
            headers={"Authorization": f"Bearer {token}"},
        )

    if response.status_code != 200:
        raise HelloAssoError(f"Échec de récupération du statut HelloAsso : {response.text}")

    return response.json()
