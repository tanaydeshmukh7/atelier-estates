import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAuthorizedUser } from '@/lib/admin-auth';
import { validatePropertyInput } from '@/lib/admin-property';

export async function GET(request: Request) {
  const authorized = await getAuthorizedUser(request);
  if (!authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await authorized.client.from('properties').select('*').order('updated_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'Unable to load properties.' }, { status: 500 });
  const properties = data ?? [];
  const ids = properties.map((property) => property.id);
  const [{ data: visits }, { data: enquiries }] = await Promise.all([
    ids.length ? authorized.client.from('property_visits').select('property_id, visitor_id').in('property_id', ids) : Promise.resolve({ data: [] }),
    ids.length ? authorized.client.from('enquiries').select('property_id').in('property_id', ids) : Promise.resolve({ data: [] }),
  ]);
  const metrics = new Map<string, { views: number; uniqueVisitors: number; enquiries: number }>();
  for (const property of properties) metrics.set(property.id, { views: 0, uniqueVisitors: 0, enquiries: 0 });
  const visitors = new Map<string, Set<string>>();
  for (const visit of visits ?? []) {
    const current = metrics.get(visit.property_id);
    if (current) {
      current.views += 1;
      const set = visitors.get(visit.property_id) ?? new Set<string>();
      set.add(visit.visitor_id);
      visitors.set(visit.property_id, set);
      current.uniqueVisitors = set.size;
    }
  }
  for (const enquiry of enquiries ?? []) {
    const current = metrics.get(enquiry.property_id);
    if (current) current.enquiries += 1;
  }
  return NextResponse.json({ properties: properties.map((property) => ({ ...property, metrics: metrics.get(property.id) })) });
}

export async function POST(request: Request) {
  const authorized = await getAuthorizedUser(request);
  if (!authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const input = validatePropertyInput(await request.json());
    const { data, error } = await authorized.client.from('properties').insert(input).select('*').single();
    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'That slug is already in use.' }, { status: 409 });
      return NextResponse.json({ error: 'Unable to create property.' }, { status: 500 });
    }
    revalidatePath('/properties');
    revalidatePath(`/properties/${data.slug}`);
    return NextResponse.json({ property: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid property data.' }, { status: 400 });
  }
}
