import { NextResponse } from 'next/server';
import { getAuthorizedUser, getStorageAdminClient } from '@/lib/admin-auth';
import { isValidUuid, normalizeImages } from '@/lib/admin-property';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const authorized = await getAuthorizedUser(request);
  if (!authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isValidUuid(params.id)) return NextResponse.json({ error: 'Invalid property id.' }, { status: 400 });
  const images = normalizeImages((await request.json()).images);
  const { data: previousImages } = await authorized.client.from('property_images').select('storage_path').eq('property_id', params.id);
  const nextPaths = new Set(images.map((image) => (image as PropertyImageWithPath).storagePath).filter(Boolean));
  const orphanedPaths = (previousImages ?? [])
    .map((image) => image.storage_path)
    .filter((path): path is string => Boolean(path) && !nextPaths.has(path));
  const storage = getStorageAdminClient();
  if (storage && orphanedPaths.length) await storage.storage.from('property-images').remove(orphanedPaths);
  const { error: deleteError } = await authorized.client.from('property_images').delete().eq('property_id', params.id);
  if (deleteError) return NextResponse.json({ error: 'Unable to replace image metadata.' }, { status: 500 });
  if (images.length) {
    const { error } = await authorized.client.from('property_images').insert(images.map((image, index) => ({
      property_id: params.id,
      image_url: image.url,
      alt_text: image.alt,
      display_order: index,
      storage_path: (image as PropertyImageWithPath).storagePath ?? null,
    })));
    if (error) return NextResponse.json({ error: 'Unable to save image metadata.' }, { status: 500 });
  }
  const { error: propertyError } = await authorized.client.from('properties').update({ images }).eq('id', params.id);
  if (propertyError) return NextResponse.json({ error: 'Unable to update property images.' }, { status: 500 });
  return NextResponse.json({ images });
}

interface PropertyImageWithPath {
  storagePath?: string;
}
