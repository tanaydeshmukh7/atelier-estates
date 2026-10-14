import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase-admin';
import { getVisitorContextFromCookieHeader, isVisitorId } from '@/lib/visitor';

const propertyPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const recentVisits = new Map<string, number>();

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid visit payload.' }, { status: 400 });
  }
  const cookies = getVisitorContextFromCookieHeader(request.headers.get('cookie'));
  const propertyId = typeof body.propertyId === 'string' ? body.propertyId : '';
  const visitorId = isVisitorId(body.visitorId) && (!cookies.visitorId || body.visitorId === cookies.visitorId) ? body.visitorId : null;
  const sessionId = isVisitorId(body.sessionId) && (!cookies.sessionId || body.sessionId === cookies.sessionId) ? body.sessionId : null;
  if (!propertyPattern.test(propertyId) || !visitorId || !sessionId) return NextResponse.json({ error: 'Invalid visit payload.' }, { status: 400 });

  const key = `${propertyId}:${visitorId}:${sessionId}`;
  if (recentVisits.has(key)) return NextResponse.json({ recorded: false });
  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: 'Analytics are not configured.' }, { status: 503 });
  const { data: property } = await supabase.from('properties').select('id').eq('id', propertyId).not('published_at', 'is', null).maybeSingle();
  if (!property) return NextResponse.json({ error: 'Property not found.' }, { status: 404 });

  const referrer = typeof body.referrer === 'string' ? body.referrer.slice(0, 500) : null;
  const source = typeof body.source === 'string' ? body.source.slice(0, 100) : 'direct';
  const { error } = await supabase.from('property_visits').insert({
    property_id: propertyId,
    visitor_id: visitorId,
    session_id: sessionId,
    referrer,
    source,
  });
  if (error && error.code !== '23505') return NextResponse.json({ error: 'Unable to record visit.' }, { status: 500 });
  recentVisits.set(key, Date.now());
  if (recentVisits.size > 5000) recentVisits.delete(recentVisits.keys().next().value as string);
  return NextResponse.json({ recorded: !error });
}
