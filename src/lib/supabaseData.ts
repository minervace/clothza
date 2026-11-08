// ============================================================
// lib/supabaseData.ts — Clothza v4.0
// Reads the catalog from Supabase and maps snake_case rows onto
// the app's camelCase types. Returns null when Supabase is not
// configured or unreachable, so callers keep the seed data.
// ============================================================

import supabase, { isSupabaseConfigured } from '@/lib/supabase';
import type { Store, Product, Lookbook } from '@/context/MarketplaceContext';

type Row = Record<string, unknown>;

const num = (v: unknown, fallback = 0): number =>
  typeof v === 'number' ? v : v == null ? fallback : Number(v);

const str = (v: unknown, fallback = ''): string =>
  typeof v === 'string' ? v : fallback;

const mapStore = (r: Row): Store => ({
  id:                    str(r['id']),
  ownerId:               str(r['owner_id']),
  name:                  str(r['name']),
  slug:                  str(r['slug']),
  description:           str(r['description']),
  logo:                  str(r['logo']),
  banner:                str(r['banner']),
  location:              str(r['location']),
  instagram:             (r['instagram'] as string) ?? undefined,
  whatsapp:              (r['whatsapp'] as string) ?? undefined,
  theme:                 (r['theme'] as Store['theme']) ?? 'minimalist',
  isFeatured:            Boolean(r['is_featured']),
  isSponsored:           Boolean(r['is_sponsored']),
  views:                 num(r['views']),
  clicks:                num(r['clicks']),
  rating:                num(r['rating']),
  reviewCount:           num(r['review_count']),
  subscriptionTier:      (r['subscription_tier'] as Store['subscriptionTier']) ?? 'free',
  subscriptionExpiresAt: str(r['subscription_expires_at']),
  createdAt:             str(r['created_at'], new Date().toISOString()),
});

const mapProduct = (r: Row): Product => ({
  id:             str(r['id']),
  storeId:        str(r['store_id']),
  name:           str(r['name']),
  description:    str(r['description']),
  price:          num(r['price']),
  compareAtPrice: r['compare_at_price'] == null ? undefined : num(r['compare_at_price']),
  category:       (r['category'] as Product['category']) ?? 'Women',
  tags:           Array.isArray(r['tags']) ? (r['tags'] as string[]) : [],
  images:         Array.isArray(r['images']) ? (r['images'] as string[]) : [],
  variants:       Array.isArray(r['variants']) ? (r['variants'] as Product['variants']) : [],
  isBestSeller:   Boolean(r['is_best_seller']),
  isTrending:     Boolean(r['is_trending']),
  isSponsored:    Boolean(r['is_sponsored']),
  views:          num(r['views']),
  clicks:         num(r['clicks']),
  rating:         num(r['rating']),
  reviewCount:    num(r['review_count']),
  createdAt:      str(r['created_at'], new Date().toISOString()),
});

const mapLookbook = (r: Row): Lookbook => ({
  id:          str(r['id']),
  storeId:     str(r['store_id']),
  creatorName: str(r['creator_name']),
  name:        str(r['name']),
  description: str(r['description']),
  coverImage:  (r['cover_image'] as string) ?? undefined,
  items:       Array.isArray(r['items']) ? (r['items'] as Lookbook['items']) : [],
  isOfficial:  Boolean(r['is_official']),
  likes:       num(r['likes']),
  views:       num(r['views']),
  createdAt:   str(r['created_at'], new Date().toISOString()),
});

export interface Catalog {
  stores:    Store[];
  products:  Product[];
  lookbooks: Lookbook[];
}

/**
 * Fetches the public catalog. Returns null when Supabase is not
 * configured or any query fails, so the caller can keep seed data.
 */
export async function fetchCatalog(): Promise<Catalog | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const [stores, products, lookbooks] = await Promise.all([
      supabase.from('stores').select('*'),
      supabase.from('products').select('*'),
      supabase.from('lookbooks').select('*'),
    ]);

    if (stores.error || products.error || lookbooks.error) return null;

    return {
      stores:    ((stores.data ?? []) as Row[]).map(mapStore),
      products:  ((products.data ?? []) as Row[]).map(mapProduct),
      lookbooks: ((lookbooks.data ?? []) as Row[]).map(mapLookbook),
    };
  } catch {
    return null;
  }
}
