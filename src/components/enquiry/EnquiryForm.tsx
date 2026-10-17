'use client';

import { FormEvent, useId, useState } from 'react';
import { getVisitorContext } from '@/lib/visitor';
import type { EnquiryType } from '@/types/enquiry';
import { CheckCircle2, AlertCircle, Loader2, Calendar, Building2, Send, RotateCcw } from 'lucide-react';

interface AvailablePropertyOption {
  id: string;
  title: string;
  slug?: string;
}

interface EnquiryFormProps {
  propertyId?: string;
  propertyTitle?: string;
  availableProperties?: AvailablePropertyOption[];
  onSuccess?: (referenceId: string) => void;
  className?: string;
}

interface FormValues {
  fullName: string;
  email: string;
  phone: string;
  type: EnquiryType;
  propertyId: string;
  preferredDate: string;
  message: string;
  website: string; // Honeypot
}

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  preferredDate?: string;
  message?: string;
  general?: string;
}

export default function EnquiryForm({
  propertyId: initialPropertyId,
  propertyTitle: initialPropertyTitle,
  availableProperties = [],
  onSuccess,
  className = '',
}: EnquiryFormProps) {
  const formId = useId();

  // Initial values
  const [values, setValues] = useState<FormValues>({
    fullName: '',
    email: '',
    phone: '',
    type: initialPropertyId ? 'viewing' : 'general',
    propertyId: initialPropertyId ?? '',
    preferredDate: '',
    message: '',
    website: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ referenceId: string; message: string; propertyTitle?: string } | null>(null);

  // Determine current property title
  const activePropertyTitle =
    initialPropertyTitle ??
    availableProperties.find((p) => p.id === values.propertyId)?.title ??
    null;

  // Minimum date for viewing request is today
  const todayStr = new Date().toISOString().split('T')[0];

  function validateField(name: keyof FormValues, value: string): string | undefined {
    switch (name) {
      case 'fullName': {
        const trimmed = value.trim();
        if (!trimmed) return 'Full name is required.';
        if (trimmed.length < 2) return 'Full name must be at least 2 characters.';
        if (trimmed.length > 100) return 'Full name must not exceed 100 characters.';
        return undefined;
      }
      case 'email': {
        const trimmed = value.trim();
        if (!trimmed) return 'Email address is required.';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmed)) return 'Please provide a valid email address.';
        if (trimmed.length > 160) return 'Email address is too long.';
        return undefined;
      }
      case 'phone': {
        const trimmed = value.trim();
        if (!trimmed) return undefined; // Phone is optional
        if (trimmed.length < 5 || trimmed.length > 40) return 'Phone number must be between 5 and 40 characters.';
        if (!/^[\d\s+\-().]+$/.test(trimmed)) return 'Phone number contains invalid characters.';
        return undefined;
      }
      case 'preferredDate': {
        if (!value) return undefined; // Optional
        if (value < todayStr) return 'Preferred viewing date cannot be in the past.';
        return undefined;
      }
      case 'message': {
        const trimmed = value.trim();
        if (!trimmed) return 'Please enter your message or requirements.';
        if (trimmed.length < 10) return 'Message must be at least 10 characters.';
        if (trimmed.length > 2000) return 'Message cannot exceed 2,000 characters.';
        return undefined;
      }
      default:
        return undefined;
    }
  }

  function handleChange(name: keyof FormValues, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error, general: undefined }));
    }
  }

  function handleBlur(name: keyof FormValues) {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, values[name]);
    setErrors((prev) => ({ ...prev, [name]: error }));
  }

  function validateAll(): boolean {
    const newErrors: FormErrors = {};
    type ValidatedField = 'fullName' | 'email' | 'phone' | 'preferredDate' | 'message';
    const fields: ValidatedField[] = ['fullName', 'email', 'phone', 'preferredDate', 'message'];

    for (const field of fields) {
      const error = validateField(field, values[field]);
      if (error) newErrors[field] = error;
    }

    setErrors(newErrors);
    setTouched({
      fullName: true,
      email: true,
      phone: true,
      preferredDate: true,
      message: true,
    });

    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Prevent duplicate submissions
    if (isSubmitting) return;

    // Validate client-side first
    if (!validateAll()) {
      return;
    }

    setIsSubmitting(true);
    setErrors((prev) => ({ ...prev, general: undefined }));

    try {
      const visitorContext = getVisitorContext();
      const payload = {
        fullName: values.fullName.trim(),
        email: values.email.trim().toLowerCase(),
        phone: values.phone.trim(),
        message: values.message.trim(),
        type: values.type,
        propertyId: values.propertyId || undefined,
        propertyTitle: activePropertyTitle || undefined,
        preferredDate: values.preferredDate || undefined,
        website: values.website, // Honeypot
        ...visitorContext,
      };

      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({
        message: 'Unexpected server response. Please try again.',
      }));

      if (!response.ok) {
        // Recoverable error: preserve values and show error message
        setErrors((prev) => ({
          ...prev,
          general: result.message || 'We could not save your enquiry. Please check the fields and try again.',
        }));
        setIsSubmitting(false);
        return;
      }

      // Success confirmed by server
      setSubmitSuccess(true);
      setSuccessInfo({
        referenceId: result.referenceId,
        message: result.message || 'Your enquiry has been received. Our advisory desk will be in touch within 24 hours.',
        propertyTitle: result.propertyTitle || activePropertyTitle || undefined,
      });

      if (onSuccess) {
        onSuccess(result.referenceId);
      }
    } catch {
      // Network error: preserve form values
      setErrors((prev) => ({
        ...prev,
        general: 'Unable to reach the advisory desk service. Please verify your connection and try again.',
      }));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReset() {
    setValues({
      fullName: '',
      email: '',
      phone: '',
      type: initialPropertyId ? 'viewing' : 'general',
      propertyId: initialPropertyId ?? '',
      preferredDate: '',
      message: '',
      website: '',
    });
    setErrors({});
    setTouched({});
    setSubmitSuccess(false);
    setSuccessInfo(null);
  }

  // Success view
  if (submitSuccess && successInfo) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`border border-terracotta/30 bg-limestone-50/80 p-8 text-charcoal-800 shadow-subtle animate-in fade-in duration-500 ${className}`}
      >
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-terracotta/10 p-2 text-terracotta">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div className="space-y-3">
            <p className="font-mono text-[10px] uppercase tracking-widest text-terracotta">
              Enquiry confirmed
            </p>
            <h3 className="font-serif text-3xl leading-tight">Thank you.</h3>
            <p className="text-sm leading-relaxed text-charcoal-700">
              {successInfo.message}
            </p>

            <div className="mt-4 border-t border-charcoal-800/10 pt-4 text-xs space-y-1.5 font-mono text-charcoal-600">
              <p>
                <span className="text-charcoal-400">Reference:</span>{' '}
                <strong className="text-charcoal-900">{successInfo.referenceId}</strong>
              </p>
              {successInfo.propertyTitle && (
                <p>
                  <span className="text-charcoal-400">Residence:</span>{' '}
                  <strong className="text-charcoal-900">{successInfo.propertyTitle}</strong>
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="mt-6 inline-flex items-center gap-2 border border-charcoal-800/20 px-4 py-2.5 text-xs uppercase tracking-wideEditorial text-charcoal-800 hover:bg-charcoal-800 hover:text-limestone-100 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Send another enquiry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-busy={isSubmitting}
      className={`space-y-6 ${className}`}
    >
      {/* Honeypot spam trap (hidden from users and screen readers) */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor={`${formId}-website`}>
          Leave this empty
          <input
            id={`${formId}-website`}
            name="website"
            value={values.website}
            onChange={(e) => handleChange('website', e.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </label>
      </div>

      {/* Property of Interest Display or Selector */}
      {initialPropertyId ? (
        <div className="rounded-none border border-charcoal-800/15 bg-limestone-100/70 p-4">
          <div className="flex items-center gap-2.5">
            <Building2 className="h-4 w-4 text-terracotta" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-charcoal-500">
              Property of Interest
            </span>
          </div>
          <p className="mt-1 font-serif text-xl text-charcoal-900">
            {activePropertyTitle || 'Selected Residence'}
          </p>
        </div>
      ) : availableProperties.length > 0 ? (
        <div>
          <label
            htmlFor={`${formId}-property`}
            className="block text-xs uppercase tracking-wideEditorial text-charcoal-700"
          >
            Property of Interest <span className="text-charcoal-400 font-normal">(optional)</span>
          </label>
          <select
            id={`${formId}-property`}
            name="propertyId"
            value={values.propertyId}
            onChange={(e) => handleChange('propertyId', e.target.value)}
            className="mt-2 w-full border-b border-charcoal-800/25 bg-transparent py-3 text-sm outline-none transition-colors focus:border-terracotta"
          >
            <option value="">General enquiry / All properties</option>
            {availableProperties.map((prop) => (
              <option key={prop.id} value={prop.id}>
                {prop.title}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {/* Full Name & Email Fields */}
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label
            htmlFor={`${formId}-fullName`}
            className="block text-xs uppercase tracking-wideEditorial text-charcoal-700"
          >
            Full name <span className="text-terracotta">*</span>
          </label>
          <input
            id={`${formId}-fullName`}
            name="fullName"
            type="text"
            required
            autoComplete="name"
            placeholder="e.g. Eleanor Vance"
            value={values.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            onBlur={() => handleBlur('fullName')}
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={errors.fullName ? `${formId}-fullName-error` : undefined}
            className={`mt-2 w-full border-b bg-transparent py-3 text-base text-charcoal-900 placeholder:text-charcoal-400/60 outline-none transition-colors focus:border-terracotta ${
              errors.fullName ? 'border-red-600' : 'border-charcoal-800/25'
            }`}
          />
          {errors.fullName && (
            <p id={`${formId}-fullName-error`} role="alert" className="mt-1.5 text-xs text-red-700">
              {errors.fullName}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor={`${formId}-email`}
            className="block text-xs uppercase tracking-wideEditorial text-charcoal-700"
          >
            Email address <span className="text-terracotta">*</span>
          </label>
          <input
            id={`${formId}-email`}
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="e.g. eleanor@vancestudio.com"
            value={values.email}
            onChange={(e) => handleChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? `${formId}-email-error` : undefined}
            className={`mt-2 w-full border-b bg-transparent py-3 text-base text-charcoal-900 placeholder:text-charcoal-400/60 outline-none transition-colors focus:border-terracotta ${
              errors.email ? 'border-red-600' : 'border-charcoal-800/25'
            }`}
          />
          {errors.email && (
            <p id={`${formId}-email-error`} role="alert" className="mt-1.5 text-xs text-red-700">
              {errors.email}
            </p>
          )}
        </div>
      </div>

      {/* Phone Number & Enquiry Type */}
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label
            htmlFor={`${formId}-phone`}
            className="block text-xs uppercase tracking-wideEditorial text-charcoal-700"
          >
            Phone number <span className="text-charcoal-400 font-normal">(optional)</span>
          </label>
          <input
            id={`${formId}-phone`}
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="e.g. +44 20 7946 0880"
            value={values.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            onBlur={() => handleBlur('phone')}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? `${formId}-phone-error` : undefined}
            className={`mt-2 w-full border-b bg-transparent py-3 text-base text-charcoal-900 placeholder:text-charcoal-400/60 outline-none transition-colors focus:border-terracotta ${
              errors.phone ? 'border-red-600' : 'border-charcoal-800/25'
            }`}
          />
          {errors.phone && (
            <p id={`${formId}-phone-error`} role="alert" className="mt-1.5 text-xs text-red-700">
              {errors.phone}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor={`${formId}-type`}
            className="block text-xs uppercase tracking-wideEditorial text-charcoal-700"
          >
            Enquiry type <span className="text-terracotta">*</span>
          </label>
          <select
            id={`${formId}-type`}
            name="type"
            value={values.type}
            onChange={(e) => handleChange('type', e.target.value as EnquiryType)}
            className="mt-2 w-full border-b border-charcoal-800/25 bg-transparent py-3 text-base text-charcoal-900 outline-none transition-colors focus:border-terracotta"
          >
            <option value="viewing">Arrange a private viewing</option>
            <option value="general">General advisory enquiry</option>
            <option value="private_acquisition">Private acquisition dossier</option>
            <option value="consignment">Property consignment</option>
          </select>
        </div>
      </div>

      {/* Preferred Viewing Date (shown prominently when viewing selected or always as optional) */}
      {(values.type === 'viewing' || values.preferredDate) && (
        <div className="animate-in fade-in duration-300">
          <label
            htmlFor={`${formId}-preferredDate`}
            className="flex items-center gap-2 text-xs uppercase tracking-wideEditorial text-charcoal-700"
          >
            <Calendar className="h-3.5 w-3.5 text-terracotta" />
            Preferred viewing date <span className="text-charcoal-400 font-normal">(optional)</span>
          </label>
          <input
            id={`${formId}-preferredDate`}
            name="preferredDate"
            type="date"
            min={todayStr}
            value={values.preferredDate}
            onChange={(e) => handleChange('preferredDate', e.target.value)}
            onBlur={() => handleBlur('preferredDate')}
            aria-invalid={Boolean(errors.preferredDate)}
            aria-describedby={errors.preferredDate ? `${formId}-preferredDate-error` : undefined}
            className={`mt-2 w-full border-b bg-transparent py-3 text-base text-charcoal-900 outline-none transition-colors focus:border-terracotta ${
              errors.preferredDate ? 'border-red-600' : 'border-charcoal-800/25'
            }`}
          />
          {errors.preferredDate && (
            <p id={`${formId}-preferredDate-error`} role="alert" className="mt-1.5 text-xs text-red-700">
              {errors.preferredDate}
            </p>
          )}
        </div>
      )}

      {/* Message Textarea */}
      <div>
        <div className="flex items-center justify-between">
          <label
            htmlFor={`${formId}-message`}
            className="block text-xs uppercase tracking-wideEditorial text-charcoal-700"
          >
            Message <span className="text-terracotta">*</span>
          </label>
          <span className="font-mono text-[10px] text-charcoal-400">
            {values.message.length} / 2,000
          </span>
        </div>
        <textarea
          id={`${formId}-message`}
          name="message"
          required
          rows={4}
          minLength={10}
          maxLength={2000}
          placeholder="Please share your timeline, architectural preferences, or specific questions..."
          value={values.message}
          onChange={(e) => handleChange('message', e.target.value)}
          onBlur={() => handleBlur('message')}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? `${formId}-message-error` : undefined}
          className={`mt-2 w-full resize-none border-b bg-transparent py-3 text-base text-charcoal-900 placeholder:text-charcoal-400/60 outline-none transition-colors focus:border-terracotta ${
            errors.message ? 'border-red-600' : 'border-charcoal-800/25'
          }`}
        />
        {errors.message && (
          <p id={`${formId}-message-error`} role="alert" className="mt-1.5 text-xs text-red-700">
            {errors.message}
          </p>
        )}
      </div>

      {/* Privacy note */}
      <p className="text-xs leading-5 text-charcoal-500">
        Discretion assured. We protect your privacy with exacting confidentiality and never disclose your enquiry details to third parties.
      </p>

      {/* General Error Banner */}
      {errors.general && (
        <div
          role="alert"
          className="flex items-start gap-3 border border-red-200 bg-red-50/80 p-4 text-xs text-red-800"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-600" />
          <p className="leading-relaxed">{errors.general}</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="group inline-flex items-center justify-center gap-3 bg-charcoal-800 px-8 py-3.5 text-xs uppercase tracking-wideEditorial text-limestone-100 hover:bg-terracotta transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-limestone-100" />
              <span>Transmitting enquiry…</span>
            </>
          ) : (
            <>
              <span>Send enquiry</span>
              <Send className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
