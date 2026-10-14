import { NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/admin-auth';

export async function GET(request: Request) {
  const authorized = await getAuthorizedUser(request);
  if (!authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const days = Math.min(Math.max(Number(new URL(request.url).searchParams.get('days') ?? 30), 1), 365);
  const propertyId = new URL(request.url).searchParams.get('propertyId');
  const since = new Date(Date.now() - days * 86400000).toISOString();
  let visitsQuery = authorized.client.from('property_visits')
    .select('id, property_id, visitor_id, session_id, visited_at, referrer, source, properties(title, slug)')
    .gte('visited_at', since)
    .order('visited_at', { ascending: false })
    .limit(5000);
  if (propertyId) visitsQuery = visitsQuery.eq('property_id', propertyId);
  const { data: visits, error } = await visitsQuery;
  if (error) return NextResponse.json({ error: 'Unable to load analytics.' }, { status: 500 });
  const rows = visits ?? [];
  const propertyMap = new Map<string, { propertyId: string; title: string; slug: string; views: number; visitors: Set<string> }>();
  const daily = new Map<string, number>();
  for (const visit of rows) {
    const relation = Array.isArray(visit.properties) ? visit.properties[0] : visit.properties;
    const current = propertyMap.get(visit.property_id) ?? { propertyId: visit.property_id, title: relation?.title ?? 'Unpublished property', slug: relation?.slug ?? '', views: 0, visitors: new Set<string>() };
    current.views += 1;
    current.visitors.add(visit.visitor_id);
    propertyMap.set(visit.property_id, current);
    const date = new Date(visit.visited_at).toISOString().slice(0, 10);
    daily.set(date, (daily.get(date) ?? 0) + 1);
  }
  return NextResponse.json({
    totalViews: rows.length,
    uniqueVisitors: new Set(rows.map((visit) => visit.visitor_id)).size,
    properties: Array.from(propertyMap.values()).map((item) => ({ propertyId: item.propertyId, title: item.title, slug: item.slug, views: item.views, uniqueVisitors: item.visitors.size })).sort((a, b) => b.views - a.views),
    daily: Array.from(daily.entries()).map(([date, views]) => ({ date, views })).sort((a, b) => a.date.localeCompare(b.date)),
    recent: rows.slice(0, 50).map((visit) => { const relation = Array.isArray(visit.properties) ? visit.properties[0] : visit.properties; return { id: visit.id, propertyId: visit.property_id, propertyTitle: relation?.title ?? 'Unpublished property', visitedAt: visit.visited_at, source: visit.source }; }),
  });
}
