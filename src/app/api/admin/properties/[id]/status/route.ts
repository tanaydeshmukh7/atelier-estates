import { NextResponse } from 'next/server';
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
  const { error } = await authorized.client.from('properties').update({
    status: status === 'draft' ? 'available' : status,
    published_at: status === 'draft' ? null : new Date().toISOString(),
  }).eq('id', params.id);
  if (error) return NextResponse.json({ error: 'Unable to change publication status.' }, { status: 500 });
  return NextResponse.json({ success: true });
}
