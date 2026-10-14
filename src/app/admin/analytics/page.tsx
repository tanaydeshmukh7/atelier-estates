'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';

interface AnalyticsData {
  totalViews: number;
  uniqueVisitors: number;
  properties: { propertyId: string; title: string; slug: string; views: number; uniqueVisitors: number }[];
  daily: { date: string; views: number }[];
  recent: { id: string; propertyId: string; propertyTitle: string; visitedAt: string; source: string }[];
}

export default function AnalyticsPage() {
  const [days, setDays] = useState('30');
  const [propertyId, setPropertyId] = useState('');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    getSupabaseClient()?.auth.getSession().then(async ({ data: session }) => {
      const response = await fetch(`/api/admin/analytics?days=${days}${propertyId ? `&propertyId=${propertyId}` : ''}`, { headers: { Authorization: `Bearer ${session.session?.access_token ?? ''}` } });
      const body = await response.json();
      if (cancelled) return;
      if (!response.ok) setError(body.error ?? 'Unable to load analytics.');
      else setData(body);
    });
    return () => { cancelled = true; };
  }, [days, propertyId]);
  const maxViews = Math.max(...(data?.daily.map((item) => item.views) ?? [1]));
  return <div><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="font-mono text-[10px] uppercase tracking-widest text-terracotta">03 / Intelligence</p><h1 className="mt-3 font-serif text-6xl">Analytics</h1><p className="mt-3 text-sm text-charcoal-500">Anonymous property interest, measured with restraint.</p></div><div className="flex flex-wrap gap-3"><select value={days} onChange={(event) => setDays(event.target.value)} className="admin-input w-auto"><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select><select value={propertyId} onChange={(event) => setPropertyId(event.target.value)} className="admin-input w-auto"><option value="">All properties</option>{data?.properties.map((item) => <option key={item.propertyId} value={item.propertyId}>{item.title}</option>)}</select></div></div>{error && <p className="mt-8 border border-terracotta/30 bg-terracotta-soft px-4 py-3 text-sm">{error}</p>}{!data && !error && <p className="mt-12 text-sm text-charcoal-500">Loading analytics…</p>}{data && <><div className="mt-12 grid gap-4 sm:grid-cols-2"><Metric label="Property views" value={data.totalViews} /><Metric label="Unique visitors" value={data.uniqueVisitors} /></div><section className="mt-12 border-t border-charcoal-800/15 pt-6"><h2 className="font-serif text-3xl">Daily visits</h2>{data.daily.length ? <div className="mt-6 flex h-48 items-end gap-1 border-b border-charcoal-800/15">{data.daily.map((item) => <div key={item.date} className="group flex h-full flex-1 items-end" title={`${item.date}: ${item.views} views`}><div className="w-full bg-terracotta/70 transition group-hover:bg-terracotta" style={{ height: `${Math.max((item.views / maxViews) * 100, 4)}%` }} /></div>)}</div> : <p className="mt-6 text-sm text-charcoal-500">No visits in this period.</p>}</section><section className="mt-12 grid gap-12 lg:grid-cols-2"><div><h2 className="font-serif text-3xl">Most viewed properties</h2><div className="mt-4">{data.properties.map((item) => <div key={item.propertyId} className="flex items-center justify-between border-b border-charcoal-800/10 py-4 text-sm"><Link href={`/properties/${item.slug}`} className="hover:text-terracotta">{item.title}</Link><span className="font-mono text-xs text-charcoal-500">{item.views} views / {item.uniqueVisitors} visitors</span></div>)}{!data.properties.length && <p className="py-6 text-sm text-charcoal-500">No property visits yet.</p>}</div></div><div><h2 className="font-serif text-3xl">Recent visits</h2><div className="mt-4">{data.recent.slice(0, 8).map((item) => <div key={item.id} className="border-b border-charcoal-800/10 py-4 text-sm"><p>{item.propertyTitle}</p><p className="mt-1 text-xs text-charcoal-500">{new Date(item.visitedAt).toLocaleString()} · {item.source || 'direct'} · Anonymous visitor</p></div>)}{!data.recent.length && <p className="py-6 text-sm text-charcoal-500">No recent visits.</p>}</div></div></section></>}</div>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="border border-charcoal-800/15 bg-sandstone-tint p-6"><p className="font-mono text-[10px] uppercase tracking-widest text-charcoal-500">{label}</p><p className="mt-4 font-serif text-5xl">{value}</p></div>;
}
