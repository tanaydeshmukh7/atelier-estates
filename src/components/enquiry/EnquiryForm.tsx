'use client';

import { FormEvent, useState } from 'react';

export default function EnquiryForm({ propertyId, propertyTitle }: { propertyId?: string; propertyTitle?: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState('sending');
    setMessage('');
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          propertyTitle,
          fullName: form.get('fullName'),
          email: form.get('email'),
          phone: form.get('phone'),
          notes: form.get('notes'),
          type: form.get('type'),
          website: form.get('website'),
        }),
      });
      const result = await response.json().catch(() => ({ message: 'Unexpected server response.' }));
      setState(response.ok ? 'success' : 'error');
      setMessage(result.message ?? 'The enquiry could not be submitted.');
      if (response.ok) event.currentTarget.reset();
    } catch {
      setState('error');
      setMessage('We could not reach the enquiry service. Please try again.');
    }
  }
  return <form onSubmit={submit} aria-busy={state === 'sending'} className="space-y-5"><div className="hidden" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div><div className="grid gap-5 md:grid-cols-2"><label className="text-xs uppercase tracking-wideEditorial">Full name<input required minLength={2} maxLength={100} name="fullName" className="mt-2 w-full border-b border-charcoal-800/25 bg-transparent py-3 text-base normal-case tracking-normal outline-none focus:border-terracotta" /></label><label className="text-xs uppercase tracking-wideEditorial">Email<input required type="email" maxLength={160} name="email" className="mt-2 w-full border-b border-charcoal-800/25 bg-transparent py-3 text-base normal-case tracking-normal outline-none focus:border-terracotta" /></label></div><label className="block text-xs uppercase tracking-wideEditorial">Phone <span className="text-charcoal-400">(optional)</span><input name="phone" maxLength={40} className="mt-2 w-full border-b border-charcoal-800/25 bg-transparent py-3 text-base normal-case tracking-normal outline-none focus:border-terracotta" /></label><label className="block text-xs uppercase tracking-wideEditorial">Enquiry type<select name="type" className="mt-2 w-full border-b border-charcoal-800/25 bg-transparent py-3 text-base normal-case tracking-normal outline-none focus:border-terracotta"><option value="general">General enquiry</option><option value="viewing">Arrange a viewing</option><option value="private_acquisition">Private acquisition</option></select></label><label className="block text-xs uppercase tracking-wideEditorial">Message<textarea required minLength={10} maxLength={2000} name="notes" rows={4} className="mt-2 w-full resize-none border-b border-charcoal-800/25 bg-transparent py-3 text-base normal-case tracking-normal outline-none focus:border-terracotta" /></label><button disabled={state === 'sending'} className="bg-charcoal-800 px-6 py-3 text-xs uppercase tracking-wideEditorial text-limestone-100 hover:bg-terracotta disabled:opacity-50">{state === 'sending' ? 'Sending…' : 'Send enquiry'}</button>{message && <p role="status" className={state === 'success' ? 'text-sm text-terracotta' : 'text-sm text-red-700'}>{message}</p>}</form>;
}
