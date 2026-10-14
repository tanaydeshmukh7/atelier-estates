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

    const recoveryListener = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMessage('');
        setError('');
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        setMessage('');
        setError('This recovery link is missing or has expired. Request a new reset email.');
      } else {
        setMessage('');
      }
    });

    return () => recoveryListener.data.subscription.unsubscribe();
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
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
      setError('Unable to update the password. Request a new recovery email and try again.');
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
