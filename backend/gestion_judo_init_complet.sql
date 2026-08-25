-- ============================================================
-- Projet : gestion_judo
-- Script d'initialisation COMPLET et À JOUR (PostgreSQL 18)
-- Inclut toutes les tables et migrations appliquées jusqu'ici.
-- À exécuter sur une base vide.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. UTILISATEURS (authentification)
-- ------------------------------------------------------------
CREATE TABLE utilisateurs (
    id              BIGSERIAL PRIMARY KEY,
    identifiant     VARCHAR(50) NOT NULL UNIQUE,
    mot_de_passe_hash VARCHAR(255) NOT NULL,
    nom             VARCHAR(100),
    role            VARCHAR(20) NOT NULL DEFAULT 'admin'
                    CHECK (role IN ('admin', 'professeur', 'secretaire', 'lecture_seule')),
    actif           BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login_at   TIMESTAMPTZ
);


-- ------------------------------------------------------------
-- 2. ADHERENTS
-- ------------------------------------------------------------
CREATE TABLE adherents (
    id              BIGSERIAL PRIMARY KEY,
    nom             VARCHAR(100) NOT NULL,
    prenom          VARCHAR(100) NOT NULL,
    email           VARCHAR(150),
    telephone       VARCHAR(20),
    adresse         VARCHAR(255),
    code_postal     VARCHAR(10),
    ville           VARCHAR(100),
    actif           BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_adherents_nom ON adherents(nom, prenom);


-- ------------------------------------------------------------
-- 3. JUDOKAS
-- ------------------------------------------------------------
CREATE TABLE judokas (
    id                  BIGSERIAL PRIMARY KEY,
    adherent_id         BIGINT NOT NULL REFERENCES adherents(id) ON DELETE CASCADE,
    date_naissance      DATE NOT NULL,
    sexe                CHAR(1) NOT NULL CHECK (sexe IN ('M', 'F')),

    numero_licence_ffj  VARCHAR(30),
    licence_saison      VARCHAR(9),
    licence_statut      VARCHAR(20) NOT NULL DEFAULT 'non_transmise'
                        CHECK (licence_statut IN ('non_transmise', 'en_attente', 'transmise', 'validee', 'expiree')),

    grade_actuel        VARCHAR(20) NOT NULL DEFAULT 'blanche'
                        CHECK (grade_actuel IN (
                            'blanche', 'blanche-jaune', 'jaune', 'jaune-orange', 'orange', 'orange-verte',
                            'verte', 'verte-bleue', 'bleue', 'bleue-marron', 'marron',
                            '1er dan', '2eme dan', '3eme dan', '4eme dan', '5eme dan',
                            '6eme dan', '7eme dan', '8eme dan', '9eme dan', '10eme dan'
                        )),
    date_obtention_grade_actuel DATE,

    certificat_medical_date     DATE,
    certificat_medical_validite DATE,

    contact_urgence_nom     VARCHAR(100),
    contact_urgence_tel     VARCHAR(20),

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (adherent_id)
);

CREATE INDEX idx_judokas_adherent ON judokas(adherent_id);
CREATE INDEX idx_judokas_licence_statut ON judokas(licence_statut);
CREATE INDEX idx_judokas_certif_validite ON judokas(certificat_medical_validite);


-- ------------------------------------------------------------
-- 4. GRADES_HISTORIQUE
-- ------------------------------------------------------------
CREATE TABLE grades_historique (
    id              BIGSERIAL PRIMARY KEY,
    judoka_id       BIGINT NOT NULL REFERENCES judokas(id) ON DELETE CASCADE,
    grade           VARCHAR(20) NOT NULL CHECK (grade IN (
                        'blanche', 'blanche-jaune', 'jaune', 'jaune-orange', 'orange', 'orange-verte',
                        'verte', 'verte-bleue', 'bleue', 'bleue-marron', 'marron',
                        '1er dan', '2eme dan', '3eme dan', '4eme dan', '5eme dan',
                        '6eme dan', '7eme dan', '8eme dan', '9eme dan', '10eme dan'
                    )),
    date_obtention  DATE NOT NULL,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_grades_hist_judoka ON grades_historique(judoka_id);


-- ------------------------------------------------------------
-- 5. COURS (jour_semaine 1-6 : pas de cours le dimanche)
-- ------------------------------------------------------------
CREATE TABLE cours (
    id                  BIGSERIAL PRIMARY KEY,
    nom                 VARCHAR(100) NOT NULL,
    categorie_age_cible VARCHAR(30),
    professeur          VARCHAR(100),
    jour_semaine        SMALLINT CHECK (jour_semaine BETWEEN 1 AND 6),
    heure_debut         TIME,
    heure_fin           TIME,
    lieu                VARCHAR(150),
    actif               BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ------------------------------------------------------------
-- 6. INSCRIPTIONS_COURS
-- ------------------------------------------------------------
CREATE TABLE inscriptions_cours (
    id              BIGSERIAL PRIMARY KEY,
    judoka_id       BIGINT NOT NULL REFERENCES judokas(id) ON DELETE CASCADE,
    cours_id        BIGINT NOT NULL REFERENCES cours(id) ON DELETE CASCADE,
    saison          VARCHAR(9) NOT NULL,
    date_inscription DATE NOT NULL DEFAULT CURRENT_DATE,

    UNIQUE (judoka_id, cours_id, saison)
);

CREATE INDEX idx_inscriptions_judoka ON inscriptions_cours(judoka_id);
CREATE INDEX idx_inscriptions_cours ON inscriptions_cours(cours_id);


-- ------------------------------------------------------------
-- 7. PRESENCES
-- ------------------------------------------------------------
CREATE TABLE presences (
    id              BIGSERIAL PRIMARY KEY,
    judoka_id       BIGINT NOT NULL REFERENCES judokas(id) ON DELETE CASCADE,
    cours_id        BIGINT NOT NULL REFERENCES cours(id) ON DELETE CASCADE,
    date_seance     DATE NOT NULL,
    present         BOOLEAN NOT NULL DEFAULT false,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (judoka_id, cours_id, date_seance)
);

CREATE INDEX idx_presences_judoka ON presences(judoka_id);
CREATE INDEX idx_presences_date ON presences(date_seance);


-- ------------------------------------------------------------
-- 8. COMPETITIONS
-- ------------------------------------------------------------
CREATE TABLE competitions (
    id          BIGSERIAL PRIMARY KEY,
    nom         VARCHAR(150) NOT NULL,
    type        VARCHAR(20) NOT NULL DEFAULT 'tournoi'
                CHECK (type IN ('tournoi', 'stage', 'competition_officielle', 'animation')),
    date_debut  DATE NOT NULL,
    date_fin    DATE,
    lieu        VARCHAR(150),
    notes       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ------------------------------------------------------------
-- 9. RESULTATS
-- ------------------------------------------------------------
CREATE TABLE resultats (
    id              BIGSERIAL PRIMARY KEY,
    judoka_id       BIGINT NOT NULL REFERENCES judokas(id) ON DELETE CASCADE,
    competition_id  BIGINT NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    categorie_poids VARCHAR(20),
    rang            SMALLINT,
    victoires       SMALLINT DEFAULT 0,
    defaites        SMALLINT DEFAULT 0,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_resultats_judoka ON resultats(judoka_id);
CREATE INDEX idx_resultats_competition ON resultats(competition_id);


-- ------------------------------------------------------------
-- 10. LICENCES_FFJ
-- ------------------------------------------------------------
CREATE TABLE licences_ffj (
    id                  BIGSERIAL PRIMARY KEY,
    judoka_id           BIGINT NOT NULL REFERENCES judokas(id) ON DELETE CASCADE,
    saison              VARCHAR(9) NOT NULL,
    numero_licence      VARCHAR(30),
    statut_transmission VARCHAR(20) NOT NULL DEFAULT 'en_attente'
                        CHECK (statut_transmission IN ('en_attente', 'transmis', 'valide', 'refuse')),
    date_transmission   TIMESTAMPTZ,
    date_validation     TIMESTAMPTZ,
    notes               TEXT,

    UNIQUE (judoka_id, saison)
);

CREATE INDEX idx_licences_ffj_judoka ON licences_ffj(judoka_id);
CREATE INDEX idx_licences_ffj_statut ON licences_ffj(statut_transmission);


-- ------------------------------------------------------------
-- 11. PAIEMENTS (HelloAsso)
-- ------------------------------------------------------------
CREATE TABLE paiements (
    id                  BIGSERIAL PRIMARY KEY,
    judoka_id           BIGINT NOT NULL REFERENCES judokas(id) ON DELETE CASCADE,
    competition_id      BIGINT REFERENCES competitions(id) ON DELETE SET NULL,
    type                VARCHAR(20) NOT NULL DEFAULT 'cotisation'
                        CHECK (type IN ('cotisation', 'stage', 'tournoi', 'autre')),
    libelle             VARCHAR(150) NOT NULL,
    montant_centimes    INTEGER NOT NULL CHECK (montant_centimes > 0),
    saison              VARCHAR(9),
    statut              VARCHAR(20) NOT NULL DEFAULT 'en_attente'
                        CHECK (statut IN ('en_attente', 'paye', 'echoue', 'annule')),
    checkout_intent_id  BIGINT,
    date_creation       TIMESTAMPTZ NOT NULL DEFAULT now(),
    date_paiement       TIMESTAMPTZ
);

CREATE INDEX idx_paiements_judoka ON paiements(judoka_id);
CREATE INDEX idx_paiements_statut ON paiements(statut);


-- ============================================================
-- FONCTION : calcul de la catégorie d'âge FFJDA
-- ============================================================
CREATE OR REPLACE FUNCTION categorie_age_ffjda(
    p_date_naissance DATE,
    p_date_reference DATE DEFAULT CURRENT_DATE
) RETURNS VARCHAR(20) AS $$
DECLARE
    v_annee_naissance INT;
    v_annee_saison    INT;
    v_ecart           INT;
BEGIN
    v_annee_naissance := EXTRACT(YEAR FROM p_date_naissance);

    IF EXTRACT(MONTH FROM p_date_reference) >= 9 THEN
        v_annee_saison := EXTRACT(YEAR FROM p_date_reference) + 1;
    ELSE
        v_annee_saison := EXTRACT(YEAR FROM p_date_reference);
    END IF;

    v_ecart := v_annee_saison - v_annee_naissance;

    RETURN CASE
        WHEN v_ecart <= 5 THEN 'baby_judo'
        WHEN v_ecart <= 7 THEN 'poussinets'
        WHEN v_ecart <= 9 THEN 'poussins'
        WHEN v_ecart <= 11 THEN 'benjamins'
        WHEN v_ecart <= 13 THEN 'minimes'
        WHEN v_ecart <= 16 THEN 'cadets'
        WHEN v_ecart <= 19 THEN 'juniors'
        WHEN v_ecart <= 29 THEN 'seniors'
        ELSE 'veterans'
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- ------------------------------------------------------------
-- Triggers updated_at
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_set_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER adherents_set_updated_at
    BEFORE UPDATE ON adherents
    FOR EACH ROW
    EXECUTE FUNCTION trg_set_updated_at();

CREATE TRIGGER judokas_set_updated_at
    BEFORE UPDATE ON judokas
    FOR EACH ROW
    EXECUTE FUNCTION trg_set_updated_at();

COMMIT;
