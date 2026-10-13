'use client';

import { useState, useEffect } from 'react';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Database, Info, X } from 'lucide-react';

export default function DemoStatusBanner() {
  const [isConfigured, setIsConfigured] = useState<boolean>(true);
  const [dismissed, setDismissed] = useState<boolean>(false);
  const [showDetails, setShowDetails] = useState<boolean>(false);

  useEffect(() => {
    setIsConfigured(isSupabaseConfigured());
  }, []);

  if (isConfigured || dismissed) {
    return null;
  }

  return (
    <aside aria-label="Database Status" className="relative z-50 bg-charcoal-900 text-limestone-100 text-xs py-2 px-4 border-b border-charcoal-700">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-terracotta/20 text-terracotta-light border border-terracotta/40 font-mono text-[10px] uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-terracotta animate-pulse" />
            Curated Demo Portfolio
          </span>
          <p className="text-charcoal-300">
            Showcase mode active for Northup Studio. Supabase credentials optional for evaluation.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-terracotta hover:text-white underline underline-offset-2 transition-colors flex items-center gap-1 font-mono text-[11px]"
          >
            <Info className="w-3 h-3" />
            {showDetails ? 'Hide Setup Guide' : 'Supabase Setup Info'}
          </button>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss banner"
            className="text-charcoal-400 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-charcoal-800 text-[11px] text-charcoal-300 font-mono flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <p>
            To connect live Supabase: Add <code className="text-terracotta-light bg-charcoal-800 px-1.5 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_URL</code>, <code className="text-terracotta-light bg-charcoal-800 px-1.5 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>, and the server-only service key to <code className="text-white">.env.local</code>. Apply <code className="text-white">supabase/schema.sql</code> and <code className="text-white">supabase/001_secure_enquiries.sql</code>.
          </p>
          <span className="inline-flex items-center gap-1 text-charcoal-400">
            <Database className="w-3 h-3 text-terracotta" />
            Graceful fallback enabled
          </span>
        </div>
      )}
    </aside>
  );
}
