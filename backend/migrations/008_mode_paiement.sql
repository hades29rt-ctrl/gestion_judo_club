-- ============================================================
-- Migration : modes de paiement manuels
-- Permet de valider un paiement reçu par chèque, espèces ou
-- virement, sans passer par HelloAsso.
-- ============================================================

BEGIN;

ALTER TABLE paiements
    ADD COLUMN mode_paiement VARCHAR(20) NOT NULL DEFAULT 'helloasso'
        CHECK (mode_paiement IN ('helloasso', 'cheque', 'especes', 'virement'));

-- checkout_intent_id n'a de sens que pour un paiement HelloAsso : on le rend
-- explicitement nullable (il l'était déjà) sans changement de contrainte ici.

COMMIT;
