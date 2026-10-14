import type { PropertyImage, PropertyStatus, PropertyType } from '@/types/property';

export interface AdminPropertyRecord {
  id: string;
  slug: string;
  title: string;
  description: string;
  location: Record<string, string>;
  price: number;
  property_type: PropertyType;
  specs: Record<string, number>;
  is_featured: boolean;
  status: PropertyStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  images: PropertyImage[] | null;
}

export function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function normalizeImages(value: unknown): PropertyImage[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is PropertyImage => {
    if (!item || typeof item !== 'object') return false;
    const image = item as Record<string, unknown>;
    return typeof image.url === 'string' && typeof image.alt === 'string';
  }).map((image, index) => ({ ...image, isHero: index === 0 }));
}

export function validatePropertyInput(body: Record<string, unknown>) {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const slug = typeof body.slug === 'string' ? body.slug.trim().toLowerCase() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const location = body.location && typeof body.location === 'object' ? body.location as Record<string, unknown> : {};
  const price = Number(body.price);
  const propertyType = body.propertyType;
  const status = body.status;
  const bedrooms = Number(body.bedrooms);
  const bathrooms = Number(body.bathrooms);
  const areaSqFt = Number(body.areaSqFt);

  if (title.length < 2 || title.length > 160) throw new Error('Title must be between 2 and 160 characters.');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Slug must use lowercase letters, numbers, and hyphens.');
  if (description.length < 20) throw new Error('Description must be at least 20 characters.');
  if (!Number.isFinite(price) || price <= 0) throw new Error('Price must be a positive number.');
  if (!['villa', 'penthouse', 'estate', 'residence', 'pavilion'].includes(String(propertyType))) throw new Error('Choose a valid property type.');
  if (!['draft', 'available', 'under_offer', 'private_treaty'].includes(String(status))) throw new Error('Choose a valid publication status.');
  if (!Number.isInteger(bedrooms) || bedrooms < 0 || !Number.isInteger(bathrooms) || bathrooms < 0 || !Number.isFinite(areaSqFt) || areaSqFt <= 0) {
    throw new Error('Bedrooms, bathrooms, and area must be valid positive values.');
  }
  if (typeof location.city !== 'string' || typeof location.country !== 'string') throw new Error('City and country are required.');

  return {
    title,
    slug,
    description,
    subtitle: `${String(propertyType).replace('_', ' ')} residence`,
    tagline: typeof body.tagline === 'string' ? body.tagline.trim() : '',
    location: {
      city: String(location.city).trim(),
      region: typeof location.region === 'string' ? location.region.trim() : '',
      country: String(location.country).trim(),
      address: typeof location.address === 'string' ? location.address.trim() : '',
    },
    price,
    price_formatted: `€${price.toLocaleString('en-US')}`,
    property_type: propertyType,
    status: status === 'draft' ? 'available' : status,
    specs: {
      bedrooms,
      bathrooms,
      livingAreaSqFt: areaSqFt,
      livingAreaSqM: Math.round(areaSqFt / 10.764),
      yearBuilt: Number(body.yearBuilt) || new Date().getFullYear(),
    },
    features: Array.isArray(body.features) ? body.features.filter((item): item is string => typeof item === 'string') : [],
    materials: Array.isArray(body.materials) ? body.materials.filter((item): item is string => typeof item === 'string') : [],
    images: normalizeImages(body.images),
    is_featured: body.isFeatured === true,
    published_at: status === 'draft' ? null : new Date().toISOString(),
  };
}
