import Link from 'next/link';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 pt-32 pb-24">
      <div className="max-w-xl text-center">
        <p className="font-mono text-[10px] uppercase tracking-widest text-terracotta">
          404 / Missing Residence
        </p>
        <h1 className="mt-4 font-serif text-6xl md:text-7xl leading-tight text-charcoal-900">
          Threshold not found.
        </h1>
        <p className="mt-6 text-sm leading-7 text-charcoal-600 max-w-md mx-auto">
          The architectural residence or dossier you are looking for is either off-market, no longer published, or has moved.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/properties"
            className="inline-flex items-center gap-2 bg-charcoal-800 px-6 py-3.5 text-xs uppercase tracking-wideEditorial text-limestone-100 hover:bg-terracotta transition-colors"
          >
            Explore the collection <ArrowUpRight className="h-4 w-4" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 border border-charcoal-800/20 px-6 py-3.5 text-xs uppercase tracking-wideEditorial text-charcoal-800 hover:bg-sandstone-tint transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Return home
          </Link>
        </div>
      </div>
    </div>
  );
}
