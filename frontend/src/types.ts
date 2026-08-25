export interface Adherent {
  id: number;
  nom: string;
  prenom: string;
  email: string | null;
  telephone: string | null;
  adresse: string | null;
  code_postal: string | null;
  ville: string | null;
  actif: boolean;
}

export interface Judoka {
  id: number;
  adherent_id: number;
  date_naissance: string;
  sexe: "M" | "F";
  numero_licence_ffj: string | null;
  licence_saison: string | null;
  licence_statut: string;
  grade_actuel: string;
  date_obtention_grade_actuel: string | null;
  certificat_medical_date: string | null;
  certificat_medical_validite: string | null;
  contact_urgence_nom: string | null;
  contact_urgence_tel: string | null;
  categorie_age: string | null;
}

export interface AdherentJudoka {
  adherent: Adherent;
  judoka: Judoka | null;
}

export interface Paiement {
  id: number;
  judoka_id: number;
  competition_id: number | null;
  type: "cotisation" | "stage" | "tournoi" | "autre";
  libelle: string;
  montant_centimes: number;
  saison: string | null;
  statut: "en_attente" | "paye" | "echoue" | "annule";
  checkout_intent_id: number | null;
  date_creation: string;
  date_paiement: string | null;
  judoka_nom: string | null;
  judoka_prenom: string | null;
}

export interface PaiementInitie {
  paiement: Paiement;
  redirect_url: string;
}

export interface Competition {
  id: number;
  nom: string;
  type: "tournoi" | "stage" | "competition_officielle" | "animation";
  date_debut: string;
  date_fin: string | null;
  lieu: string | null;
  notes: string | null;
}

export interface Resultat {
  id: number;
  judoka_id: number;
  competition_id: number;
  categorie_poids: string | null;
  rang: number | null;
  victoires: number;
  defaites: number;
  notes: string | null;
  judoka_nom: string | null;
  judoka_prenom: string | null;
}

export interface PalmaresEntry {
  resultat_id: number;
  competition_id: number;
  competition_nom: string;
  competition_date: string;
  categorie_poids: string | null;
  rang: number | null;
  victoires: number;
  defaites: number;
}

export interface Licence {
  judoka_id: number;
  adherent_nom: string;
  adherent_prenom: string;
  numero_licence_ffj: string | null;
  licence_saison: string | null;
  licence_statut: string;
}
export interface Cours {
  id: number;
  nom: string;
  categorie_age_cible: string | null;
  professeur: string | null;
  jour_semaine: number | null;
  heure_debut: string | null;
  heure_fin: string | null;
  lieu: string | null;
  actif: boolean;
}

export interface Inscription {
  id: number;
  judoka_id: number;
  cours_id: number;
  saison: string;
  date_inscription: string;
  judoka_nom: string | null;
  judoka_prenom: string | null;
  judoka_email: string | null;
}

export interface Presence {
  id: number;
  judoka_id: number;
  cours_id: number;
  date_seance: string;
  present: boolean;
  notes: string | null;
  judoka_nom: string | null;
  judoka_prenom: string | null;
}
