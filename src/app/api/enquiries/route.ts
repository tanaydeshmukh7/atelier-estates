import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase-admin';
import type { EnquiryType } from '@/types/enquiry';
import { getVisitorContextFromCookieHeader, isVisitorId } from '@/lib/visitor';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const recentRequests = new Map<string, number>();

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    console.error('[enquiries] stage=parse status=400 message=invalid_json');
    return NextResponse.json({ message: 'Please send a valid enquiry.' }, { status: 400 });
  }
  if (body.website) {
    console.warn('[enquiries] stage=spam-check status=400 reason=honeypot');
    return NextResponse.json({ message: 'Your enquiry could not be submitted.' }, { status: 400 });
  }
  const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const notes = typeof body.notes === 'string' ? body.notes.trim() : '';
  const type = body.type as EnquiryType;
  const propertyId = typeof body.propertyId === 'string' && body.propertyId.trim() !== '' ? body.propertyId.trim() : null;
  const cookieContext = getVisitorContextFromCookieHeader(request.headers.get('cookie'));
  const visitorId = isVisitorId(body.visitorId) && (!cookieContext.visitorId || body.visitorId === cookieContext.visitorId) ? body.visitorId : null;
  const sessionId = isVisitorId(body.sessionId) && (!cookieContext.sessionId || body.sessionId === cookieContext.sessionId) ? body.sessionId : null;
  const phoneIsValid = phone === '' || (phone.length >= 5 && phone.length <= 40);
  if (fullName.length < 2 || fullName.length > 100 || !emailPattern.test(email) || email.length > 160 || !phoneIsValid || notes.length < 10 || notes.length > 2000 || !['viewing', 'general', 'private_acquisition', 'consignment'].includes(type) || (propertyId !== null && !uuidPattern.test(propertyId))) {
    console.warn(`[enquiries] stage=validation status=400 email_domain=${email.split('@')[1] ?? 'missing'} property_id_valid=${propertyId === null || uuidPattern.test(propertyId)}`);
    return NextResponse.json({ message: 'Please check the required fields and try again.' }, { status: 400 });
  }
  const now = Date.now();
  const previous = recentRequests.get(email);
  if (previous && now - previous < 60_000) {
    console.warn(`[enquiries] stage=rate-limit status=429 email_domain=${email.split('@')[1]}`);
    return NextResponse.json({ message: 'Please wait a moment before sending another enquiry.' }, { status: 429 });
  }
  const referenceId = `ATE-${now.toString(36).toUpperCase()}`;
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    console.error('[enquiries] stage=config status=503 reason=missing_server_supabase_credentials');
    return NextResponse.json(
      { message: 'Enquiries are not configured. Add the server Supabase credentials and restart the app.' },
      { status: 503 },
    );
  }
  const { error } = await supabase.from('enquiries').insert({
    reference_id: referenceId,
    property_id: propertyId,
    property_title: typeof body.propertyTitle === 'string' ? body.propertyTitle.slice(0, 200) : null,
    full_name: fullName,
    email,
    phone,
    notes,
    type,
    status: 'pending',
    visitor_id: visitorId,
    session_id: sessionId,
  });
  if (error) {
    console.error(`[enquiries] stage=supabase-insert status=502 code=${error.code ?? 'unknown'} message=${error.message ?? 'unknown'} details=${error.details ?? 'none'}`);
    return NextResponse.json({ message: 'We could not save your enquiry. Please try again.' }, { status: 502 });
  }
  recentRequests.set(email, now);
  console.info(`[enquiries] stage=complete status=200 reference=${referenceId}`);
  return NextResponse.json({ success: true, referenceId, message: 'Your enquiry has been received. Our advisory desk will be in touch within 24 hours.' });
}
