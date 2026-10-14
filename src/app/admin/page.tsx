'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';

interface PropertyRow { id: string; title: string; published_at: string | null; status: string; }

export default function AdminOverviewPage() {
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    getSupabaseClient()?.auth.getSession().then(async ({ data }) => {
      const response = await fetch('/api/admin/properties', { headers: { Authorization: `Bearer ${data.session?.access_token ?? ''}` } });
      const body = await response.json();
      if (!response.ok) setError(body.error ?? 'Unable to load dashboard.');
      else setProperties(body.properties ?? []);
    });
  }, []);
  const published = properties.filter((item) => item.published_at && item.status !== 'draft').length;
  return <div><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="font-mono text-[10px] uppercase tracking-widest text-terracotta">01 / Overview</p><h1 className="mt-3 font-serif text-6xl">Agency desk</h1><p className="mt-3 text-sm text-charcoal-500">A quiet place to shape the collection.</p></div><Link href="/admin/properties/new" className="inline-flex items-center gap-2 bg-charcoal-800 px-4 py-3 text-xs uppercase tracking-wideEditorial text-limestone-100 hover:bg-terracotta">Add a property <ArrowUpRight className="h-4 w-4" /></Link></div>
    {error && <p className="mt-8 border border-terracotta/30 bg-terracotta-soft px-4 py-3 text-sm">{error}</p>}
    <div className="mt-12 grid gap-4 sm:grid-cols-3">{[['Total listings', properties.length], ['Published', published], ['Drafts', properties.length - published]].map(([label, value]) => <div key={String(label)} className="border border-charcoal-800/15 bg-sandstone-tint p-6"><p className="font-mono text-[10px] uppercase tracking-widest text-charcoal-500">{label}</p><p className="mt-4 font-serif text-5xl">{value}</p></div>)}</div>
    <div className="mt-12 border-t border-charcoal-800/15 pt-6"><div className="flex items-center justify-between"><h2 className="font-serif text-3xl">Recent listings</h2><Link href="/admin/properties" className="text-xs uppercase tracking-wideEditorial text-terracotta">View all</Link></div>{properties.slice(0, 5).map((property) => <div key={property.id} className="flex items-center justify-between border-b border-charcoal-800/10 py-5 text-sm"><span>{property.title}</span><span className="font-mono text-[10px] uppercase tracking-widest text-charcoal-500">{property.published_at ? property.status : 'draft'}</span></div>)}{!properties.length && !error && <p className="py-8 text-sm text-charcoal-500">No listings yet. Add the first property to begin.</p>}</div>
  </div>;
}
