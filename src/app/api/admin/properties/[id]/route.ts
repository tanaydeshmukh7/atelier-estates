import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAuthorizedUser, getStorageAdminClient } from '@/lib/admin-auth';
import { isValidUuid, validatePropertyInput } from '@/lib/admin-property';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const authorized = await getAuthorizedUser(request);
  if (!authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isValidUuid(params.id)) return NextResponse.json({ error: 'Invalid property id.' }, { status: 400 });

  const { data: property, error } = await authorized.client
    .from('properties')
    .select('*, property_images(*)')
    .eq('id', params.id)
    .maybeSingle();

  if (error || !property) {
    return NextResponse.json({ error: 'Property not found.' }, { status: 404 });
  }

  return NextResponse.json({ property });
}

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

  const { data: property, error: propertyError } = await authorized.client
    .from('properties')
    .select('slug')
    .eq('id', params.id)
    .maybeSingle();
  if (propertyError) return NextResponse.json({ error: 'Unable to find property.' }, { status: 500 });
  if (!property) return NextResponse.json({ error: 'Property not found.' }, { status: 404 });

  const { data: images, error: imageQueryError } = await authorized.client
    .from('property_images')
    .select('storage_path')
    .eq('property_id', params.id);
  if (imageQueryError) return NextResponse.json({ error: 'Unable to prepare property deletion.' }, { status: 500 });

  const paths = Array.from(new Set(
    (images ?? [])
      .map((image) => image.storage_path)
      .filter((path): path is string => Boolean(path)),
  ));
  let cleanupPaths = paths;
  if (paths.length) {
    const { data: references, error: referenceError } = await authorized.client
      .from('property_images')
      .select('storage_path, property_id')
      .in('storage_path', paths);
    if (referenceError) return NextResponse.json({ error: 'Unable to verify property image ownership.' }, { status: 500 });
    const sharedPaths = new Set(
      (references ?? [])
        .filter((image) => image.property_id !== params.id)
        .map((image) => image.storage_path)
        .filter((path): path is string => Boolean(path)),
    );
    cleanupPaths = paths.filter((path) => !sharedPaths.has(path));
  }

  const { error } = await authorized.client.from('properties').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: 'Unable to delete property.' }, { status: 500 });

  let cleanupWarning: string | undefined;
  if (cleanupPaths.length) {
    const storage = getStorageAdminClient();
    if (!storage) {
      cleanupWarning = 'Property deleted, but its private image cleanup could not be completed.';
      console.error('[properties] storage cleanup unavailable', { propertyId: params.id });
    } else {
      const { error: storageError } = await storage.storage.from('property-images').remove(cleanupPaths);
      if (storageError) {
        cleanupWarning = 'Property deleted, but some image files could not be cleaned up.';
        console.error('[properties] storage cleanup failed', { propertyId: params.id, pathCount: cleanupPaths.length });
      }
    }
  }

  revalidatePath('/properties');
  revalidatePath(`/properties/${property.slug}`);
  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/admin/properties');
  revalidatePath('/admin/analytics');
  revalidatePath('/admin/enquiries');
  return NextResponse.json({ success: true, warning: cleanupWarning });
}
