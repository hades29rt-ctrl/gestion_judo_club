def generer_numero_licence_ffj(sexe: str, date_naissance, nom: str) -> str:
    """
    Génère le numéro de licence FFJDA selon la convention :
    sexe (M/F) + date de naissance (JJMMAAAA) + 5 premières lettres du nom
    (tel quel si moins de 5 lettres) + '01'.
    """
    date_str = date_naissance.strftime("%d%m%Y")
    nom_normalise = "".join(c for c in nom.upper() if c.isalpha())
    nom_partie = nom_normalise[:5]
    return f"{sexe}{date_str}{nom_partie}01"
