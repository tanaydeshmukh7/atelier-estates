export type PropertyType = 'villa' | 'penthouse' | 'estate' | 'residence' | 'pavilion';

export type PropertyStatus = 'available' | 'under_offer' | 'private_treaty';

export interface PropertyImage {
  url: string;
  alt: string;
  caption?: string;
  isHero?: boolean;
}

export interface PropertySpecs {
  bedrooms: number;
  bathrooms: number;
  livingAreaSqFt: number;
  livingAreaSqM: number;
  lotAreaSqM?: number;
  yearBuilt: number;
  architect?: string;
}

export interface PropertyLocation {
  city: string;
  region: string;
  country: string;
  address: string;
  postalCode?: string;
}

export interface Property {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  tagline: string;
  description: string;
  architecturalStory: string;
  price: number;
  priceFormatted: string;
  location: PropertyLocation;
  propertyType: PropertyType;
  status: PropertyStatus;
  specs: PropertySpecs;
  features: string[];
  materials: string[];
  images: PropertyImage[];
  isFeatured: boolean;
  publishedAt: string;
}

export interface PropertyFilterState {
  location: string;
  propertyType: string;
  priceRange: string; // 'all' | 'under-5m' | '5m-10m' | 'above-10m'
  sortBy: string; // 'featured' | 'price-asc' | 'price-desc' | 'area-desc'
  searchQuery: string;
}
