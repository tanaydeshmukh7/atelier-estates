-- ==============================================================================
-- ATELIER ESTATES — MIGRATION 004: ENQUIRIES ENHANCEMENTS
-- Run this in the Supabase SQL Editor after 003_property_analytics.sql.
-- This migration is completely non-destructive and backward-compatible.
-- ==============================================================================

-- 1. Ensure updated_at column exists on enquiries
ALTER TABLE public.enquiries
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 2. Attach updated_at automatic timestamp trigger
DROP TRIGGER IF EXISTS enquiries_set_updated_at ON public.enquiries;
CREATE TRIGGER enquiries_set_updated_at
  BEFORE UPDATE ON public.enquiries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Additional performance indexes for advisory administration
CREATE INDEX IF NOT EXISTS enquiries_type_idx ON public.enquiries (type);
CREATE INDEX IF NOT EXISTS enquiries_email_idx ON public.enquiries (email);
CREATE INDEX IF NOT EXISTS enquiries_updated_at_idx ON public.enquiries (updated_at DESC);

-- 4. Verify existing check constraint for enquiry status includes all supported stages:
-- ('pending', 'contacted', 'qualified', 'scheduled', 'closed', 'archived')
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.enquiries'::regclass
      AND conname = 'enquiries_status_check'
  ) THEN
    ALTER TABLE public.enquiries
      ADD CONSTRAINT enquiries_status_check
      CHECK (status IN ('pending', 'contacted', 'qualified', 'scheduled', 'closed', 'archived'));
  END IF;
END $$;
