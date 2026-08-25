"""
Script à usage unique pour créer le premier compte administrateur.
Usage : python create_admin.py
"""
import asyncio
import getpass

import asyncpg

from app.config import DATABASE_URL
from app.security import hash_password


async def main():
    identifiant = input("Identifiant souhaité : ").strip()
    nom = input("Nom affiché (optionnel) : ").strip() or None
    mot_de_passe = getpass.getpass("Mot de passe : ")
    mot_de_passe_confirm = getpass.getpass("Confirmer le mot de passe : ")

    if mot_de_passe != mot_de_passe_confirm:
        print("Les mots de passe ne correspondent pas.")
        return

    hash_ = hash_password(mot_de_passe)

    conn = await asyncpg.connect(DATABASE_URL)
    try:
        await conn.execute(
            """
            INSERT INTO utilisateurs (identifiant, mot_de_passe_hash, nom, role)
            VALUES ($1, $2, $3, 'admin')
            """,
            identifiant, hash_, nom,
        )
        print(f"Utilisateur '{identifiant}' créé avec succès (rôle admin).")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
