import { NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/admin-auth';

const statuses = ['pending', 'contacted', 'qualified', 'scheduled', 'closed', 'archived'];

export async function GET(request: Request) {
  const authorized = await getAuthorizedUser(request);
  if (!authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await authorized.client.from('enquiries').select('*, properties(title, slug)').order('created_at', { ascending: false }).limit(500);
  if (error) return NextResponse.json({ error: 'Unable to load enquiries.' }, { status: 500 });
  const enquiries = data ?? [];
  const visitorIds = enquiries.map((item) => item.visitor_id).filter(Boolean);
  const { data: visits } = visitorIds.length
    ? await authorized.client.from('property_visits').select('visitor_id, visited_at, properties(title, slug)').in('visitor_id', visitorIds).order('visited_at', { ascending: false }).limit(2000)
    : { data: [] };
  const browsing = new Map<string, { title: string; slug: string; visitedAt: string }[]>();
  for (const visit of visits ?? []) {
    const relation = Array.isArray(visit.properties) ? visit.properties[0] : visit.properties;
    if (!relation?.title || !visit.visitor_id) continue;
    const current = browsing.get(visit.visitor_id) ?? [];
    if (!current.some((item) => item.slug === relation.slug)) current.push({ title: relation.title, slug: relation.slug, visitedAt: visit.visited_at });
    browsing.set(visit.visitor_id, current.slice(0, 10));
  }
  return NextResponse.json({
    enquiries: enquiries.map((item) => ({
      ...item,
      browsing: item.visitor_id ? browsing.get(item.visitor_id) ?? [] : [],
      visitor_id: undefined,
      session_id: undefined,
    })),
  });
}

export async function PATCH(request: Request) {
  const authorized = await getAuthorizedUser(request);
  if (!authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  if (typeof body.id !== 'string' || !statuses.includes(body.status)) return NextResponse.json({ error: 'Invalid enquiry update.' }, { status: 400 });
  const { error } = await authorized.client.from('enquiries').update({ status: body.status }).eq('id', body.id);
  if (error) return NextResponse.json({ error: 'Unable to update enquiry.' }, { status: 500 });
  return NextResponse.json({ success: true });
}
