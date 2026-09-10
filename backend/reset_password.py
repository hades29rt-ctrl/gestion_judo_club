"""
Réinitialise le mot de passe d'un utilisateur existant.
Usage : python reset_password.py
"""
import asyncio
import getpass

import asyncpg

from app.config import DATABASE_URL
from app.security import hash_password


async def main():
    identifiant = input("Identifiant du compte à réinitialiser : ").strip()
    mot_de_passe = getpass.getpass("Nouveau mot de passe : ")
    mot_de_passe_confirm = getpass.getpass("Confirmer le nouveau mot de passe : ")

    if mot_de_passe != mot_de_passe_confirm:
        print("Les mots de passe ne correspondent pas.")
        return

    hash_ = hash_password(mot_de_passe)

    conn = await asyncpg.connect(DATABASE_URL)
    try:
        result = await conn.execute(
            "UPDATE utilisateurs SET mot_de_passe_hash = $2 WHERE identifiant = $1",
            identifiant, hash_,
        )
        if result == "UPDATE 0":
            print(f"Aucun utilisateur trouvé avec l'identifiant '{identifiant}'.")
        else:
            print(f"Mot de passe de '{identifiant}' réinitialisé avec succès.")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
