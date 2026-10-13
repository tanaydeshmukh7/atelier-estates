import Link from 'next/link';
import { agencyConfig } from '@/config/agency';
import { ArrowUpRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-charcoal-900 text-limestone-100 pt-20 pb-12 border-t border-charcoal-800">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* Top Editorial Monograph */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-16 border-b border-charcoal-700/60">
          <div className="lg:col-span-5 space-y-4">
            <span className="font-mono text-[10px] uppercase tracking-widestEditorial text-terracotta-light">
              Architectural Advisory
            </span>
            <h2 className="font-serif text-3xl lg:text-4xl leading-tight text-limestone-100 font-light">
              Atelier Estates
            </h2>
            <p className="text-charcoal-400 text-sm leading-relaxed max-w-md">
              A private real estate atelier curated by Northup Studio. We represent exceptional private residences, historic bastides, and modern architectural masterpieces across Europe, North America, and Japan.
            </p>
          </div>

          <div className="lg:col-span-3 space-y-4">
            <span className="font-mono text-[10px] uppercase tracking-widestEditorial text-charcoal-400">
              International Desks
            </span>
            <div className="space-y-4 text-xs text-charcoal-300">
              {agencyConfig.contact.offices.map((office) => (
                <div key={office.city} className="border-l border-charcoal-700 pl-3">
                  <div className="font-medium text-limestone-100 font-serif text-sm">
                    {office.city}
                  </div>
                  <div className="text-charcoal-400">{office.address}</div>
                  <div className="font-mono text-[10px] text-terracotta-light mt-0.5">
                    {office.hours}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <span className="font-mono text-[10px] uppercase tracking-widestEditorial text-charcoal-400">
              Private Enquiries
            </span>
            <div className="space-y-2">
              <a
                href={`mailto:${agencyConfig.contact.conciergeEmail}`}
                className="group flex items-center justify-between py-2 border-b border-charcoal-700/60 text-sm text-limestone-100 hover:text-terracotta-light transition-colors"
              >
                <span>{agencyConfig.contact.conciergeEmail}</span>
                <ArrowUpRight className="w-4 h-4 text-charcoal-500 group-hover:text-terracotta-light transition-colors" />
              </a>
              <a
                href={`tel:${agencyConfig.contact.phone.replace(/[^0-9+]/g, '')}`}
                className="group flex items-center justify-between py-2 border-b border-charcoal-700/60 text-sm text-limestone-100 hover:text-terracotta-light transition-colors"
              >
                <span>{agencyConfig.contact.phone}</span>
                <ArrowUpRight className="w-4 h-4 text-charcoal-500 group-hover:text-terracotta-light transition-colors" />
              </a>
            </div>
            <div className="pt-2">
              <Link
                href="/contact"
                className="inline-block w-full text-center py-3 bg-terracotta hover:bg-terracotta-dark text-white text-xs uppercase tracking-wideEditorial transition-colors"
              >
                Schedule Private Viewing
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-charcoal-400 gap-4">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} Atelier Estates.</span>
            <span>A portfolio project by Northup Studio.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/properties" className="hover:text-limestone-100 transition-colors">
              Collection
            </Link>
            <Link href="/about" className="hover:text-limestone-100 transition-colors">
              Philosophy
            </Link>
            <Link href="/contact" className="hover:text-limestone-100 transition-colors">
              Advisory
            </Link>
            <span className="font-mono text-[10px] text-charcoal-500">
              All listings marked for portfolio presentation
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
