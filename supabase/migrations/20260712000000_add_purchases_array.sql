-- =====================================================================================
-- MIGRATION: Add purchases JSONB array column to expenses
-- Version: 20260712000000
-- Description: Replaces flat purchaseVendor/purchaseItem/purchaseAmount columns
--              with a purchases JSONB array to support multiple vendors per claim.
--              Old columns are kept for backwards compatibility during transition.
-- =====================================================================================

-- 1. Add the new purchases column (array of {vendor, item, amount} objects)
ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS "purchases" JSONB DEFAULT '[]'::jsonb;

-- 2. Migrate existing single-vendor data into the new array format
--    Only migrates rows where purchases is still empty but old fields have data
UPDATE expenses
SET "purchases" = jsonb_build_array(
  jsonb_build_object(
    'vendor', COALESCE("purchaseVendor", ''),
    'item',   COALESCE("purchaseItem", ''),
    'amount', COALESCE("purchaseAmount", 0)
  )
)
WHERE
  ("purchases" IS NULL OR "purchases" = '[]'::jsonb)
  AND ("purchaseVendor" IS NOT NULL AND "purchaseVendor" != '');
