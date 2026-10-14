'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { ArrowLeft, ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';

interface FormImage { url: string; alt: string; isHero?: boolean; storagePath?: string; }
interface InitialProperty {
  id?: string;
  title?: string;
  slug?: string;
  description?: string;
  tagline?: string;
  location?: { city?: string; region?: string; country?: string; address?: string };
  price?: number;
  property_type?: string;
  status?: string;
  published_at?: string | null;
  is_featured?: boolean;
  specs?: { bedrooms?: number; bathrooms?: number; livingAreaSqFt?: number };
  images?: FormImage[];
}

export default function PropertyForm({ initial }: { initial?: InitialProperty }) {
  const router = useRouter();
  const [values, setValues] = useState({
    title: initial?.title ?? '',
    slug: initial?.slug ?? '',
    description: initial?.description ?? '',
    tagline: initial?.tagline ?? '',
    city: initial?.location?.city ?? '',
    region: initial?.location?.region ?? '',
    country: initial?.location?.country ?? '',
    address: initial?.location?.address ?? '',
    price: initial?.price?.toString() ?? '',
    propertyType: initial?.property_type ?? 'villa',
    bedrooms: initial?.specs?.bedrooms?.toString() ?? '3',
    bathrooms: initial?.specs?.bathrooms?.toString() ?? '2',
    areaSqFt: initial?.specs?.livingAreaSqFt?.toString() ?? '',
    status: initial?.published_at ? (initial.status ?? 'available') : 'draft',
    isFeatured: initial?.is_featured ?? false,
  });
  const [images, setImages] = useState<FormImage[]>(initial?.images ?? []);
  const [files, setFiles] = useState<File[]>([]);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  function setValue(name: string, value: string | boolean) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  function chooseFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024);
    setFiles((current) => [...current, ...selected]);
    event.target.value = '';
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setMessage('');
    setSaving(true);
    const supabase = getSupabaseClient();
    const { data: session } = await supabase?.auth.getSession() ?? { data: { session: null } };
    if (!session.session) {
      setMessage('Your session has expired. Please sign in again.');
      setSaving(false);
      return;
    }
    const payload = {
      title: values.title,
      slug: values.slug,
      description: values.description,
      tagline: values.tagline,
      location: { city: values.city, region: values.region, country: values.country, address: values.address },
      price: values.price,
      propertyType: values.propertyType,
      bedrooms: values.bedrooms,
      bathrooms: values.bathrooms,
      areaSqFt: values.areaSqFt,
      status: values.status,
      isFeatured: values.isFeatured,
      images,
    };
    const endpoint = initial?.id ? `/api/admin/properties/${initial.id}` : '/api/admin/properties';
    const response = await fetch(endpoint, {
      method: initial?.id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.session.access_token}` },
      body: JSON.stringify(payload),
    });
    const body = await response.json();
    if (!response.ok) {
      setMessage(body.error ?? 'Unable to save property.');
      setSaving(false);
      return;
    }
    const propertyId = initial?.id ?? body.property.id;
    let savedImages = [...images];
    for (const file of files) {
      const storagePath = `${session.session.user.id}/${propertyId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
      const { error: uploadError } = await supabase!.storage.from('property-images').upload(storagePath, file, { contentType: file.type, upsert: false });
      if (uploadError) {
        setMessage(`Property saved, but ${file.name} could not be uploaded.`);
        setSaving(false);
        return;
      }
      const { data: publicUrl } = supabase!.storage.from('property-images').getPublicUrl(storagePath);
      savedImages.push({ url: publicUrl.publicUrl, alt: values.title, storagePath });
    }
    const imageResponse = await fetch(`/api/admin/properties/${propertyId}/images`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.session.access_token}` },
      body: JSON.stringify({ images: savedImages }),
    });
    if (!imageResponse.ok) {
      setMessage('Property saved, but image metadata could not be saved.');
      setSaving(false);
      return;
    }
    router.push('/admin/properties');
    router.refresh();
  }

  function removeImage(index: number) {
    setImages((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  return <form onSubmit={save} className="max-w-4xl">
    <Link href="/admin/properties" className="inline-flex items-center gap-2 text-xs uppercase tracking-wideEditorial text-charcoal-500 hover:text-terracotta"><ArrowLeft className="h-4 w-4" /> Properties</Link>
    <div className="mt-8 flex flex-wrap items-end justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-widest text-terracotta">Property editor</p><h1 className="mt-3 font-serif text-6xl">{initial?.id ? 'Edit residence' : 'New residence'}</h1></div><button disabled={saving} className="inline-flex items-center gap-2 bg-charcoal-800 px-5 py-3 text-xs uppercase tracking-wideEditorial text-limestone-100 hover:bg-terracotta disabled:opacity-50">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{saving ? 'Saving…' : 'Save listing'}</button></div>
    {message && <p className="mt-8 border border-terracotta/30 bg-terracotta-soft px-4 py-3 text-sm">{message}</p>}
    <div className="mt-10 grid gap-8 border-t border-charcoal-800/15 pt-8 md:grid-cols-2">
      <Field label="Title" value={values.title} onChange={(value) => setValue('title', value)} required />
      <Field label="Unique slug" value={values.slug} onChange={(value) => setValue('slug', value)} required />
      <Field label="Price" type="number" value={values.price} onChange={(value) => setValue('price', value)} required />
      <label className="block text-xs uppercase tracking-wideEditorial">Property type<select value={values.propertyType} onChange={(event) => setValue('propertyType', event.target.value)} className="admin-input mt-2">{['villa', 'penthouse', 'estate', 'residence', 'pavilion'].map((item) => <option key={item}>{item}</option>)}</select></label>
      <Field label="City" value={values.city} onChange={(value) => setValue('city', value)} required /><Field label="Region" value={values.region} onChange={(value) => setValue('region', value)} />
      <Field label="Country" value={values.country} onChange={(value) => setValue('country', value)} required /><Field label="Address" value={values.address} onChange={(value) => setValue('address', value)} />
      <Field label="Bedrooms" type="number" value={values.bedrooms} onChange={(value) => setValue('bedrooms', value)} required /><Field label="Bathrooms" type="number" value={values.bathrooms} onChange={(value) => setValue('bathrooms', value)} required />
      <Field label="Area (sq ft)" type="number" value={values.areaSqFt} onChange={(value) => setValue('areaSqFt', value)} required /><Field label="Tagline" value={values.tagline} onChange={(value) => setValue('tagline', value)} />
      <label className="block text-xs uppercase tracking-wideEditorial">Publication status<select value={values.status} onChange={(event) => setValue('status', event.target.value)} className="admin-input mt-2"><option value="draft">Draft</option><option value="available">Published / available</option><option value="under_offer">Published / under offer</option><option value="private_treaty">Published / private treaty</option></select></label>
      <label className="flex items-center gap-3 pt-6 text-xs uppercase tracking-wideEditorial"><input type="checkbox" checked={values.isFeatured} onChange={(event) => setValue('isFeatured', event.target.checked)} className="h-4 w-4 accent-terracotta" /> Featured listing</label>
      <label className="block text-xs uppercase tracking-wideEditorial md:col-span-2">Description<textarea required minLength={20} value={values.description} onChange={(event) => setValue('description', event.target.value)} className="admin-input mt-2 min-h-36" /></label>
    </div>
    <div className="mt-10 border-t border-charcoal-800/15 pt-8"><div className="flex items-end justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-widest text-terracotta">Photography</p><h2 className="mt-2 font-serif text-3xl">Images</h2></div><label className="inline-flex cursor-pointer items-center gap-2 border border-charcoal-800/20 px-4 py-3 text-xs uppercase tracking-wideEditorial hover:border-terracotta"><ImagePlus className="h-4 w-4" /> Add images<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={chooseFiles} className="sr-only" /></label></div><p className="mt-3 text-xs text-charcoal-500">JPEG, PNG, or WebP up to 10 MB each. The first image is the cover.</p><div className="mt-6 grid gap-4 sm:grid-cols-3">{images.map((image, index) => <div key={`${image.url}-${index}`} className="relative aspect-[4/3] overflow-hidden bg-sandstone-tint"><img src={image.url} alt={image.alt} className="h-full w-full object-cover" /><button type="button" onClick={() => removeImage(index)} aria-label={`Remove image ${index + 1}`} className="absolute right-2 top-2 bg-charcoal-800 p-2 text-limestone-100 hover:bg-terracotta"><Trash2 className="h-4 w-4" /></button>{index === 0 && <span className="absolute bottom-2 left-2 bg-limestone-100 px-2 py-1 font-mono text-[9px] uppercase tracking-widest">Cover</span>}</div>)}{files.map((file, index) => <div key={`${file.name}-${index}`} className="flex aspect-[4/3] items-center justify-center bg-sandstone-tint p-4 text-center text-xs text-charcoal-600">{file.name}</div>)}</div></div>
  </form>;
}

function Field({ label, value, onChange, type = 'text', required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <label className="block text-xs uppercase tracking-wideEditorial">{label}<input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="admin-input mt-2" /></label>;
}
