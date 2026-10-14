'use client';

import { useEffect } from 'react';
import { getVisitorContext } from '@/lib/visitor';
import { getSupabaseClient } from '@/lib/supabase';

export default function PropertyVisitTracker({ propertyId, slug, title }: { propertyId: string; slug: string; title: string }) {
  useEffect(() => {
    async function recordVisit() {
      const context = getVisitorContext();
      const supabase = getSupabaseClient();
      const session = await supabase?.auth.getSession();
      if (session?.data.session) {
        const response = await fetch('/api/admin/me', { headers: { Authorization: `Bearer ${session.data.session.access_token}` } });
        if (response.ok) return;
      }
      const rawReferrer = document.referrer || '';
      let referrer: string | null = null;
      let source = 'direct';
      try {
        if (rawReferrer) {
          const parsed = new URL(rawReferrer);
          referrer = `${parsed.origin}${parsed.pathname}`.slice(0, 500);
          source = parsed.hostname;
        }
      } catch { /* Ignore malformed browser referrers. */ }
      fetch('/api/analytics/visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, slug, title, ...context, referrer, source }),
        keepalive: true,
      }).catch(() => undefined);
    }
    void recordVisit();
  }, [propertyId, slug, title]);

  return null;
}
