import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, BedDouble, Bath, Maximize } from 'lucide-react';
import { getPropertyBySlug } from '@/lib/properties';
import PropertyVisitTracker from '@/components/analytics/PropertyVisitTracker';
import EnquiryForm from '@/components/enquiry/EnquiryForm';

export const revalidate = 300;

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { property } = await getPropertyBySlug(params.slug);
  if (!property) {
    return {
      title: 'Property Not Found | Atelier Estates',
    };
  }

  const heroImage = property.images[0]?.url;

  return {
    title: `${property.title} — ${property.location.city}, ${property.location.country} | Atelier Estates`,
    description: property.tagline || property.description.slice(0, 160),
    openGraph: {
      title: `${property.title} | Atelier Estates`,
      description: property.tagline || property.description.slice(0, 160),
      images: heroImage ? [{ url: heroImage, alt: property.title }] : [],
    },
  };
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const { property, isDemo } = await getPropertyBySlug(params.slug);
  if (!property) notFound();

  const tracker = (
    <PropertyVisitTracker
      propertyId={property.id}
      slug={property.slug}
      title={property.title}
    />
  );

  return (
    <article>
      {tracker}

      {/* Header and Back Link */}
      <div className="mx-auto max-w-7xl px-6 pt-32 md:pt-36 lg:px-12">
        <Link
          href="/properties"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-wideEditorial text-charcoal-500 hover:text-terracotta transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to collection
        </Link>

        <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p className="font-mono text-[10px] uppercase tracking-widest text-terracotta">
              {property.location.city}, {property.location.country} / {property.propertyType}
            </p>
            <h1 className="mt-4 font-serif text-5xl leading-[.92] md:text-7xl lg:text-8xl">
              {property.title}
            </h1>
            {property.tagline && (
              <p className="mt-5 font-serif text-2xl italic text-charcoal-500">
                {property.tagline}
              </p>
            )}
          </div>

          <div className="lg:col-span-4 lg:text-right">
            <p className="font-mono text-base md:text-lg text-terracotta">
              {property.priceFormatted}
            </p>
            <p className="mt-2 text-xs text-charcoal-500">
              {isDemo ? 'Portfolio demonstration listing' : 'Represented by Atelier Estates'}
            </p>
          </div>
        </div>
      </div>

      {/* Gallery */}
      <div className="mx-auto mt-14 grid max-w-7xl gap-3 px-6 lg:grid-cols-12 lg:px-12">
        {property.images.length > 0 ? (
          property.images.map((image, index) => (
            <div
              key={`${image.url}-${index}`}
              className={`${
                index === 0 ? 'lg:col-span-8 lg:row-span-2' : 'lg:col-span-4'
              } relative aspect-[4/3] overflow-hidden bg-sandstone-tint`}
            >
              <Image
                src={image.url}
                alt={image.alt || property.title}
                fill
                priority={index === 0}
                sizes={
                  index === 0
                    ? '(max-width: 1024px) 100vw, 66vw'
                    : '(max-width: 1024px) 100vw, 33vw'
                }
                className="object-cover"
              />
            </div>
          ))
        ) : (
          <div className="col-span-12 flex aspect-[21/9] items-center justify-center bg-sandstone-tint text-center p-8">
            <div>
              <p className="font-serif text-2xl text-charcoal-600">Architectural Photography</p>
              <p className="mt-2 text-xs text-charcoal-400 font-mono uppercase tracking-widest">
                Visual dossier available upon request
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Narrative & In-Page Enquiry Form */}
      <div className="mx-auto grid max-w-7xl gap-16 px-6 py-20 lg:grid-cols-12 lg:px-12">
        {/* Description & Specs */}
        <div className="lg:col-span-7">
          <p className="font-mono text-[10px] uppercase tracking-widest text-terracotta">
            The residence
          </p>
          <p className="mt-5 text-lg leading-8 text-charcoal-700">
            {property.description}
          </p>
          {property.architecturalStory && (
            <p className="mt-8 text-sm leading-7 text-charcoal-600">
              {property.architecturalStory}
            </p>
          )}

          {/* Property Specifications */}
          <div className="mt-12 grid grid-cols-3 border-y border-charcoal-800/15 py-6 text-center">
            <span>
              <BedDouble className="mx-auto mb-2 h-4 w-4 text-terracotta" />
              <b className="font-serif text-2xl">{property.specs.bedrooms}</b>
              <small className="block text-[10px] uppercase tracking-widest text-charcoal-500">
                Bedrooms
              </small>
            </span>
            <span>
              <Bath className="mx-auto mb-2 h-4 w-4 text-terracotta" />
              <b className="font-serif text-2xl">{property.specs.bathrooms}</b>
              <small className="block text-[10px] uppercase tracking-widest text-charcoal-500">
                Bathrooms
              </small>
            </span>
            <span>
              <Maximize className="mx-auto mb-2 h-4 w-4 text-terracotta" />
              <b className="font-serif text-2xl">{property.specs.livingAreaSqM}</b>
              <small className="block text-[10px] uppercase tracking-widest text-charcoal-500">
                Square metres
              </small>
            </span>
          </div>
        </div>

        {/* Aside: Direct Enquiry Form */}
        <aside
          id="enquire"
          className="self-start bg-sandstone-tint p-8 lg:col-span-5 lg:col-start-8"
        >
          <p className="font-mono text-[10px] uppercase tracking-widest text-terracotta">
            Private advisory
          </p>
          <h2 className="mt-3 font-serif text-3xl">Make an enquiry.</h2>
          <p className="mt-3 text-sm leading-6 text-charcoal-600">
            Request a private dossier, floor plans, or arrange a discreet viewing of {property.title}.
          </p>

          <div className="mt-8">
            <EnquiryForm
              propertyId={property.id}
              propertyTitle={property.title}
            />
          </div>
        </aside>
      </div>

      {/* Details & Materials */}
      {(property.features.length > 0 || property.materials.length > 0) && (
        <div className="mx-auto max-w-7xl px-6 pb-24 lg:px-12">
          <h2 className="font-serif text-4xl">Details & materials</h2>
          <div className="mt-6 grid gap-8 border-t border-charcoal-800/15 pt-6 md:grid-cols-2">
            {property.features.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-widest text-charcoal-500 font-mono">
                  Features
                </p>
                <ul className="mt-4 space-y-3 text-sm">
                  {property.features.map((feature) => (
                    <li key={feature} className="border-b border-charcoal-800/10 pb-3">
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {property.materials.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-widest text-charcoal-500 font-mono">
                  Material palette
                </p>
                <ul className="mt-4 space-y-3 text-sm">
                  {property.materials.map((material) => (
                    <li key={material} className="border-b border-charcoal-800/10 pb-3">
                      {material}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
