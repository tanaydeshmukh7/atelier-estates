-- Atelier Estates: secure enquiry workflow
-- Apply this after schema.sql in the Supabase SQL Editor.
-- The existing richer property/enquiry model is preserved.

ALTER TABLE public.enquiries
  ALTER COLUMN phone DROP NOT NULL;

CREATE INDEX IF NOT EXISTS properties_published_featured_idx
  ON public.properties (published_at DESC, is_featured DESC);

CREATE INDEX IF NOT EXISTS properties_type_idx
  ON public.properties (property_type);

CREATE INDEX IF NOT EXISTS property_images_property_order_idx
  ON public.property_images (property_id, display_order);

DROP POLICY IF EXISTS "Public can submit enquiries" ON public.enquiries;
REVOKE INSERT ON public.enquiries FROM anon, authenticated;

DROP POLICY IF EXISTS "Public can view properties" ON public.properties;
CREATE POLICY "Public can view published properties"
  ON public.properties
  FOR SELECT
  TO anon, authenticated
  USING (
    published_at IS NOT NULL
    AND status IN ('available', 'under_offer', 'private_treaty')
  );

DROP POLICY IF EXISTS "Public can view property media" ON storage.objects;
CREATE POLICY "Public can view property media"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'property-media');

-- Enquiries are inserted only by the server route with the service-role key.
-- Service-role operations bypass RLS; no public read policy is created.
