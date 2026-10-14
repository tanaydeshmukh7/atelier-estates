'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';

interface Enquiry { id: string; reference_id: string; full_name: string; email: string; phone: string | null; property_id: string | null; property_title: string | null; notes: string; type: string; status: string; created_at: string; properties?: { title?: string; slug?: string } | null; browsing?: { title: string; slug: string; visitedAt: string }[]; }

export default function EnquiriesPage() {
  const [items, setItems] = useState<Enquiry[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [error, setError] = useState('');
  useEffect(() => {
    getSupabaseClient()?.auth.getSession().then(async ({ data }) => {
      const response = await fetch('/api/admin/enquiries', { headers: { Authorization: `Bearer ${data.session?.access_token ?? ''}` } });
      const body = await response.json();
      if (!response.ok) setError(body.error ?? 'Unable to load enquiries.');
      else setItems(body.enquiries ?? []);
    });
  }, []);
  const filtered = useMemo(() => items.filter((item) => {
    const haystack = `${item.full_name} ${item.email} ${item.property_title ?? ''} ${item.notes}`.toLowerCase();
    const withinDate = dateRange === 'all' || new Date(item.created_at).getTime() >= Date.now() - Number(dateRange) * 86400000;
    return (status === 'all' || item.status === status) && withinDate && haystack.includes(query.toLowerCase());
  }), [items, query, status, dateRange]);
  async function updateStatus(id: string, nextStatus: string) {
    const { data } = await getSupabaseClient()?.auth.getSession() ?? { data: { session: null } };
    const response = await fetch('/api/admin/enquiries', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token ?? ''}` }, body: JSON.stringify({ id, status: nextStatus }) });
    if (!response.ok) setError((await response.json()).error ?? 'Unable to update enquiry.');
    else setItems((current) => current.map((item) => item.id === id ? { ...item, status: nextStatus } : item));
  }
  return <div><div><p className="font-mono text-[10px] uppercase tracking-widest text-terracotta">04 / Advisory desk</p><h1 className="mt-3 font-serif text-6xl">Enquiries</h1><p className="mt-3 text-sm text-charcoal-500">Visitor details shared voluntarily through the advisory form.</p></div><div className="mt-10 grid gap-4 md:grid-cols-[1fr_180px_180px]"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email, property…" className="admin-input" /><select value={status} onChange={(event) => setStatus(event.target.value)} className="admin-input"><option value="all">All statuses</option>{['pending', 'contacted', 'qualified', 'scheduled', 'closed', 'archived'].map((item) => <option key={item}>{item}</option>)}</select><select value={dateRange} onChange={(event) => setDateRange(event.target.value)} className="admin-input"><option value="all">All dates</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select></div>{error && <p className="mt-8 border border-terracotta/30 bg-terracotta-soft px-4 py-3 text-sm">{error}</p>}<div className="mt-10 space-y-4">{filtered.map((item) => <article key={item.id} className="border border-charcoal-800/15 bg-sandstone-tint p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-serif text-2xl">{item.full_name}</p><p className="mt-1 text-xs text-charcoal-500">{item.email}{item.phone ? ` · ${item.phone}` : ''} · {item.reference_id}</p></div><select value={item.status} onChange={(event) => updateStatus(item.id, event.target.value)} className="border border-charcoal-800/20 bg-limestone-100 px-3 py-2 text-xs uppercase tracking-wideEditorial">{['pending', 'contacted', 'qualified', 'scheduled', 'closed', 'archived'].map((value) => <option key={value}>{value}</option>)}</select></div><p className="mt-5 text-sm leading-6 text-charcoal-700">{item.notes}</p>{item.browsing?.length ? <div className="mt-5 border-t border-charcoal-800/10 pt-4"><p className="font-mono text-[10px] uppercase tracking-widest text-charcoal-500">Anonymous browsing before enquiry</p><div className="mt-2 flex flex-wrap gap-3 text-xs">{item.browsing.map((visit) => <Link key={visit.slug} href={`/properties/${visit.slug}`} className="text-terracotta hover:underline">{visit.title}</Link>)}</div></div> : null}<div className="mt-5 flex flex-wrap items-center gap-4 border-t border-charcoal-800/10 pt-4 text-xs text-charcoal-500"><span>{item.type.replace('_', ' ')}</span><span>{new Date(item.created_at).toLocaleString()}</span>{item.property_id && (item.properties?.slug ? <Link href={`/properties/${item.properties.slug}`} className="text-terracotta hover:underline">{item.property_title ?? item.properties.title ?? 'View property'}</Link> : <span>{item.property_title ?? 'Property no longer published'}</span>)}</div></article>)}{!filtered.length && !error && <p className="py-12 text-center text-sm text-charcoal-500">{items.length ? 'No enquiries match your filters.' : 'No enquiries have been received yet.'}</p>}</div></div>;
}
