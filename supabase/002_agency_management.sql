-- Atelier Estates: membership-based agency management.
-- Run after schema.sql and 001_secure_enquiries.sql.

CREATE TABLE IF NOT EXISTS public.agency_members (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'agent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.agency_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_agency_member(required_role TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.agency_members
    WHERE user_id = auth.uid()
      AND (required_role IS NULL OR role = required_role OR role = 'admin')
  );
$$;

REVOKE ALL ON FUNCTION public.is_agency_member(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_agency_member(TEXT) TO anon, authenticated;

DROP POLICY IF EXISTS "Members can view their own membership" ON public.agency_members;
CREATE POLICY "Members can view their own membership"
  ON public.agency_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_agency_member('admin'));

DROP POLICY IF EXISTS "Admins can add agency members" ON public.agency_members;
CREATE POLICY "Admins can add agency members"
  ON public.agency_members FOR INSERT
  TO authenticated
  WITH CHECK (public.is_agency_member('admin') AND role IN ('admin', 'agent'));

DROP POLICY IF EXISTS "Admins can change agency members" ON public.agency_members;
CREATE POLICY "Admins can change agency members"
  ON public.agency_members FOR UPDATE
  TO authenticated
  USING (public.is_agency_member('admin'))
  WITH CHECK (public.is_agency_member('admin') AND role IN ('admin', 'agent'));

DROP POLICY IF EXISTS "Admins can revoke agency members" ON public.agency_members;
CREATE POLICY "Admins can revoke agency members"
  ON public.agency_members FOR DELETE
  TO authenticated
  USING (public.is_agency_member('admin'));

ALTER TABLE public.property_images
  ADD COLUMN IF NOT EXISTS storage_path TEXT;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS properties_set_updated_at ON public.properties;
CREATE TRIGGER properties_set_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS agency_members_set_updated_at ON public.agency_members;
CREATE TRIGGER agency_members_set_updated_at
  BEFORE UPDATE ON public.agency_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP POLICY IF EXISTS "Admins can manage properties" ON public.properties;
CREATE POLICY "Agency members can manage properties"
  ON public.properties FOR ALL
  TO authenticated
  USING (public.is_agency_member())
  WITH CHECK (public.is_agency_member());

DROP POLICY IF EXISTS "Admins can manage property images" ON public.property_images;
CREATE POLICY "Agency members can manage property images"
  ON public.property_images FOR ALL
  TO authenticated
  USING (public.is_agency_member())
  WITH CHECK (public.is_agency_member());

DROP POLICY IF EXISTS "Admins can view and manage enquiries" ON public.enquiries;
DROP POLICY IF EXISTS "Admins can update enquiries" ON public.enquiries;
CREATE POLICY "Agency administrators can view enquiries"
  ON public.enquiries FOR SELECT
  TO authenticated
  USING (public.is_agency_member('admin'));

CREATE POLICY "Agency administrators can update enquiries"
  ON public.enquiries FOR UPDATE
  TO authenticated
  USING (public.is_agency_member('admin'))
  WITH CHECK (public.is_agency_member('admin'));

INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public can view property images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view property media" ON storage.objects;
CREATE POLICY "Public can view property images"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id IN ('property-images', 'property-media'));

DROP POLICY IF EXISTS "Admins can upload property media" ON storage.objects;
DROP POLICY IF EXISTS "Agency members can upload property images" ON storage.objects;
CREATE POLICY "Agency members can upload property images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'property-images'
    AND public.is_agency_member()
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Agency members can update property images" ON storage.objects;
CREATE POLICY "Agency members can update property images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'property-images' AND public.is_agency_member())
  WITH CHECK (bucket_id = 'property-images' AND public.is_agency_member());

DROP POLICY IF EXISTS "Agency members can delete property images" ON storage.objects;
CREATE POLICY "Agency members can delete property images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'property-images' AND public.is_agency_member());

-- First administrator setup (run manually after creating the Auth user):
-- INSERT INTO public.agency_members (user_id, role)
-- SELECT id, 'admin' FROM auth.users WHERE email = 'admin@example.com';
