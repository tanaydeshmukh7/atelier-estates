import type { Metadata } from 'next';
import { agencyConfig } from '@/config/agency';

export const metadata: Metadata = {
  title: 'Philosophy & Studio | Atelier Estates',
  description:
    'A slower, more considered way to find home. Atelier Estates represents architecturally significant residences where craft, light, and landscape converge.',
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 pb-24 pt-32 md:pt-40 lg:px-12">
      <p className="font-mono text-[10px] uppercase tracking-widest text-terracotta">
        The atelier
      </p>
      <h1 className="mt-5 max-w-4xl font-serif text-5xl leading-[.95] md:text-7xl lg:text-8xl md:leading-[.92]">
        A slower, more considered way to find home.
      </h1>

      <div className="mt-16 md:mt-20 grid gap-12 border-t border-charcoal-800/15 pt-12 lg:grid-cols-12">
        <p className="font-mono text-[10px] uppercase tracking-widest text-terracotta lg:col-span-3">
          Our point of view
        </p>
        <div className="lg:col-span-7">
          <p className="font-serif text-2xl md:text-3xl leading-snug">
            {agencyConfig.statement}
          </p>
          <p className="mt-8 text-sm leading-7 text-charcoal-600">
            Atelier Estates began with a simple conviction: the most meaningful homes deserve more than a listing. They deserve context, careful stewardship, and a conversation that begins long before a viewing.
          </p>
        </div>
      </div>

      <div className="mt-20 md:mt-24 grid gap-px bg-charcoal-800/15 md:grid-cols-3">
        {agencyConfig.philosophy.map((item) => (
          <section key={item.number} className="bg-limestone-100 p-8">
            <span className="font-mono text-xs text-terracotta">{item.number}</span>
            <h2 className="mt-12 md:mt-16 font-serif text-3xl">{item.title}</h2>
            <p className="mt-5 text-sm leading-7 text-charcoal-600">{item.description}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
