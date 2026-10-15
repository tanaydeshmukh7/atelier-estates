import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAuthorizedUser, getStorageAdminClient } from '@/lib/admin-auth';
import { isValidUuid, validatePropertyInput } from '@/lib/admin-property';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const authorized = await getAuthorizedUser(request);
  if (!authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isValidUuid(params.id)) return NextResponse.json({ error: 'Invalid property id.' }, { status: 400 });
  try {
    const body = await request.json();
    const input = validatePropertyInput(body);
    const { data: existing, error: existingError } = await authorized.client
      .from('properties')
      .select('published_at, slug')
      .eq('id', params.id)
      .single();
    if (existingError || !existing) return NextResponse.json({ error: 'Property not found.' }, { status: 404 });

    const isDraft = body.status === 'draft';
    const update = {
      ...input,
      status: isDraft ? 'available' : input.status,
      published_at: isDraft ? null : existing.published_at ?? new Date().toISOString(),
    };
    const { data, error } = await authorized.client.from('properties').update(update).eq('id', params.id).select('*').single();
    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'That slug is already in use.' }, { status: 409 });
      return NextResponse.json({ error: 'Unable to update property.' }, { status: 500 });
    }
    revalidatePath('/properties');
    revalidatePath(`/properties/${existing.slug}`);
    revalidatePath(`/properties/${data.slug}`);
    return NextResponse.json({ property: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid property data.' }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const authorized = await getAuthorizedUser(request);
  if (!authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isValidUuid(params.id)) return NextResponse.json({ error: 'Invalid property id.' }, { status: 400 });
  const { data: images } = await authorized.client.from('property_images').select('storage_path').eq('property_id', params.id);
  const storage = getStorageAdminClient();
  if (storage && images?.length) {
    const paths = images.map((image) => image.storage_path).filter((path): path is string => Boolean(path));
    if (paths.length) await storage.storage.from('property-images').remove(paths);
  }
  const { error } = await authorized.client.from('properties').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: 'Unable to delete property.' }, { status: 500 });
  revalidatePath('/properties');
  return NextResponse.json({ success: true });
}
