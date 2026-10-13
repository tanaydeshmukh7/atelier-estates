'use client';

import { useMemo, useState } from 'react';
import type { Property, PropertyFilterState } from '@/types/property';
import PropertyCard from './PropertyCard';
import PropertyFilters from './PropertyFilters';

const initialFilters: PropertyFilterState = { location: 'all', propertyType: 'all', priceRange: 'all', sortBy: 'featured', searchQuery: '' };

export default function PropertyCollection({ properties }: { properties: Property[] }) {
  const [filters, setFilters] = useState(initialFilters);
  const locations = useMemo(() => Array.from(new Set(properties.map((property) => property.location.country))).sort(), [properties]);
  const visible = useMemo(() => properties.filter((property) => {
    const query = filters.searchQuery.trim().toLowerCase();
    const searchable = `${property.title} ${property.location.city} ${property.location.country} ${property.specs.architect ?? ''}`.toLowerCase();
    if (query && !searchable.includes(query)) return false;
    if (filters.location !== 'all' && property.location.country !== filters.location) return false;
    if (filters.propertyType !== 'all' && property.propertyType !== filters.propertyType) return false;
    if (filters.priceRange === 'under-10m' && property.price >= 10000000) return false;
    if (filters.priceRange === '10m-15m' && (property.price < 10000000 || property.price > 15000000)) return false;
    if (filters.priceRange === 'above-15m' && property.price < 15000000) return false;
    return true;
  }).sort((a, b) => filters.sortBy === 'price-asc' ? a.price - b.price : filters.sortBy === 'price-desc' ? b.price - a.price : filters.sortBy === 'area-desc' ? b.specs.livingAreaSqM - a.specs.livingAreaSqM : Number(b.isFeatured) - Number(a.isFeatured)), [filters, properties]);

  return <><PropertyFilters filters={filters} locations={locations} onChange={setFilters} /><p className="py-5 text-xs uppercase tracking-widest text-charcoal-500">{visible.length} residences in the collection</p>{visible.length ? <div className="grid gap-x-6 gap-y-12 md:grid-cols-2 lg:grid-cols-3">{visible.map((property) => <PropertyCard key={property.id} property={property} />)}</div> : <div className="border border-dashed border-charcoal-800/20 py-20 text-center"><p className="font-serif text-3xl">No residences found</p><p className="mt-2 text-sm text-charcoal-500">Try widening your search or changing the filters.</p></div>}</>;
}
