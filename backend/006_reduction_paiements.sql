-- ============================================================
-- Migration : réduction manuelle sur les paiements
-- Utile notamment pour les réductions fratrie (montant fixe).
-- montant_centimes reste le tarif plein (référence comptable) ;
-- reduction_centimes est déduit pour obtenir le montant réel payé.
-- ============================================================

BEGIN;

ALTER TABLE paiements
    ADD COLUMN reduction_centimes INTEGER NOT NULL DEFAULT 0
        CHECK (reduction_centimes >= 0);

COMMIT;
