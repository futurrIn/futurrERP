-- Run this in your Supabase SQL Editor to update the settings table

-- Add CRM Settings columns
ALTER TABLE settings ADD COLUMN IF NOT EXISTS crm_lead_sources JSONB DEFAULT '["Website", "Referral", "Cold Call", "Social Media", "Other"]'::jsonb;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS crm_services JSONB DEFAULT '["Consulting", "Software Development", "Marketing", "Support"]'::jsonb;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS crm_pipeline_stages JSONB DEFAULT '["New", "Contacted", "Proposal Sent", "Converted", "Lost"]'::jsonb;

-- Add Finance Settings columns
ALTER TABLE settings ADD COLUMN IF NOT EXISTS finance_payment_methods JSONB DEFAULT '["Cash", "Bank Transfer", "Credit Card", "UPI"]'::jsonb;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS default_tax_rate NUMERIC DEFAULT 0;

-- Ensure RLS allows Admins to update (if not already permissive)
-- (Your existing permissive policies likely cover this)
