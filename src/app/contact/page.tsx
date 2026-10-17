import type { Metadata } from 'next';
import { getProperties, getPropertyBySlug } from '@/lib/properties';
import { agencyConfig } from '@/config/agency';
import EnquiryForm from '@/components/enquiry/EnquiryForm';
import { ArrowUpRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Private Advisory & Enquiries | Atelier Estates',
  description:
    'Begin a discreet conversation with our architectural advisory desk. Request private viewing dossiers, acquisitions consultation, or consignment representation.',
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: { property?: string };
}) {
  const selectedSlug = searchParams.property;
  const [selectedResult, propertiesResult] = await Promise.all([
    selectedSlug ? getPropertyBySlug(selectedSlug) : Promise.resolve(null),
    getProperties(),
  ]);

  const selectedProperty = selectedResult?.property ?? null;
  const availableOptions = propertiesResult.properties.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
  }));

  return (
    <div className="mx-auto grid max-w-7xl gap-16 px-6 pb-24 pt-32 md:pt-40 lg:grid-cols-12 lg:px-12">
      {/* Left Column: Editorial Advisory Context */}
      <div className="lg:col-span-5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-terracotta">
          Private advisory
        </p>
        <h1 className="mt-5 font-serif text-5xl leading-[.95] md:text-6xl md:leading-[.92]">
          Let’s begin a conversation.
        </h1>
        <p className="mt-8 max-w-sm text-sm leading-7 text-charcoal-600">
          Whether you are seeking a particular piece of architecture, arranging a discreet viewing, or preparing to place a residence, our advisory desk works with deliberate restraint.
        </p>

        <div className="mt-12 space-y-5 border-t border-charcoal-800/15 pt-8 text-sm">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-charcoal-400 block mb-1">
              Direct Concierge
            </span>
            <a
              className="inline-flex items-center gap-1.5 text-charcoal-800 hover:text-terracotta transition-colors"
              href={`mailto:${agencyConfig.contact.conciergeEmail}`}
            >
              <span>{agencyConfig.contact.conciergeEmail}</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-charcoal-400" />
            </a>
          </div>

          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-charcoal-400 block mb-1">
              Advisory Desk
            </span>
            <a
              className="inline-flex items-center gap-1.5 text-charcoal-800 hover:text-terracotta transition-colors"
              href={`tel:${agencyConfig.contact.phone.replace(/[^0-9+]/g, '')}`}
            >
              <span>{agencyConfig.contact.phone}</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-charcoal-400" />
            </a>
          </div>

          <div className="pt-2 text-xs text-charcoal-500 leading-relaxed">
            <span className="font-mono text-[10px] uppercase tracking-widest text-charcoal-400 block mb-1">
              Primary Office
            </span>
            <p>
              {agencyConfig.contact.offices[0].address}, {agencyConfig.contact.offices[0].city}
              <br />
              {agencyConfig.contact.offices[0].hours}
            </p>
          </div>
        </div>
      </div>

      {/* Right Column: Contact Form */}
      <div className="bg-sandstone-tint p-7 sm:p-10 md:p-12 lg:col-span-6 lg:col-start-7">
        <p className="mb-8 font-serif text-3xl">
          {selectedProperty
            ? `Enquire about ${selectedProperty.title}`
            : 'Tell us what you are looking for.'}
        </p>

        <EnquiryForm
          propertyId={selectedProperty?.id}
          propertyTitle={selectedProperty?.title}
          availableProperties={availableOptions}
        />
      </div>
    </div>
  );
}
