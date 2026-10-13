import Image from 'next/image';
import Link from 'next/link';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { agencyConfig } from '@/config/agency';
import { getProperties } from '@/lib/properties';
import PropertyCard from '@/components/properties/PropertyCard';
import ArchitecturalHero3D from '@/components/3d/ArchitecturalHero3D';

export default async function HomePage() {
  const { properties, isDemo } = await getProperties();
  const featured = properties.filter((property) => property.isFeatured).slice(0, 3);
  const heroImage = featured[0]?.images[0];
  return <div>
    <section className="relative flex min-h-[90vh] items-end overflow-hidden bg-charcoal-900 text-limestone-100">
      {heroImage && <Image src={heroImage.url} alt={heroImage.alt} fill priority sizes="100vw" className="object-cover opacity-55" />}
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950 via-charcoal-900/20 to-charcoal-900/10" />
      <div className="relative mx-auto w-full max-w-7xl px-6 pb-20 pt-48 lg:px-12"><p className="mb-6 font-mono text-[10px] uppercase tracking-widest text-terracotta-light">Atelier Estates / Architectural residences</p><h1 className="max-w-4xl font-serif text-6xl leading-[.9] tracking-tight md:text-8xl">{agencyConfig.heroHeadline}</h1><p className="mt-8 max-w-md text-sm leading-7 text-limestone-100/75">A considered collection of homes shaped by light, material, and landscape.</p><Link href="/properties" className="mt-10 inline-flex items-center gap-3 border border-limestone-100/50 px-5 py-3 text-xs uppercase tracking-wideEditorial hover:bg-limestone-100 hover:text-charcoal-900">Explore the collection <ArrowUpRight className="h-4 w-4" /></Link></div>
      <a href="#featured" className="absolute bottom-8 right-8 hidden items-center gap-2 font-mono text-[10px] uppercase tracking-widest md:flex">Scroll to explore <ArrowDown className="h-4 w-4" /></a>
    </section>
    <section id="featured" className="mx-auto max-w-7xl px-6 py-24 lg:px-12"><div className="mb-12 flex items-end justify-between gap-6"><div><p className="font-mono text-[10px] uppercase tracking-widest text-terracotta">01 / The collection</p><h2 className="mt-3 font-serif text-5xl">Selected residences</h2></div><Link href="/properties" className="hidden items-center gap-2 text-xs uppercase tracking-wideEditorial md:flex">View all properties <ArrowUpRight className="h-4 w-4" /></Link></div>{featured.length ? <div className="grid gap-8 md:grid-cols-3">{featured.map((property) => <PropertyCard key={property.id} property={property} />)}</div> : <p className="text-charcoal-500">The collection is currently being refreshed.</p>}<p className="mt-8 font-mono text-[10px] uppercase tracking-widest text-charcoal-400">{isDemo ? 'Portfolio demonstration collection' : 'Live collection via Supabase'}</p></section>
    <section id="architecture-3d" className="bg-sandstone-tint"><div className="mx-auto max-w-7xl px-6 pt-24 lg:px-12"><p className="font-mono text-[10px] uppercase tracking-widest text-terracotta">02 / Material study</p><h2 className="mt-3 max-w-xl font-serif text-5xl">Architecture in motion.</h2><p className="mt-5 max-w-lg text-sm leading-7 text-charcoal-600">A procedural study of stone, glass, timber, and water. Scroll through the layers of a residence designed around its landscape.</p></div><ArchitecturalHero3D /></section>
    <section className="bg-charcoal-900 px-6 py-24 text-limestone-100 lg:px-12"><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-12"><p className="font-mono text-[10px] uppercase tracking-widest text-terracotta-light lg:col-span-3">03 / Our approach</p><div className="lg:col-span-7"><h2 className="font-serif text-5xl leading-tight">Not a marketplace. A point of view.</h2><p className="mt-7 max-w-xl text-sm leading-7 text-charcoal-300">{agencyConfig.statement}</p><Link href="/about" className="mt-9 inline-flex items-center gap-2 border-b border-terracotta-light pb-2 text-xs uppercase tracking-wideEditorial text-terracotta-light">The atelier philosophy <ArrowUpRight className="h-4 w-4" /></Link></div></div></section>
  </div>;
}
