-- ============================================================
-- Migration : refonte des rôles utilisateurs
-- Nouvelle liste : admin, president, tresorier, secretaire, membre, adherent
-- Remplace : admin, professeur, secretaire, lecture_seule
-- ============================================================

BEGIN;

-- Remappage des anciennes valeurs vers les nouvelles avant de resserrer la contrainte.
UPDATE utilisateurs SET role = 'membre' WHERE role = 'professeur';
UPDATE utilisateurs SET role = 'adherent' WHERE role = 'lecture_seule';
-- 'admin' et 'secretaire' existent déjà dans la nouvelle liste, inchangés.

ALTER TABLE utilisateurs DROP CONSTRAINT utilisateurs_role_check;

ALTER TABLE utilisateurs ADD CONSTRAINT utilisateurs_role_check
    CHECK (role IN ('admin', 'president', 'tresorier', 'secretaire', 'membre', 'adherent'));

ALTER TABLE utilisateurs ALTER COLUMN role SET DEFAULT 'adherent';

COMMIT;
