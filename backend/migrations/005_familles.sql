-- ============================================================
-- Migration : introduction des familles
-- Regroupe plusieurs adhérents (fratrie) sous une même fiche
-- famille portant le nom de famille, le téléphone et l'email.
-- Ces deux derniers champs sont retirés de la fiche adhérent
-- individuelle (déplacés au niveau famille).
-- ============================================================

BEGIN;

CREATE TABLE familles (
    id              BIGSERIAL PRIMARY KEY,
    nom_famille     VARCHAR(100) NOT NULL,
    telephone       VARCHAR(20),
    email           VARCHAR(150),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_familles_nom ON familles(nom_famille);

-- Ajout du rattachement à une famille (nullable pour compatibilité
-- avec les adhérents déjà existants, à régulariser ensuite).
ALTER TABLE adherents ADD COLUMN famille_id BIGINT REFERENCES familles(id) ON DELETE SET NULL;
CREATE INDEX idx_adherents_famille ON adherents(famille_id);

-- Retrait des champs désormais portés par la famille.
ALTER TABLE adherents DROP COLUMN email;
ALTER TABLE adherents DROP COLUMN telephone;

CREATE OR REPLACE FUNCTION trg_set_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER familles_set_updated_at
    BEFORE UPDATE ON familles
    FOR EACH ROW
    EXECUTE FUNCTION trg_set_updated_at();

COMMIT;
