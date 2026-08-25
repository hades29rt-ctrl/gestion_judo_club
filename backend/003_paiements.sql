-- ============================================================
-- Migration : table de suivi des paiements HelloAsso
-- ============================================================

BEGIN;

CREATE TABLE paiements (
    id                  BIGSERIAL PRIMARY KEY,
    judoka_id           BIGINT NOT NULL REFERENCES judokas(id) ON DELETE CASCADE,
    competition_id      BIGINT REFERENCES competitions(id) ON DELETE SET NULL,  -- optionnel, pour stage/tournoi
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

COMMIT;
