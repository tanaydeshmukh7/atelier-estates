'use client';

import { Search, SlidersHorizontal } from 'lucide-react';
import type { PropertyFilterState } from '@/types/property';

type Props = { filters: PropertyFilterState; locations: string[]; onChange: (next: PropertyFilterState) => void };

export default function PropertyFilters({ filters, locations, onChange }: Props) {
  const update = (key: keyof PropertyFilterState, value: string) => onChange({ ...filters, [key]: value });
  return (
    <div className="border-y border-charcoal-800/15 py-4">
      <div className="grid gap-3 md:grid-cols-5">
        <label className="relative md:col-span-2">
          <span className="sr-only">Search properties</span>
          <Search className="absolute left-3 top-3 h-4 w-4 text-charcoal-400" />
          <input value={filters.searchQuery} onChange={(event) => update('searchQuery', event.target.value)} placeholder="Search by name, city or architect" className="w-full border border-charcoal-800/20 bg-transparent py-2.5 pl-10 pr-3 text-sm placeholder:text-charcoal-400" />
        </label>
        <select aria-label="Location" value={filters.location} onChange={(event) => update('location', event.target.value)} className="border border-charcoal-800/20 bg-transparent px-3 py-2.5 text-sm">
          <option value="all">All locations</option>
          {locations.map((location) => <option key={location} value={location}>{location}</option>)}
        </select>
        <select aria-label="Property type" value={filters.propertyType} onChange={(event) => update('propertyType', event.target.value)} className="border border-charcoal-800/20 bg-transparent px-3 py-2.5 text-sm">
          <option value="all">All types</option>
          <option value="villa">Villa</option><option value="estate">Estate</option><option value="penthouse">Penthouse</option><option value="residence">Residence</option><option value="pavilion">Pavilion</option>
        </select>
        <select aria-label="Sort properties" value={filters.sortBy} onChange={(event) => update('sortBy', event.target.value)} className="border border-charcoal-800/20 bg-transparent px-3 py-2.5 text-sm">
          <option value="featured">Featured first</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="area-desc">Largest first</option>
        </select>
      </div>
      <div className="mt-3 flex items-center gap-2 text-[10px] uppercase tracking-widest text-charcoal-500"><SlidersHorizontal className="h-3.5 w-3.5" /> Price <select aria-label="Price range" value={filters.priceRange} onChange={(event) => update('priceRange', event.target.value)} className="border-0 bg-transparent p-0 text-[10px] uppercase tracking-widest text-charcoal-700 focus:ring-0"><option value="all">All</option><option value="under-10m">Under €10m</option><option value="10m-15m">€10m – €15m</option><option value="above-15m">Above €15m</option></select></div>
    </div>
  );
}
