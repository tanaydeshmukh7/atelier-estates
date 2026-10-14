'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, LockKeyhole } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (window.location.search.includes('unauthorized')) {
      setError('Your account is not authorized for agency management.');
    }
    getSupabaseClient()?.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/admin');
    });
  }, [router]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError('Supabase is not configured for this environment.');
      setLoading(false);
      return;
    }
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError('Unable to sign in with those credentials.');
      setLoading(false);
      return;
    }
    const { data: session } = await supabase.auth.getSession();
    const response = await fetch('/api/admin/me', {
      headers: { Authorization: `Bearer ${session.session?.access_token ?? ''}` },
    });
    if (!response.ok) {
      await supabase.auth.signOut();
      setError('Your account is not authorized for agency management.');
      setLoading(false);
      return;
    }
    router.replace('/admin');
  }

  return (
    <div className="min-h-screen bg-charcoal-900 px-6 pb-20 pt-40 text-limestone-100">
      <div className="mx-auto max-w-md">
        <p className="font-mono text-[10px] uppercase tracking-widest text-terracotta-light">Atelier Estates / Secure desk</p>
        <h1 className="mt-4 font-serif text-6xl leading-none">Agency sign in</h1>
        <p className="mt-5 text-sm leading-7 text-limestone-100/65">Management access is limited to agency members provisioned in Supabase.</p>
        <form onSubmit={submit} className="mt-10 space-y-5">
          <label className="block text-xs uppercase tracking-wideEditorial">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full border border-limestone-100/20 bg-transparent px-4 py-3 text-sm outline-none focus:border-terracotta-light" /></label>
          <label className="block text-xs uppercase tracking-wideEditorial">Password<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full border border-limestone-100/20 bg-transparent px-4 py-3 text-sm outline-none focus:border-terracotta-light" /></label>
          {error && <p role="alert" className="border border-terracotta-light/50 bg-terracotta/20 px-4 py-3 text-sm text-limestone-100">{error}</p>}
          <button disabled={loading} className="inline-flex w-full items-center justify-center gap-2 bg-terracotta px-5 py-3 text-xs uppercase tracking-wideEditorial hover:bg-terracotta-light disabled:opacity-50">{loading ? 'Checking access…' : 'Sign in'} <ArrowUpRight className="h-4 w-4" /></button>
        </form>
        <p className="mt-8 flex items-center gap-2 text-xs text-limestone-100/45"><LockKeyhole className="h-4 w-4" /> No public self-registration is enabled.</p>
      </div>
    </div>
  );
}
