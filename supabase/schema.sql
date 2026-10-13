-- ==============================================================================
-- ATELIER ESTATES — SUPABASE SCHEMA & RLS POLICIES
-- Designed for Northup Studio / Atelier Estates
-- ==============================================================================

-- 1. Create Properties Table
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT NOT NULL,
    tagline TEXT,
    description TEXT NOT NULL,
    architectural_story TEXT,
    price NUMERIC(14, 2) NOT NULL,
    price_formatted TEXT,
    location JSONB NOT NULL DEFAULT '{}'::jsonb,
    property_type TEXT NOT NULL CHECK (property_type IN ('villa', 'penthouse', 'estate', 'residence', 'pavilion')),
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'under_offer', 'private_treaty')),
    specs JSONB NOT NULL DEFAULT '{}'::jsonb,
    features TEXT[] DEFAULT ARRAY[]::TEXT[],
    materials TEXT[] DEFAULT ARRAY[]::TEXT[],
    images JSONB DEFAULT '[]'::jsonb,
    floor_plan_url TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Enquiries Table
CREATE TABLE IF NOT EXISTS public.enquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_id TEXT UNIQUE NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    property_title TEXT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    preferred_date DATE,
    preferred_time TEXT,
    notes TEXT,
    type TEXT NOT NULL DEFAULT 'viewing' CHECK (type IN ('viewing', 'general', 'private_acquisition', 'consignment')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'scheduled', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

-- 4. Policies for Properties
-- Public can read all published properties
CREATE POLICY "Public can view properties"
    ON public.properties
    FOR SELECT
    USING (published_at IS NOT NULL AND status IN ('available', 'under_offer', 'private_treaty'));

-- Only authenticated administrators or service role can insert/update/delete properties
CREATE POLICY "Admins can manage properties"
    ON public.properties
    FOR ALL
    TO authenticated
    USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- 5. Policies for Enquiries
-- Only authenticated administrators can view or update customer enquiries
CREATE POLICY "Admins can view and manage enquiries"
    ON public.enquiries
    FOR SELECT
    TO authenticated
    USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update enquiries"
    ON public.enquiries
    FOR UPDATE
    TO authenticated
    USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Images are normalized for future media management. The legacy JSONB images
-- column remains supported for existing seeded portfolio content.
CREATE TABLE IF NOT EXISTS public.property_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view published property images"
    ON public.property_images FOR SELECT
    USING (EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = property_images.property_id
        AND properties.published_at IS NOT NULL
        AND properties.status IN ('available', 'under_offer', 'private_treaty')
    ));
CREATE POLICY "Admins can manage property images"
    ON public.property_images FOR ALL TO authenticated
    USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- 6. Storage Bucket Configuration for Architectural Photography
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-media', 'property-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view property media"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'property-media');

CREATE POLICY "Admins can upload property media"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'property-media' AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Enquiries are inserted only by the server route using the service-role key.
REVOKE INSERT ON public.enquiries FROM anon, authenticated;

-- 7. Seed Curated Demo Portfolio Data (Marked explicitly as Demo Content)
INSERT INTO public.properties (
    slug, title, subtitle, tagline, description, architectural_story,
    price, price_formatted, location, property_type, status, specs, features, materials, images, is_featured
)
VALUES
(
    'villa-solstice-mallorca',
    'Villa Solstice',
    'Monolithic Limestone Promontory',
    'Where carved travertine overhangs meet the Balearic horizon.',
    'Perched atop the rugged limestone bluffs of Cala Fornells, Villa Solstice is a masterclass in monolithic restraint. Designed with cantilevered sandstone volumes and vast thermal apertures, the residence blurs the threshold between dramatic marine topography and serene interior sanctuary.',
    'The structure is anchored by two massive bush-hammered limestone shear walls that anchor the house into the coastal bedrock. A 24-metre infinity lap pool extends toward the sea.',
    8400000,
    '€8,400,000',
    '{"city": "Andratx", "region": "Mallorca", "country": "Spain", "address": "Camí de Cala en Cranc 12"}'::jsonb,
    'villa',
    'available',
    '{"bedrooms": 5, "bathrooms": 6, "livingAreaSqFt": 7850, "livingAreaSqM": 730, "lotAreaSqM": 2400, "yearBuilt": 2023, "architect": "Estudio Marés & Partners"}'::jsonb,
    ARRAY['Cantilevered 24m travertine infinity pool', 'Triple-glazed frameless Sky-Frame sliding glass walls', 'Subterranean wine cave', 'Geothermal climate moderation'],
    ARRAY['Santanyí Limestone', 'Hand-chiseled Travertine', 'Brushed Raw Brass', 'Smoked White Oak'],
    '[{"url": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1920&q=85", "alt": "Villa Solstice exterior", "isHero": true}]'::jsonb,
    true
)
ON CONFLICT (slug) DO NOTHING;
