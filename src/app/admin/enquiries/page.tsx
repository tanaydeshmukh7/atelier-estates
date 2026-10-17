'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Mail,
  Phone,
  Calendar,
  Building2,
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Loader2,
  Check,
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';
import {
  EnquiryRecord,
  EnquiryStatus,
  ENQUIRY_STATUS_LABELS,
  ENQUIRY_TYPE_LABELS,
} from '@/types/enquiry';

const STATUS_OPTIONS: EnquiryStatus[] = [
  'pending',
  'contacted',
  'scheduled',
  'qualified',
  'closed',
  'archived',
];

export default function EnquiriesPage() {
  const [items, setItems] = useState<EnquiryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadEnquiries() {
      setLoading(true);
      setError('');
      try {
        const supabase = getSupabaseClient();
        const { data: sessionData } = (await supabase?.auth.getSession()) ?? {
          data: { session: null },
        };

        const response = await fetch('/api/admin/enquiries', {
          headers: {
            Authorization: `Bearer ${sessionData.session?.access_token ?? ''}`,
          },
        });

        const body = await response.json();
        if (!active) return;

        if (!response.ok) {
          setError(body.error ?? 'Unable to load enquiries.');
        } else {
          setItems(body.enquiries ?? []);
        }
      } catch {
        if (active) setError('Network error while connecting to enquiry service.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadEnquiries();

    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const q = query.toLowerCase().trim();
      const searchable = `${item.full_name} ${item.email} ${item.phone ?? ''} ${
        item.property_title ?? ''
      } ${item.notes} ${item.reference_id}`.toLowerCase();

      if (q && !searchable.includes(q)) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;

      if (dateRange !== 'all') {
        const days = Number(dateRange);
        const limitMs = Date.now() - days * 86400000;
        if (new Date(item.created_at).getTime() < limitMs) return false;
      }

      return true;
    });
  }, [items, query, statusFilter, dateRange]);

  async function updateStatus(id: string, nextStatus: EnquiryStatus) {
    setUpdatingId(id);
    setError('');
    setFeedback(null);

    try {
      const supabase = getSupabaseClient();
      const { data: sessionData } = (await supabase?.auth.getSession()) ?? {
        data: { session: null },
      };

      const response = await fetch('/api/admin/enquiries', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionData.session?.access_token ?? ''}`,
        },
        body: JSON.stringify({ id, status: nextStatus }),
      });

      const body = await response.json();
      if (!response.ok) {
        setError(body.error ?? 'Unable to update enquiry status.');
      } else {
        setItems((current) =>
          current.map((item) => (item.id === id ? { ...item, status: nextStatus } : item))
        );
        setFeedback(`Enquiry status updated to ${ENQUIRY_STATUS_LABELS[nextStatus]}.`);
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch {
      setError('Network failure: status could not be saved.');
    } finally {
      setUpdatingId(null);
    }
  }

  function getStatusBadgeClass(status: EnquiryStatus) {
    switch (status) {
      case 'pending':
        return 'bg-terracotta text-limestone-100 border-terracotta';
      case 'contacted':
        return 'bg-charcoal-700 text-limestone-100 border-charcoal-700';
      case 'scheduled':
        return 'bg-terracotta-light text-white border-terracotta-light';
      case 'qualified':
        return 'bg-charcoal-900 text-terracotta-light border-charcoal-800';
      case 'closed':
      case 'archived':
      default:
        return 'bg-sandstone-tint text-charcoal-600 border-charcoal-800/20';
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-terracotta">
            04 / Advisory desk
          </p>
          <h1 className="mt-3 font-serif text-5xl md:text-6xl">Enquiries</h1>
          <p className="mt-3 text-sm text-charcoal-500">
            Private client dossiers and viewing requests submitted through the portal.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-charcoal-500">
            {filtered.length} of {items.length} enquiries
          </span>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div
          role="alert"
          className="mt-8 border border-red-300 bg-red-50/80 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      {feedback && (
        <div
          role="status"
          className="mt-8 flex items-center gap-2 border border-terracotta/40 bg-terracotta-soft px-4 py-3 text-sm text-charcoal-800 animate-in fade-in"
        >
          <Check className="h-4 w-4 text-terracotta" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="mt-10 grid gap-4 md:grid-cols-[1fr_180px_160px]">
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-charcoal-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, phone, reference, property..."
            className="admin-input pl-10"
            aria-label="Search enquiries"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="admin-input"
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {ENQUIRY_STATUS_LABELS[status]}
            </option>
          ))}
        </select>

        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="admin-input"
          aria-label="Filter by date range"
        >
          <option value="all">All dates</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-20 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-terracotta" />
          <p className="mt-4 font-mono text-xs uppercase tracking-widest text-charcoal-500">
            Loading advisory dossiers…
          </p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filtered.length === 0 && (
        <div className="mt-10 border border-dashed border-charcoal-800/20 py-20 text-center">
          <SlidersHorizontal className="mx-auto h-8 w-8 text-charcoal-400" />
          <p className="mt-4 font-serif text-2xl">
            {items.length === 0 ? 'No enquiries received yet' : 'No matching enquiries'}
          </p>
          <p className="mt-2 text-sm text-charcoal-500">
            {items.length === 0
              ? 'Enquiries submitted via property pages or the contact desk will appear here.'
              : 'Try clearing your search query or adjusting your status filter.'}
          </p>
        </div>
      )}

      {/* Enquiries List */}
      {!loading && filtered.length > 0 && (
        <div className="mt-10 space-y-5">
          {filtered.map((item) => {
            const isExpanded = expandedId === item.id;
            const isUpdating = updatingId === item.id;

            return (
              <article
                key={item.id}
                className="border border-charcoal-800/15 bg-sandstone-tint p-6 transition-all duration-200"
              >
                {/* Header Row: Customer Identity & Status Control */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-serif text-2xl text-charcoal-900">{item.full_name}</h2>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-charcoal-500">
                        {item.reference_id}
                      </span>
                    </div>

                    {/* Direct Contact Links */}
                    <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-charcoal-600">
                      <a
                        href={`mailto:${item.email}?subject=Atelier%20Estates%20Advisory%20%E2%80%94%20Ref%20${item.reference_id}`}
                        className="inline-flex items-center gap-1.5 text-charcoal-800 hover:text-terracotta transition-colors underline-offset-2 hover:underline"
                        title="Send email to client"
                      >
                        <Mail className="h-3.5 w-3.5 text-terracotta" />
                        <span>{item.email}</span>
                      </a>

                      {item.phone && (
                        <a
                          href={`tel:${item.phone.replace(/[^0-9+]/g, '')}`}
                          className="inline-flex items-center gap-1.5 text-charcoal-800 hover:text-terracotta transition-colors underline-offset-2 hover:underline"
                          title="Call client phone"
                        >
                          <Phone className="h-3.5 w-3.5 text-terracotta" />
                          <span>{item.phone}</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Status Dropdown with Live Badge */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider ${getStatusBadgeClass(
                        item.status
                      )}`}
                    >
                      {ENQUIRY_STATUS_LABELS[item.status] ?? item.status}
                    </span>

                    <select
                      value={item.status}
                      disabled={isUpdating}
                      onChange={(e) => updateStatus(item.id, e.target.value as EnquiryStatus)}
                      className="border border-charcoal-800/25 bg-limestone-100 px-3 py-1.5 text-xs font-mono uppercase tracking-wide text-charcoal-800 outline-none hover:border-terracotta focus:border-terracotta disabled:opacity-50"
                      aria-label={`Change status for enquiry from ${item.full_name}`}
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          Set: {ENQUIRY_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Property & Schedule Metadata Strip */}
                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-charcoal-800/10 pt-3 text-xs text-charcoal-600">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-terracotta" />
                    {item.property_id && item.properties?.slug ? (
                      <Link
                        href={`/properties/${item.properties.slug}`}
                        target="_blank"
                        className="font-medium text-charcoal-900 hover:text-terracotta hover:underline inline-flex items-center gap-1"
                      >
                        <span>{item.property_title ?? item.properties.title}</span>
                        <ExternalLink className="h-3 w-3 text-charcoal-400" />
                      </Link>
                    ) : item.property_title ? (
                      <span className="font-medium text-charcoal-900">
                        {item.property_title}
                      </span>
                    ) : (
                      <span className="text-charcoal-500 italic">General Advisory Enquiry</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <Clock className="h-3.5 w-3.5 text-charcoal-400" />
                    <span>{new Date(item.created_at).toLocaleString()}</span>
                  </div>

                  <span className="font-mono text-[10px] uppercase tracking-wider bg-charcoal-800/10 px-2 py-0.5 text-charcoal-700">
                    {ENQUIRY_TYPE_LABELS[item.type] ?? item.type}
                  </span>

                  {item.preferred_date && (
                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-terracotta">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        Viewing requested for: <strong>{item.preferred_date}</strong>
                        {item.preferred_time ? ` (${item.preferred_time})` : ''}
                      </span>
                    </div>
                  )}
                </div>

                {/* Message Body (with Expand / Collapse) */}
                <div className="mt-4">
                  <p
                    className={`text-sm leading-relaxed text-charcoal-800 whitespace-pre-wrap ${
                      !isExpanded && item.notes.length > 250 ? 'line-clamp-3' : ''
                    }`}
                  >
                    {item.notes}
                  </p>

                  {item.notes.length > 250 && (
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="mt-2 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-terracotta hover:underline"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-3 w-3" /> Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3 w-3" /> Read complete message
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Anonymous Browsing Activity Correlation */}
                {item.browsing && item.browsing.length > 0 && (
                  <div className="mt-4 border-t border-charcoal-800/10 pt-3">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-charcoal-500">
                      Residences viewed prior to enquiry
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      {item.browsing.map((visit) => (
                        <Link
                          key={visit.slug}
                          href={`/properties/${visit.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 border border-charcoal-800/15 bg-limestone-100/60 px-2.5 py-1 text-charcoal-800 hover:border-terracotta hover:text-terracotta transition-colors"
                        >
                          <span>{visit.title}</span>
                          <ExternalLink className="h-3 w-3 text-charcoal-400" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
