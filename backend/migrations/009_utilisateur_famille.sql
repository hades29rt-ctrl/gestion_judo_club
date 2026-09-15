-- ============================================================
-- Migration : rattachement d'un compte utilisateur à une famille
-- Permet à un compte "adherent" de consulter/modifier les infos
-- de sa famille et de ses enfants inscrits.
-- ============================================================

BEGIN;

ALTER TABLE utilisateurs
    ADD COLUMN famille_id BIGINT REFERENCES familles(id) ON DELETE SET NULL;

CREATE INDEX idx_utilisateurs_famille ON utilisateurs(famille_id);

COMMIT;
