import { Property, PropertyFilterState } from '@/types/property';
import { demoProperties } from '@/data/properties';
import { getSupabaseClient, isSupabaseConfigured } from './supabase';

/**
 * Fetch all properties with optional filter and sort parameters.
 * Uses live Supabase data when configured and retains the clearly labelled
 * portfolio dataset only when credentials are absent.
 */
export async function getProperties(filters?: Partial<PropertyFilterState>): Promise<{
  properties: Property[];
  isDemo: boolean;
  total: number;
}> {
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const nowIso = new Date().toISOString();
      let query = supabase
        .from('properties')
        .select('*, property_images(*)')
        .not('published_at', 'is', null)
        .lte('published_at', nowIso)
        .in('status', ['available', 'under_offer', 'private_treaty'])
        .order('published_at', { ascending: false });

      if (filters?.propertyType && filters.propertyType !== 'all') {
        query = query.eq('property_type', filters.propertyType);
      }
      if (filters?.location && filters.location !== 'all') {
        query = query.ilike('location->>country', `%${filters.location}%`);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Supabase property query failed:', error);
        return { properties: [], isDemo: false, total: 0 };
      }

      if (data) {
        // Map database record to Property interface
        const properties: Property[] = data.map((item) => ({
          id: item.id,
          slug: item.slug,
          title: item.title,
          subtitle: item.subtitle,
          tagline: item.tagline,
          description: item.description,
          architecturalStory: item.architectural_story || item.architecturalStory,
          price: item.price,
          priceFormatted: item.price_formatted || `€${Number(item.price).toLocaleString('en-US')}`,
          location: item.location,
          propertyType: item.property_type || item.propertyType,
          status: item.status || 'available',
          specs: item.specs,
          features: item.features || [],
          materials: item.materials || [],
          images: mapImages(item),
          isFeatured: item.is_featured ?? item.isFeatured ?? false,
          publishedAt: typeof item.published_at === 'string' ? item.published_at : null,
        }));

        const filtered = applyClientFilters(properties, filters);
        return { properties: filtered, isDemo: false, total: filtered.length };
      }
    } catch (err) {
      console.error('Supabase property query failed:', err);
      return { properties: [], isDemo: false, total: 0 };
    }
  }

  // Fallback to curated demo portfolio
  const filtered = applyClientFilters(demoProperties, filters);
  return {
    properties: filtered,
    isDemo: !isSupabaseConfigured(),
    total: filtered.length,
  };
}

/**
 * Fetch a single property by slug
 */
export async function getPropertyBySlug(slug: string): Promise<{
  property: Property | null;
  isDemo: boolean;
}> {
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*, property_images(*)')
        .eq('slug', slug)
        .not('published_at', 'is', null)
        .lte('published_at', new Date().toISOString())
        .in('status', ['available', 'under_offer', 'private_treaty'])
        .single();

      if (error) {
        console.error('Supabase property detail query failed:', error);
        return { property: null, isDemo: false };
      }

      if (data) {
        return {
          property: {
            id: data.id,
            slug: data.slug,
            title: data.title,
            subtitle: data.subtitle,
            tagline: data.tagline,
            description: data.description,
            architecturalStory: data.architectural_story || data.architecturalStory,
            price: data.price,
            priceFormatted: data.price_formatted || `€${Number(data.price).toLocaleString('en-US')}`,
            location: data.location,
            propertyType: data.property_type || data.propertyType,
            status: data.status || 'available',
            specs: data.specs,
            features: data.features || [],
            materials: data.materials || [],
            images: mapImages(data),
            isFeatured: data.is_featured ?? data.isFeatured ?? false,
            publishedAt: typeof data.published_at === 'string' ? data.published_at : null,
          },
          isDemo: false,
        };
      }

    } catch (err) {
      console.error('Supabase property detail query failed:', err);
      return { property: null, isDemo: false };
    }
  }

  const prop = demoProperties.find((p) => p.slug === slug) || null;
  return { property: prop, isDemo: !isSupabaseConfigured() };
}

function mapImages(item: Record<string, unknown>): Property['images'] {
  const normalized = Array.isArray(item.property_images)
    ? (item.property_images as Array<Record<string, unknown>>)
      .sort((a, b) => Number(a.display_order ?? 0) - Number(b.display_order ?? 0))
      .map((image) => ({
        url: String(image.image_url),
        alt: String(image.alt_text || item.title || 'Property image'),
        isHero: Number(image.display_order ?? 0) === 0,
      }))
    : [];
  if (normalized.length) return normalized;
  return Array.isArray(item.images) ? item.images as Property['images'] : [];
}

/**
 * Filter and sort helper
 */
function applyClientFilters(
  list: Property[],
  filters?: Partial<PropertyFilterState>
): Property[] {
  if (!filters) return list;

  return list.filter((prop) => {
    // Search query
    if (filters.searchQuery && filters.searchQuery.trim() !== '') {
      const q = filters.searchQuery.toLowerCase();
      const matchTitle = prop.title.toLowerCase().includes(q);
      const matchCity = prop.location.city.toLowerCase().includes(q);
      const matchCountry = prop.location.country.toLowerCase().includes(q);
      const matchArchitect = prop.specs.architect?.toLowerCase().includes(q);
      if (!matchTitle && !matchCity && !matchCountry && !matchArchitect) {
        return false;
      }
    }

    // Property Type
    if (filters.propertyType && filters.propertyType !== 'all') {
      if (prop.propertyType !== filters.propertyType) {
        return false;
      }
    }

    // Location / Country
    if (filters.location && filters.location !== 'all') {
      const countryMatch = prop.location.country.toLowerCase() === filters.location.toLowerCase();
      const cityMatch = prop.location.city.toLowerCase() === filters.location.toLowerCase();
      if (!countryMatch && !cityMatch) {
        return false;
      }
    }

    // Price Range
    if (filters.priceRange && filters.priceRange !== 'all') {
      if (filters.priceRange === 'under-10m' && prop.price >= 10000000) return false;
      if (filters.priceRange === '10m-15m' && (prop.price < 10000000 || prop.price > 15000000)) return false;
      if (filters.priceRange === 'above-15m' && prop.price < 15000000) return false;
    }

    return true;
  }).sort((a, b) => {
    if (filters.sortBy === 'price-asc') return a.price - b.price;
    if (filters.sortBy === 'price-desc') return b.price - a.price;
    if (filters.sortBy === 'area-desc') return b.specs.livingAreaSqM - a.specs.livingAreaSqM;
    // Default: featured first
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;
    return 0;
  });
}
