import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, BedDouble, Maximize } from 'lucide-react';
import type { Property } from '@/types/property';
import { isNewlyAdded } from '@/lib/property-status';

export default function PropertyCard({ property }: { property: Property }) {
  const image = property.images.find((item) => item.isHero) ?? property.images[0];

  return (
    <article className="group">
      <Link href={`/properties/${property.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-sandstone-tint">
          {image ? (
            <Image
              src={image.url}
              alt={image.alt}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-sandstone" />
          )}
          <span className="absolute left-4 top-4 bg-limestone-100/90 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-charcoal-700">
            {property.propertyType}
          </span>
          {isNewlyAdded(property.publishedAt) && (
            <span className="absolute right-4 top-4 bg-terracotta px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-limestone-100">
              Newly added
            </span>
          )}
          <span className="absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center bg-limestone-100 text-charcoal-800 transition group-hover:bg-terracotta group-hover:text-white">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
        <div className="border-b border-charcoal-800/15 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-serif text-2xl text-charcoal-800">{property.title}</h3>
              <p className="mt-1 text-xs uppercase tracking-wideEditorial text-charcoal-500">
                {property.location.city}, {property.location.country}
              </p>
            </div>
            <p className="whitespace-nowrap font-mono text-xs text-terracotta">{property.priceFormatted}</p>
          </div>
          <div className="mt-4 flex gap-5 text-xs text-charcoal-500">
            <span className="inline-flex items-center gap-1.5"><BedDouble className="h-3.5 w-3.5" /> {property.specs.bedrooms} beds</span>
            <span className="inline-flex items-center gap-1.5"><Maximize className="h-3.5 w-3.5" /> {property.specs.livingAreaSqM} m²</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
