'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import PropertyForm from '@/components/admin/PropertyForm';
import { getSupabaseClient } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function EditPropertyPage() {
  const params = useParams<{ id: string }>();
  const [property, setProperty] = useState<null | Record<string, unknown>>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadProperty() {
      setLoading(true);
      setError('');
      try {
        const { data } = (await getSupabaseClient()?.auth.getSession()) ?? {
          data: { session: null },
        };
        const token = data.session?.access_token ?? '';

        // Attempt direct property fetch
        const response = await fetch(`/api/admin/properties/${params.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!active) return;

        if (response.ok) {
          const body = await response.json();
          setProperty(body.property);
        } else {
          // Fallback to searching collection
          const listResponse = await fetch('/api/admin/properties', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const listBody = await listResponse.json();
          const match = (listBody.properties ?? []).find(
            (item: { id: string }) => item.id === params.id
          );
          if (!match) {
            setError('Property not found in collection.');
          } else {
            setProperty(match);
          }
        }
      } catch {
        if (active) setError('Network error while retrieving property details.');
      } finally {
        if (active) setLoading(false);
      }
    }

    if (params.id) {
      void loadProperty();
    }

    return () => {
      active = false;
    };
  }, [params.id]);

  if (error) {
    return (
      <div
        role="alert"
        className="border border-terracotta/30 bg-terracotta-soft px-6 py-4 text-sm text-charcoal-900"
      >
        {error}
      </div>
    );
  }

  if (loading || !property) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-terracotta" />
        <p className="mt-4 font-mono text-xs uppercase tracking-widest text-charcoal-500">
          Loading residence editor…
        </p>
      </div>
    );
  }

  return <PropertyForm initial={property as never} />;
}
