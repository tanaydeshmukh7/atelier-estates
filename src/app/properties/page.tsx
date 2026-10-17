import type { Metadata } from 'next';
import { getProperties } from '@/lib/properties';
import PropertyCollection from '@/components/properties/PropertyCollection';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'The Collection — Architectural Residences & Estates | Atelier Estates',
  description:
    'Explore a curated collection of architecturally significant residences, modern villas, alpine sanctuaries, and historic bastides represented by Atelier Estates.',
};

export default async function PropertiesPage() {
  const { properties, isDemo } = await getProperties();

  return (
    <div className="mx-auto max-w-7xl px-6 pb-24 pt-32 md:pt-40 lg:px-12">
      <p className="font-mono text-[10px] uppercase tracking-widest text-terracotta">
        The collection
      </p>
      <div className="mt-4 flex flex-col justify-between gap-6 border-b border-charcoal-800/15 pb-12 md:flex-row md:items-end">
        <h1 className="max-w-2xl font-serif text-5xl leading-[.95] md:text-6xl">
          Places with a point of view.
        </h1>
        <p className="max-w-xs text-sm leading-6 text-charcoal-500">
          {isDemo
            ? 'A curated portfolio of architectural case studies. Demo listings are clearly labelled.'
            : 'Available residences represented by Atelier Estates.'}
        </p>
      </div>
      <div className="mt-10">
        <PropertyCollection properties={properties} />
      </div>
    </div>
  );
}
