export const GRADES_VALIDES = [
  "blanche", "blanche-jaune", "jaune", "jaune-orange", "orange", "orange-verte",
  "verte", "verte-bleue", "bleue", "bleue-marron", "marron",
  "1er dan", "2eme dan", "3eme dan", "4eme dan", "5eme dan",
  "6eme dan", "7eme dan", "8eme dan", "9eme dan", "10eme dan",
] as const;

export const LABELS_GRADE: Record<string, string> = {
  blanche: "Ceinture blanche",
  "blanche-jaune": "Ceinture blanche-jaune",
  jaune: "Ceinture jaune",
  "jaune-orange": "Ceinture jaune-orange",
  orange: "Ceinture orange",
  "orange-verte": "Ceinture orange-verte",
  verte: "Ceinture verte",
  "verte-bleue": "Ceinture verte-bleue",
  bleue: "Ceinture bleue",
  "bleue-marron": "Ceinture bleue-marron",
  marron: "Ceinture marron",
  "1er dan": "1er dan (noire)",
  "2eme dan": "2e dan (noire)",
  "3eme dan": "3e dan (noire)",
  "4eme dan": "4e dan (noire)",
  "5eme dan": "5e dan (noire)",
  "6eme dan": "6e dan (rouge et blanche)",
  "7eme dan": "7e dan (rouge et blanche)",
  "8eme dan": "8e dan (rouge et blanche)",
  "9eme dan": "9e dan (rouge)",
  "10eme dan": "10e dan (rouge)",
};

export const LABELS_CATEGORIE_AGE: Record<string, string> = {
  baby_judo: "Baby Judo",
  poussinets: "Poussinets",
  poussins: "Poussins",
  benjamins: "Benjamins",
  minimes: "Minimes",
  cadets: "Cadets",
  juniors: "Juniors",
  seniors: "Seniors",
  veterans: "Vétérans",
};

export const LABELS_TYPE_PAIEMENT: Record<string, string> = {
  cotisation: "Cotisation",
  stage: "Stage",
  tournoi: "Tournoi",
  autre: "Autre",
};

export const LABELS_STATUT_PAIEMENT: Record<string, { label: string; classe: string }> = {
  en_attente: { label: "En attente", classe: "bg-gold/15 text-gold-dark" },
  paye: { label: "Payé", classe: "bg-emerald-100 text-emerald-700" },
  echoue: { label: "Échoué", classe: "bg-danger/10 text-danger" },
  annule: { label: "Annulé", classe: "bg-border text-muted" },
};

export const LABELS_TYPE_COMPETITION: Record<string, string> = {
  tournoi: "Tournoi",
  stage: "Stage",
  competition_officielle: "Compétition officielle",
  animation: "Animation",
};

export const LABELS_JOUR_SEMAINE: Record<number, string> = {
  1: "Lundi",
  2: "Mardi",
  3: "Mercredi",
  4: "Jeudi",
  5: "Vendredi",
  6: "Samedi",
};
export const LABELS_LICENCE_STATUT: Record<string, { label: string; classe: string }> = {
  non_transmise: { label: "Non transmise", classe: "bg-border text-muted" },
  en_attente: { label: "En attente", classe: "bg-gold/15 text-gold-dark" },
  transmise: { label: "Transmise", classe: "bg-ink/10 text-ink" },
  validee: { label: "Validée", classe: "bg-emerald-100 text-emerald-700" },
  expiree: { label: "Expirée", classe: "bg-danger/10 text-danger" },
};
