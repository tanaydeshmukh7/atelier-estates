'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, LockKeyhole } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('Checking your secure recovery link…');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setMessage('');
      setError('Supabase is not configured for this environment.');
      return;
    }
    const client = supabase;

    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const queryParams = new URLSearchParams(window.location.search);
    const code = queryParams.get('code');
    const hasImplicitRecovery = hashParams.get('type') === 'recovery' && hashParams.has('access_token');
    const recoveryErrorCode = hashParams.get('error_code') ?? queryParams.get('error_code');
    const recoveryError = hashParams.get('error') ?? queryParams.get('error');
    if (
      recoveryErrorCode === 'otp_expired' ||
      recoveryError === 'access_denied' ||
      recoveryError === 'invalid_request'
    ) {
      setMessage('');
      setError('This password reset link has expired or has already been used. Return to the login page and request a new reset email.');
      return;
    }

    let active = true;
    let recoverySession = false;

    const recoveryListener = client.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        recoverySession = true;
      }
    });

    async function initializeRecovery() {
      if (code) {
        const { error: exchangeError } = await client.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          if (active) {
            setMessage('');
            setError('This recovery link could not be verified. Request a new reset email.');
          }
          return;
        }
        recoverySession = true;
      }

      if (hasImplicitRecovery) {
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        if (!accessToken || !refreshToken) {
          setMessage('');
          setError('This recovery link is incomplete. Request a new reset email.');
          return;
        }
        const { error: sessionError } = await client.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (sessionError) {
          if (active) {
            setMessage('');
            setError('This recovery link could not be verified. Request a new reset email.');
          }
          return;
        }
        recoverySession = true;
      }

      const { data: refreshed } = await client.auth.getSession();
      if (!active) return;
      if (refreshed.session && recoverySession) {
        setMessage('');
        setError('');
        window.history.replaceState(null, '', '/admin/reset-password');
      } else {
        setMessage('');
        setError('This recovery link is missing, invalid, or has expired. Request a new reset email.');
      }
    }

    void initializeRecovery();

    return () => {
      active = false;
      recoveryListener.data.subscription.unsubscribe();
    };
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (saving) return;
    if (password.length < 8) {
      setError('Your password must be at least 8 characters.');
      return;
    }
    if (password !== confirmation) {
      setError('The passwords do not match.');
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setError('Supabase is not configured for this environment.');
      return;
    }
    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(`Unable to update the password: ${updateError.message}`);
      setSaving(false);
      return;
    }
    await supabase.auth.signOut();
    router.replace('/admin/login?reset=success');
  }

  return (
    <div className="min-h-screen bg-charcoal-900 px-6 pb-20 pt-40 text-limestone-100">
      <div className="mx-auto max-w-md">
        <p className="font-mono text-[10px] uppercase tracking-widest text-terracotta-light">Atelier Estates / Secure desk</p>
        <h1 className="mt-4 font-serif text-6xl leading-none">Set a new password</h1>
        <p className="mt-5 text-sm leading-7 text-limestone-100/65">Choose a new password for your agency account.</p>
        {message && <p className="mt-8 text-sm text-limestone-100/70">{message}</p>}
        {error && <p role="alert" className="mt-8 border border-terracotta-light/50 bg-terracotta/20 px-4 py-3 text-sm text-limestone-100">{error}</p>}
        {error && <a href="/admin/login" className="mt-5 inline-block text-xs uppercase tracking-wideEditorial text-terracotta-light hover:text-limestone-100">Request a new reset email</a>}
        {!message && !error && (
          <form onSubmit={submit} className="mt-10 space-y-5">
            <label className="block text-xs uppercase tracking-wideEditorial">New password<input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full border border-limestone-100/20 bg-transparent px-4 py-3 text-sm outline-none focus:border-terracotta-light" /></label>
            <label className="block text-xs uppercase tracking-wideEditorial">Confirm password<input required minLength={8} type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-2 w-full border border-limestone-100/20 bg-transparent px-4 py-3 text-sm outline-none focus:border-terracotta-light" /></label>
            <button disabled={saving} className="inline-flex w-full items-center justify-center gap-2 bg-terracotta px-5 py-3 text-xs uppercase tracking-wideEditorial hover:bg-terracotta-light disabled:opacity-50">{saving ? 'Updating…' : 'Update password'} <ArrowUpRight className="h-4 w-4" /></button>
          </form>
        )}
        <p className="mt-8 flex items-center gap-2 text-xs text-limestone-100/45"><LockKeyhole className="h-4 w-4" /> Recovery links expire for your protection.</p>
      </div>
    </div>
  );
}
