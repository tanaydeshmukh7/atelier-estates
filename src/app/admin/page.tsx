'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowUpRight, Loader2, Sparkles, Inbox, Plus } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';

interface PropertyRow {
  id: string;
  title: string;
  published_at: string | null;
  status: string;
}

export default function AdminOverviewPage() {
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [enquiryCount, setEnquiryCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setError('');
      try {
        const supabase = getSupabaseClient();
        const { data: sessionData } = (await supabase?.auth.getSession()) ?? {
          data: { session: null },
        };
        const token = sessionData.session?.access_token ?? '';

        const [propsRes, enqRes] = await Promise.all([
          fetch('/api/admin/properties', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('/api/admin/enquiries', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!active) return;

        const propsBody = await propsRes.json();
        const enqBody = await enqRes.json();

        if (!propsRes.ok) {
          setError(propsBody.error ?? 'Unable to load dashboard.');
        } else {
          setProperties(propsBody.properties ?? []);
        }

        if (enqRes.ok && Array.isArray(enqBody.enquiries)) {
          setEnquiryCount(enqBody.enquiries.length);
        }
      } catch {
        if (active) setError('Network error while connecting to administrative desk.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadData();

    return () => {
      active = false;
    };
  }, []);

  const published = properties.filter((item) => item.published_at && item.status !== 'draft').length;
  const drafts = properties.length - published;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-terracotta">
            01 / Overview
          </p>
          <h1 className="mt-3 font-serif text-5xl md:text-6xl">Agency desk</h1>
          <p className="mt-3 text-sm text-charcoal-500">
            A quiet place to curate and steward the collection.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/properties/new"
            className="inline-flex items-center gap-2 bg-charcoal-800 px-4 py-3 text-xs uppercase tracking-wideEditorial text-limestone-100 hover:bg-terracotta transition-colors"
          >
            <Plus className="h-4 w-4" /> Add property
          </Link>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-8 border border-terracotta/30 bg-terracotta-soft px-4 py-3 text-sm"
        >
          {error}
        </p>
      )}

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-terracotta" />
          <p className="mt-4 font-mono text-xs uppercase tracking-widest text-charcoal-500">
            Loading desk intelligence…
          </p>
        </div>
      ) : (
        <>
          <div className="mt-12 grid gap-4 sm:grid-cols-4">
            <div className="border border-charcoal-800/15 bg-sandstone-tint p-6">
              <p className="font-mono text-[10px] uppercase tracking-widest text-charcoal-500">
                Total listings
              </p>
              <p className="mt-4 font-serif text-5xl">{properties.length}</p>
            </div>
            <div className="border border-charcoal-800/15 bg-sandstone-tint p-6">
              <p className="font-mono text-[10px] uppercase tracking-widest text-charcoal-500">
                Published
              </p>
              <p className="mt-4 font-serif text-5xl text-terracotta">{published}</p>
            </div>
            <div className="border border-charcoal-800/15 bg-sandstone-tint p-6">
              <p className="font-mono text-[10px] uppercase tracking-widest text-charcoal-500">
                Drafts
              </p>
              <p className="mt-4 font-serif text-5xl">{drafts}</p>
            </div>
            <div className="border border-charcoal-800/15 bg-sandstone-tint p-6">
              <p className="font-mono text-[10px] uppercase tracking-widest text-charcoal-500">
                Enquiries
              </p>
              <p className="mt-4 font-serif text-5xl">{enquiryCount}</p>
            </div>
          </div>

          <div className="mt-12 border-t border-charcoal-800/15 pt-8">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-3xl">Recent listings</h2>
              <Link
                href="/admin/properties"
                className="text-xs uppercase tracking-wideEditorial text-terracotta hover:underline inline-flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {properties.length > 0 ? (
              <div className="mt-4 divide-y divide-charcoal-800/10">
                {properties.slice(0, 5).map((property) => (
                  <div
                    key={property.id}
                    className="flex items-center justify-between py-4 text-sm"
                  >
                    <span className="font-medium text-charcoal-900">{property.title}</span>
                    <span
                      className={`font-mono text-[10px] uppercase tracking-widest ${
                        property.published_at ? 'text-terracotta' : 'text-charcoal-500'
                      }`}
                    >
                      {property.published_at ? property.status : 'draft'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              !error && (
                <p className="py-8 text-sm text-charcoal-500">
                  No listings yet. Add the first property to begin.
                </p>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}
