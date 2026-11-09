// ============================================================
// lib/supabaseStorage.ts — Clothza v4.0
// Uploads images to the public "clothza-media" bucket.
// Returns the public URL, ready to store in products/stores.
// ============================================================

import supabase, { isSupabaseConfigured } from '@/lib/supabase';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface UploadResult {
  ok: boolean;
  url?: string;
  error?: string;
}

const slug = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

/**
 * Uploads an image and returns its public URL.
 * Only signed-in Supabase users can upload; anon callers get an error.
 */
export async function uploadImage(
  file: File,
  folder: string
): Promise<UploadResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, error: 'Supabase is not configured' };
  }

  if (!file.type.startsWith('image/')) {
    return { ok: false, error: 'That file is not an image.' };
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: 'Image is larger than 5 MB.' };
  }

  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId) {
    return { ok: false, error: 'Sign in before uploading images.' };
  }

  const path = `${folder}/${userId}/${Date.now()}-${slug(file.name)}`;

  const { error } = await supabase.storage
    .from('clothza-media')
    .upload(path, file, { cacheControl: '31536000', upsert: false });

  if (error) return { ok: false, error: error.message };

  const { data } = supabase.storage.from('clothza-media').getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}
