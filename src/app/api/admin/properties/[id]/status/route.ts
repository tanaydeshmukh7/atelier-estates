import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAuthorizedUser } from '@/lib/admin-auth';
import { isValidUuid } from '@/lib/admin-property';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const authorized = await getAuthorizedUser(request);
  if (!authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isValidUuid(params.id)) return NextResponse.json({ error: 'Invalid property id.' }, { status: 400 });
  const body = await request.json();
  const status = body.status;
  if (!['draft', 'available', 'under_offer', 'private_treaty'].includes(status)) {
    return NextResponse.json({ error: 'Invalid publication status.' }, { status: 400 });
  }
  const { data: existing, error: existingError } = await authorized.client
    .from('properties')
    .select('slug')
    .eq('id', params.id)
    .single();
  if (existingError || !existing) return NextResponse.json({ error: 'Property not found.' }, { status: 404 });
  const { data, error } = await authorized.client.from('properties').update({
    status: status === 'draft' ? 'available' : status,
    published_at: status === 'draft' ? null : new Date().toISOString(),
  }).eq('id', params.id).select('slug, published_at').single();
  if (error) return NextResponse.json({ error: 'Unable to change publication status.' }, { status: 500 });
  revalidatePath('/properties');
  revalidatePath(`/properties/${existing.slug}`);
  return NextResponse.json({ success: true, publishedAt: data.published_at });
}
