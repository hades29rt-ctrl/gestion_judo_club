-- ============================================================
-- Migration : support du 2FA (TOTP) sur les utilisateurs
-- ============================================================

BEGIN;

ALTER TABLE utilisateurs
    ADD COLUMN totp_secret VARCHAR(64),
    ADD COLUMN totp_active BOOLEAN NOT NULL DEFAULT false;

COMMIT;
