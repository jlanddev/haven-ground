import { supabaseCms as supabase } from './supabase-cms';

// Admin data layer for the listings backend. All writes are authorized by the
// logged-in admin session (RLS enforces jordan@havenground.com only).

// Every listing, including unpublished drafts, ordered for the admin list.
export async function getAdminProperties() {
  const { data, error } = await supabase
    .from('properties')
    .select('id, slug, title, status, featured, published, sort_order, data, updated_at')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getAdminProperty(id) {
  const { data, error } = await supabase
    .from('properties')
    .select('id, slug, title, status, featured, published, sort_order, data')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Insert or update. `row` = { id?, slug, title, status, featured, published,
// sort_order, data }. Keeps the key columns in sync with the jsonb so the
// public read (which returns data) always matches.
export async function saveProperty(row) {
  const data = { ...(row.data || {}) };
  // Sync the fields the public UI reads out of `data`.
  data.slug = row.slug;
  data.title = row.title;
  data.status = row.status;
  data.featured = !!row.featured;

  const payload = {
    slug: row.slug,
    title: row.title,
    status: row.status,
    featured: !!row.featured,
    published: row.published !== false,
    sort_order: Number.isFinite(row.sort_order) ? row.sort_order : 0,
    data,
  };

  if (row.id) {
    const { data: saved, error } = await supabase
      .from('properties').update(payload).eq('id', row.id).select().maybeSingle();
    if (error) throw error;
    return saved;
  }
  const { data: saved, error } = await supabase
    .from('properties').insert(payload).select().maybeSingle();
  if (error) throw error;
  return saved;
}

export async function deleteProperty(id) {
  const { error } = await supabase.from('properties').delete().eq('id', id);
  if (error) throw error;
}

// Compress an image in the browser (resize to max 2000px, encode WebP q0.82)
// BEFORE upload, so the site never ends up with the multi-MB files that caused
// the earlier gallery lag. Returns a Blob.
async function compressImage(file) {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;
  try {
    const bitmap = await createImageBitmap(file);
    const maxDim = 2000;
    let { width, height } = bitmap;
    if (width > maxDim || height > maxDim) {
      const scale = maxDim / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/webp', 0.82));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

// Upload one photo to the property-photos bucket, return its public URL.
export async function uploadPhoto(file, slug) {
  const blob = await compressImage(file);
  const ext = blob.type === 'image/webp' ? 'webp' : (file.name.split('.').pop() || 'jpg');
  const rand = Math.random().toString(36).slice(2, 8);
  const path = `${slug || 'listing'}/${Date.now()}-${rand}.${ext}`;
  const { error } = await supabase.storage.from('property-photos').upload(path, blob, {
    contentType: blob.type || file.type, upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from('property-photos').getPublicUrl(path);
  return data.publicUrl;
}

// A blank listing template (matches the shape the public pages expect).
export function blankProperty() {
  return {
    slug: '', title: '', status: 'Available', featured: false, published: true, sort_order: 999,
    data: {
      title: '', slug: '', location: '', description: '', images: [], features: [],
      communityHighlights: [], lots: '', homeTypes: '', priceRange: '', price: null,
      pricePerAcre: null, acres: '', availableLots: null, type: 'single', template: 'rural',
      featured: false, status: 'Available', targetBuyer: '',
      listingAgent: { name: '', phone: '', brokerage: '' },
      lotTable: [],
      propertyDetails: { location: { parcelId: '', county: '', coordinates: { lat: null, lng: null }, address: '' }, features: { access: '', power: '', water: '', sewer: '', topography: '' } },
    },
  };
}
