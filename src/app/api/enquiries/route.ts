import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase-admin';
import type { EnquiryType } from '@/types/enquiry';
import { getVisitorContextFromCookieHeader, isVisitorId } from '@/lib/visitor';
import { demoProperties } from '@/data/properties';
import { dispatchEnquiryEmailNotification } from '@/lib/email';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const recentRequests = new Map<string, number>();

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    console.error('[enquiries] stage=parse status=400 message=invalid_json');
    return NextResponse.json({ message: 'Please send a valid enquiry.' }, { status: 400 });
  }

  // 1. Spam protection: Honeypot check
  if (body.website) {
    console.warn('[enquiries] stage=spam-check status=400 reason=honeypot');
    return NextResponse.json({ message: 'Your enquiry could not be submitted.' }, { status: 400 });
  }

  // 2. Normalize and sanitize fields
  const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  // Support both 'message' and legacy 'notes'
  const rawMessage = typeof body.message === 'string' ? body.message : (typeof body.notes === 'string' ? body.notes : '');
  const messageContent = rawMessage.trim();
  const type = (typeof body.type === 'string' ? body.type : 'general') as EnquiryType;

  // Preferred viewing date (optional)
  const rawDate = typeof body.preferredDate === 'string' ? body.preferredDate.trim() : '';
  const preferredDate = rawDate && datePattern.test(rawDate) ? rawDate : null;
  const preferredTime = typeof body.preferredTime === 'string' && body.preferredTime.trim() !== '' ? body.preferredTime.trim().slice(0, 50) : null;

  // Raw property identifier from client
  const propertyId = typeof body.propertyId === 'string' && body.propertyId.trim() !== '' ? body.propertyId.trim() : null;

  // Visitor analytics context
  const cookieContext = getVisitorContextFromCookieHeader(request.headers.get('cookie'));
  const visitorId = isVisitorId(body.visitorId) && (!cookieContext.visitorId || body.visitorId === cookieContext.visitorId) ? body.visitorId : null;
  const sessionId = isVisitorId(body.sessionId) && (!cookieContext.sessionId || body.sessionId === cookieContext.sessionId) ? body.sessionId : null;

  // 3. Validation checks
  const phoneIsValid = phone === '' || (phone.length >= 5 && phone.length <= 40 && /^[\d\s+\-().]+$/.test(phone));
  const validTypes: EnquiryType[] = ['viewing', 'general', 'private_acquisition', 'consignment'];
  const typeIsValid = validTypes.includes(type);

  if (fullName.length < 2 || fullName.length > 100) {
    return NextResponse.json({ message: 'Please enter a valid full name between 2 and 100 characters.' }, { status: 400 });
  }

  if (email.length > 160 || !emailPattern.test(email)) {
    return NextResponse.json({ message: 'Please provide a valid email address.' }, { status: 400 });
  }

  if (!phoneIsValid) {
    return NextResponse.json({ message: 'Please provide a valid phone number (5 to 40 characters) or leave it blank.' }, { status: 400 });
  }

  if (messageContent.length < 10 || messageContent.length > 2000) {
    return NextResponse.json({ message: 'Please enter a message between 10 and 2,000 characters.' }, { status: 400 });
  }

  if (!typeIsValid) {
    return NextResponse.json({ message: 'Please select a valid enquiry type.' }, { status: 400 });
  }

  if (preferredDate) {
    const parsedDate = new Date(`${preferredDate}T00:00:00Z`);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({ message: 'The preferred viewing date is invalid.' }, { status: 400 });
    }
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    if (parsedDate < today) {
      return NextResponse.json({ message: 'The preferred viewing date cannot be in the past.' }, { status: 400 });
    }
  }

  // 4. Rate limiting check (60 second per email cooldown)
  const now = Date.now();
  const previous = recentRequests.get(email);
  if (previous && now - previous < 60_000) {
    console.warn(`[enquiries] stage=rate-limit status=429 email_domain=${email.split('@')[1]}`);
    return NextResponse.json({ message: 'Please wait a moment before sending another enquiry.' }, { status: 429 });
  }

  // 5. Connect to Supabase
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    console.error('[enquiries] stage=config status=503 reason=missing_server_supabase_credentials');
    return NextResponse.json(
      { message: 'Enquiries are not configured. Add the server Supabase credentials and restart the app.' },
      { status: 503 },
    );
  }

  // 6. Security & Integrity: Validate referenced property existence and resolve authoritative title
  let verifiedPropertyId: string | null = null;
  let verifiedPropertyTitle: string | null = null;

  if (propertyId) {
    const isUuid = uuidPattern.test(propertyId);
    if (isUuid) {
      const { data: propertyRecord, error: propertyLookupError } = await supabase
        .from('properties')
        .select('id, title, status, published_at')
        .eq('id', propertyId)
        .maybeSingle();

      if (propertyLookupError) {
        console.error('[enquiries] stage=property-lookup error=', propertyLookupError);
      }

      if (propertyRecord) {
        verifiedPropertyId = propertyRecord.id;
        // Do not trust client-supplied property title; use authoritative DB title:
        verifiedPropertyTitle = propertyRecord.title;
      }
    }

    // Check demo properties fallback if not found in database (e.g. demo mode / slug passed)
    if (!verifiedPropertyTitle) {
      const demoMatch = demoProperties.find((p) => p.id === propertyId || p.slug === propertyId);
      if (demoMatch) {
        // If it's a demo property, only pass foreign key if it's a valid DB UUID
        verifiedPropertyId = isUuid ? propertyId : null;
        verifiedPropertyTitle = demoMatch.title;
      }
    }

    // If property was requested but cannot be found anywhere, reject the request
    if (!verifiedPropertyTitle) {
      console.warn(`[enquiries] stage=property-validation status=400 property_id=${propertyId} not_found`);
      return NextResponse.json({ message: 'The referenced property could not be found or is no longer listed.' }, { status: 400 });
    }
  }

  const referenceId = `ATE-${now.toString(36).toUpperCase()}`;

  // 7. Insert enquiry record into database
  const insertPayload = {
    reference_id: referenceId,
    property_id: verifiedPropertyId,
    property_title: verifiedPropertyTitle,
    full_name: fullName,
    email,
    phone: phone || null,
    preferred_date: preferredDate,
    preferred_time: preferredTime,
    notes: messageContent,
    type,
    status: 'pending',
    visitor_id: visitorId,
    session_id: sessionId,
  };

  const { error: insertError } = await supabase.from('enquiries').insert(insertPayload);

  if (insertError) {
    console.error(`[enquiries] stage=supabase-insert status=502 code=${insertError.code ?? 'unknown'} message=${insertError.message ?? 'unknown'}`);
    return NextResponse.json({ message: 'We could not save your enquiry. Please try again.' }, { status: 502 });
  }

  // Update rate limiter timestamp
  recentRequests.set(email, now);
  console.info(`[enquiries] stage=complete status=200 reference=${referenceId} property=${verifiedPropertyTitle ?? 'none'}`);

  // 8. Transactional email notification (if configured)
  // Email failures are caught and logged separately; they must never fail a saved enquiry.
  dispatchEnquiryEmailNotification({
    referenceId,
    fullName,
    email,
    phone,
    enquiryType: type,
    propertyTitle: verifiedPropertyTitle,
    preferredDate,
    preferredTime,
    message: messageContent,
  }).catch((emailErr) => {
    console.error('[enquiries] background email notification error:', emailErr);
  });

  return NextResponse.json({
    success: true,
    referenceId,
    message: 'Your enquiry has been received. Our advisory desk will be in touch within 24 hours.',
    propertyTitle: verifiedPropertyTitle,
  });
}
