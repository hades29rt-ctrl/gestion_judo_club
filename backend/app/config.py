import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:PASSWORD@localhost:5432/gestion_judo"
)

# Clé secrète utilisée pour signer les tokens JWT.
# IMPORTANT : à changer en production, ne jamais commiter la vraie valeur.
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-moi-en-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "480"))  # 8h par défaut

# HelloAsso — paiement en ligne
HELLOASSO_CLIENT_ID = os.getenv("HELLOASSO_CLIENT_ID", "")
HELLOASSO_CLIENT_SECRET = os.getenv("HELLOASSO_CLIENT_SECRET", "")
HELLOASSO_ORGANIZATION_SLUG = os.getenv("HELLOASSO_ORGANIZATION_SLUG", "")
# En sandbox pendant les tests, à repasser sur "false" en production
HELLOASSO_SANDBOX = os.getenv("HELLOASSO_SANDBOX", "true").lower() == "true"
HELLOASSO_API_BASE = (
    "https://api.helloasso-sandbox.com" if HELLOASSO_SANDBOX else "https://api.helloasso.com"
)
# URLs de retour après paiement — à adapter à l'URL réelle du frontend en production
HELLOASSO_BACK_URL = os.getenv("HELLOASSO_BACK_URL", "http://localhost:5173/paiements")
HELLOASSO_ERROR_URL = os.getenv("HELLOASSO_ERROR_URL", "http://localhost:5173/paiements?erreur=1")
HELLOASSO_RETURN_URL = os.getenv("HELLOASSO_RETURN_URL", "http://localhost:5173/paiements?succes=1")
