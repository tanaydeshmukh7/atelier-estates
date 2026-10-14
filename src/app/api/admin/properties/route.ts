import { NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/admin-auth';
import { validatePropertyInput } from '@/lib/admin-property';

export async function GET(request: Request) {
  const authorized = await getAuthorizedUser(request);
  if (!authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await authorized.client.from('properties').select('*').order('updated_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'Unable to load properties.' }, { status: 500 });
  return NextResponse.json({ properties: data ?? [] });
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
    return NextResponse.json({ property: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid property data.' }, { status: 400 });
  }
}
