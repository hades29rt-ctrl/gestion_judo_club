-- ============================================================
-- Migration : restreindre jour_semaine à 1-6 (lundi-samedi)
-- Le dimanche est réservé aux compétitions, pas de cours ce jour-là.
-- ============================================================

BEGIN;

ALTER TABLE cours DROP CONSTRAINT cours_jour_semaine_check;

ALTER TABLE cours ADD CONSTRAINT cours_jour_semaine_check
    CHECK (jour_semaine BETWEEN 1 AND 6);

COMMIT;
