'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, LockKeyhole } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';

const DEFAULT_PRODUCTION_SITE_URL = 'https://atelier-estates-one.vercel.app';

function getPasswordResetRedirectUrl() {
  const currentOrigin = window.location.origin;
  const isLocalDevelopment = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
  if (isLocalDevelopment) return `${currentOrigin}/admin/reset-password`;

  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_PRODUCTION_SITE_URL;
  try {
    const siteUrl = new URL(configuredSiteUrl);
    if (siteUrl.protocol !== 'https:') throw new Error('Production site URL must use HTTPS.');
    return `${siteUrl.origin}/admin/reset-password`;
  } catch {
    return `${currentOrigin}/admin/reset-password`;
  }
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (window.location.search.includes('unauthorized')) {
      setError('Your account is not authorized for agency management.');
    }
    if (window.location.search.includes('reset=success')) {
      setNotice('Your password was updated. Sign in with your new password.');
    }
    getSupabaseClient()?.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/admin');
    });
  }, [router]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError('Supabase is not configured for this environment.');
      setLoading(false);
      return;
    }
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      const message = signInError.message.toLowerCase();
      if (message.includes('email not confirmed')) {
        setError('This email address is not confirmed in Supabase Auth.');
      } else if (message.includes('invalid login credentials')) {
        setError('The password is incorrect, or this user has no email/password login identity. Reset the password in Supabase Auth and try again.');
      } else {
        setError('Supabase could not sign you in. Check the email, password, and project configured in .env.local.');
      }
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

  async function resetPassword() {
    setError('');
    setNotice('');
    if (!email) {
      setError('Enter your email address first, then choose reset password.');
      return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError('Supabase is not configured for this environment.');
      return;
    }
    const redirectTo = getPasswordResetRedirectUrl();
    console.info('[auth] password reset redirect selected', redirectTo);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    if (resetError) {
      setError('Unable to send a password reset email. Check the email and Supabase Auth URL settings.');
      return;
    }
    setNotice('Password reset instructions have been sent if this email belongs to an Auth user.');
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
          {notice && <p role="status" className="border border-limestone-100/20 bg-limestone-100/10 px-4 py-3 text-sm text-limestone-100">{notice}</p>}
          <button disabled={loading} className="inline-flex w-full items-center justify-center gap-2 bg-terracotta px-5 py-3 text-xs uppercase tracking-wideEditorial hover:bg-terracotta-light disabled:opacity-50">{loading ? 'Checking access…' : 'Sign in'} <ArrowUpRight className="h-4 w-4" /></button>
          <button type="button" onClick={resetPassword} className="w-full text-center text-xs uppercase tracking-wideEditorial text-limestone-100/60 hover:text-terracotta-light">Reset password</button>
        </form>
        <p className="mt-8 flex items-center gap-2 text-xs text-limestone-100/45"><LockKeyhole className="h-4 w-4" /> No public self-registration is enabled.</p>
      </div>
    </div>
  );
}
