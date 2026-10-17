'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { ArrowUpRight, Pencil, Trash2, Loader2, Building2 } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';

interface PropertyRow {
  id: string;
  title: string;
  slug: string;
  location: { city?: string; country?: string };
  price: number;
  property_type: string;
  status: string;
  published_at: string | null;
  is_featured: boolean;
  images: { url: string; alt: string }[];
  metrics?: { views: number; uniqueVisitors: number; enquiries: number };
}

export default function AdminPropertiesPage() {
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data } = (await getSupabaseClient()?.auth.getSession()) ?? {
      data: { session: null },
    };
    try {
      const response = await fetch('/api/admin/properties', {
        headers: {
          Authorization: `Bearer ${data.session?.access_token ?? ''}`,
        },
      });
      const body = await response.json();
      if (!response.ok) setMessage(body.error ?? 'Unable to load listings.');
      else setProperties(body.properties ?? []);
    } catch {
      setMessage('Failed to load listings. Check your network connection.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function remove(id: string, title: string) {
    if (deletingId || !window.confirm(`Delete "${title}" and its image metadata?`)) return;
    setMessage('');
    setDeletingId(id);
    const { data } = (await getSupabaseClient()?.auth.getSession()) ?? {
      data: { session: null },
    };
    try {
      const response = await fetch(`/api/admin/properties/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${data.session?.access_token ?? ''}`,
        },
      });
      const body = await response.json();
      if (!response.ok) {
        setMessage(body.error ?? 'Unable to delete listing.');
        return;
      }
      setProperties((current) => current.filter((item) => item.id !== id));
      setMessage(body.warning ?? 'Property deleted successfully.');
    } catch {
      setMessage('Unable to reach the server. The property was not deleted.');
    } finally {
      setDeletingId(null);
    }
  }

  async function togglePublication(property: PropertyRow) {
    const { data } = (await getSupabaseClient()?.auth.getSession()) ?? {
      data: { session: null },
    };
    const status = property.published_at ? 'draft' : 'available';
    try {
      const response = await fetch(`/api/admin/properties/${property.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${data.session?.access_token ?? ''}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        setMessage((await response.json()).error ?? 'Unable to change publication status.');
      } else {
        setProperties((current) =>
          current.map((item) =>
            item.id === property.id
              ? {
                  ...item,
                  published_at: status === 'draft' ? null : new Date().toISOString(),
                  status,
                }
              : item
          )
        );
      }
    } catch {
      setMessage('Network failure: publication status could not be changed.');
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-terracotta">
            02 / Collection
          </p>
          <h1 className="mt-3 font-serif text-5xl md:text-6xl">Properties</h1>
        </div>
        <Link
          href="/admin/properties/new"
          className="inline-flex items-center gap-2 bg-charcoal-800 px-4 py-3 text-xs uppercase tracking-wideEditorial text-limestone-100 hover:bg-terracotta transition-colors"
        >
          Add property <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      {message && (
        <p
          role="status"
          className="mt-8 border border-terracotta/30 bg-terracotta-soft px-4 py-3 text-sm"
        >
          {message}
        </p>
      )}

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-terracotta" />
          <p className="mt-4 font-mono text-xs uppercase tracking-widest text-charcoal-500">
            Loading properties…
          </p>
        </div>
      ) : (
        <div className="mt-10 overflow-x-auto border-t border-charcoal-800/15">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b border-charcoal-800/15 font-mono text-[10px] uppercase tracking-widest text-charcoal-500">
                <th className="py-4">Listing</th>
                <th>Status</th>
                <th>Price</th>
                <th>Engagement</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((property) => (
                <tr key={property.id} className="border-b border-charcoal-800/10">
                  <td className="flex items-center gap-4 py-4">
                    <div className="relative h-14 w-20 overflow-hidden bg-sandstone-tint flex items-center justify-center">
                      {property.images?.[0]?.url ? (
                        <Image
                          src={property.images[0].url}
                          alt={property.title}
                          fill
                          sizes="80px"
                          unoptimized
                          className="object-cover"
                        />
                      ) : (
                        <Building2 className="h-6 w-6 text-charcoal-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-serif text-xl">{property.title}</p>
                      <p className="text-xs text-charcoal-500">
                        {property.location?.city}, {property.location?.country}
                      </p>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`font-mono text-[10px] uppercase tracking-widest ${
                        property.published_at ? 'text-terracotta' : 'text-charcoal-500'
                      }`}
                    >
                      {property.published_at ? property.status : 'draft'}
                    </span>
                  </td>
                  <td className="font-mono text-xs">
                    €{Number(property.price).toLocaleString('en-US')}
                  </td>
                  <td className="text-xs text-charcoal-600">
                    {property.metrics?.views ?? 0} views · {property.metrics?.enquiries ?? 0} enquiries
                  </td>
                  <td>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => togglePublication(property)}
                        className="border border-charcoal-800/15 px-2.5 py-1 text-[10px] uppercase tracking-widest hover:border-terracotta transition-colors"
                      >
                        {property.published_at ? 'Unpublish' : 'Publish'}
                      </button>
                      <Link
                        href={`/admin/properties/${property.id}/edit`}
                        aria-label={`Edit ${property.title}`}
                        className="border border-charcoal-800/15 p-2 hover:border-terracotta transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        disabled={Boolean(deletingId)}
                        onClick={() => void remove(property.id, property.title)}
                        aria-label={`Delete ${property.title}`}
                        className="border border-charcoal-800/15 p-2 hover:border-terracotta disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!properties.length && !message && (
            <p className="py-12 text-center text-sm text-charcoal-500">
              No properties yet. Add your first listing.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
