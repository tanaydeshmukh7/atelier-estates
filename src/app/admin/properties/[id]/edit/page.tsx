'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import PropertyForm from '@/components/admin/PropertyForm';
import { getSupabaseClient } from '@/lib/supabase';

export default function EditPropertyPage() {
  const params = useParams<{ id: string }>();
  const [property, setProperty] = useState<null | Record<string, unknown>>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    getSupabaseClient()?.auth.getSession().then(async ({ data }) => {
      const response = await fetch('/api/admin/properties', { headers: { Authorization: `Bearer ${data.session?.access_token ?? ''}` } });
      const body = await response.json();
      const match = (body.properties ?? []).find((item: { id: string }) => item.id === params.id);
      if (!match) setError(body.error ?? 'Property not found.');
      else setProperty(match);
    });
  }, [params.id]);
  if (error) return <p className="border border-terracotta/30 bg-terracotta-soft px-4 py-3 text-sm">{error}</p>;
  if (!property) return <p className="text-sm text-charcoal-500">Loading property…</p>;
  return <PropertyForm initial={property as never} />;
}
