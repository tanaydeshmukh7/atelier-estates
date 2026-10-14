-- Atelier Estates: privacy-friendly property visits and enquiry correlation.
-- Run after 002_agency_management.sql. This migration is non-destructive.

CREATE TABLE IF NOT EXISTS public.property_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  visitor_id UUID NOT NULL,
  session_id UUID NOT NULL,
  visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  referrer TEXT,
  source TEXT,
  CONSTRAINT property_visits_session_unique UNIQUE (property_id, visitor_id, session_id)
);

CREATE INDEX IF NOT EXISTS property_visits_property_idx ON public.property_visits (property_id, visited_at DESC);
CREATE INDEX IF NOT EXISTS property_visits_visitor_idx ON public.property_visits (visitor_id, visited_at DESC);
CREATE INDEX IF NOT EXISTS property_visits_session_idx ON public.property_visits (session_id, visited_at DESC);
CREATE INDEX IF NOT EXISTS property_visits_visited_at_idx ON public.property_visits (visited_at DESC);

ALTER TABLE public.property_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agency members can view property visits" ON public.property_visits;
CREATE POLICY "Agency members can view property visits"
  ON public.property_visits FOR SELECT
  TO authenticated
  USING (public.is_agency_member());

ALTER TABLE public.enquiries
  ADD COLUMN IF NOT EXISTS visitor_id UUID,
  ADD COLUMN IF NOT EXISTS session_id UUID;

CREATE INDEX IF NOT EXISTS enquiries_property_idx ON public.enquiries (property_id, created_at DESC);
CREATE INDEX IF NOT EXISTS enquiries_status_idx ON public.enquiries (status, created_at DESC);
CREATE INDEX IF NOT EXISTS enquiries_visitor_idx ON public.enquiries (visitor_id, created_at DESC);

-- Preserve existing records while allowing the dashboard's qualified/closed workflow.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.enquiries'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%status%'
  ) THEN
    EXECUTE (
      SELECT format('ALTER TABLE public.enquiries DROP CONSTRAINT %I', conname)
      FROM pg_constraint
      WHERE conrelid = 'public.enquiries'::regclass
        AND contype = 'c'
        AND pg_get_constraintdef(oid) LIKE '%status%'
      LIMIT 1
    );
  END IF;
END $$;

ALTER TABLE public.enquiries
  ADD CONSTRAINT enquiries_status_check
  CHECK (status IN ('pending', 'contacted', 'qualified', 'scheduled', 'closed', 'archived'));

-- Raw visits are retained for 365 days by default. Schedule a periodic cleanup
-- job in Supabase if your plan supports pg_cron:
-- SELECT cron.schedule('purge-old-property-visits', '0 3 * * *',
--   $$DELETE FROM public.property_visits WHERE visited_at < NOW() - INTERVAL '365 days'$$);
