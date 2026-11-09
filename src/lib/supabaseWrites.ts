// ============================================================
// lib/supabaseWrites.ts — Clothza v4.0
// Best-effort persistence for user-generated rows. Every helper
// no-ops unless the user is a real Supabase account and the ids
// are UUIDs from the database, so demo/seed data keeps working.
// ============================================================

import supabase, { isSupabaseConfigured } from '@/lib/supabase';
import type { Order, Review, Product, Store } from '@/context/MarketplaceContext';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isUuid = (id?: string | null): id is string => Boolean(id && UUID_RE.test(id));

const canWrite = (userId?: string | null): userId is string =>
  isSupabaseConfigured && isUuid(userId);

const warn = (what: string, error: unknown) => {
  console.warn(`[supabase] ${what} failed`, error);
};

export async function persistFavoriteProduct(
  userId: string | undefined,
  productId: string,
  isFavorite: boolean
): Promise<void> {
  if (!canWrite(userId) || !isUuid(productId)) return;

  const { error } = isFavorite
    ? await supabase.from('favorite_products').insert({ user_id: userId, product_id: productId })
    : await supabase.from('favorite_products').delete().eq('user_id', userId).eq('product_id', productId);

  if (error && error.code !== '23505') warn('favorite product', error);
}

export async function persistFavoriteStore(
  userId: string | undefined,
  storeId: string,
  isFavorite: boolean
): Promise<void> {
  if (!canWrite(userId) || !isUuid(storeId)) return;

  const { error } = isFavorite
    ? await supabase.from('favorite_stores').insert({ user_id: userId, store_id: storeId })
    : await supabase.from('favorite_stores').delete().eq('user_id', userId).eq('store_id', storeId);

  if (error && error.code !== '23505') warn('favorite store', error);
}

export async function persistOrder(order: Order): Promise<void> {
  if (!canWrite(order.userId) || !isUuid(order.storeId)) return;

  const { error } = await supabase.from('orders').insert({
    id:               order.id,
    user_id:          order.userId,
    store_id:         order.storeId,
    items:            order.items,
    subtotal:         order.subtotal,
    discount_amount:  order.discountAmount,
    delivery_fee:     order.deliveryFee,
    total:            order.total,
    coupon_code:      order.couponCode ?? null,
    payment_method:   order.paymentMethod,
    payment_status:   order.paymentStatus,
    delivery_address: order.deliveryAddress,
    status:           order.status,
    tracking_id:      order.trackingId,
    created_at:       order.createdAt,
    updated_at:       order.updatedAt,
  });

  if (error) warn('order insert', error);
}

export async function persistReview(review: Review): Promise<void> {
  if (!canWrite(review.userId) || !isUuid(review.productId)) return;

  const { error } = await supabase.from('reviews').insert({
    id:         review.id,
    product_id: review.productId,
    user_id:    review.userId,
    user_name:  review.userName,
    rating:     review.rating,
    comment:    review.comment,
    created_at: review.createdAt,
  });

  if (error) warn('review insert', error);
}

// ── Seller: products ─────────────────────────────────────────

const productRow = (p: Omit<Product, 'id' | 'createdAt'> | Product) => ({
  name:             p.name,
  description:      p.description,
  price:            p.price,
  compare_at_price: p.compareAtPrice ?? null,
  category:         p.category,
  tags:             p.tags,
  images:           p.images,
  variants:         p.variants,
  is_best_seller:   p.isBestSeller,
  is_trending:      p.isTrending,
  is_sponsored:     p.isSponsored,
});

export async function persistProductInsert(
  userId: string | undefined,
  product: Product
): Promise<void> {
  if (!canWrite(userId) || !isUuid(product.storeId)) return;

  const { error } = await supabase.from('products').insert({
    id:       product.id,
    store_id: product.storeId,
    ...productRow(product),
    created_at: product.createdAt,
  });

  if (error) warn('product insert', error);
}

export async function persistProductUpdate(patch: Partial<Product> & { id: string }): Promise<void> {
  if (!isSupabaseConfigured || !isUuid(patch.id)) return;

  const row: Record<string, unknown> = {};
  if (patch.name !== undefined)           row['name'] = patch.name;
  if (patch.description !== undefined)    row['description'] = patch.description;
  if (patch.price !== undefined)          row['price'] = patch.price;
  if (patch.compareAtPrice !== undefined) row['compare_at_price'] = patch.compareAtPrice ?? null;
  if (patch.category !== undefined)       row['category'] = patch.category;
  if (patch.tags !== undefined)           row['tags'] = patch.tags;
  if (patch.images !== undefined)         row['images'] = patch.images;
  if (patch.variants !== undefined)       row['variants'] = patch.variants;
  if (patch.isBestSeller !== undefined)   row['is_best_seller'] = patch.isBestSeller;
  if (patch.isTrending !== undefined)     row['is_trending'] = patch.isTrending;

  if (Object.keys(row).length === 0) return;

  const { error } = await supabase.from('products').update(row).eq('id', patch.id);
  if (error) warn('product update', error);
}

export async function persistProductDelete(id: string): Promise<void> {
  if (!isSupabaseConfigured || !isUuid(id)) return;

  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) warn('product delete', error);
}

// ── Seller: store ────────────────────────────────────────────

export async function persistStoreUpdate(patch: Partial<Store> & { id: string }): Promise<void> {
  if (!isSupabaseConfigured || !isUuid(patch.id)) return;

  const row: Record<string, unknown> = {};
  if (patch.name !== undefined)        row['name'] = patch.name;
  if (patch.description !== undefined) row['description'] = patch.description;
  if (patch.logo !== undefined)        row['logo'] = patch.logo;
  if (patch.banner !== undefined)      row['banner'] = patch.banner;
  if (patch.location !== undefined)    row['location'] = patch.location;
  if (patch.instagram !== undefined)   row['instagram'] = patch.instagram;
  if (patch.whatsapp !== undefined)    row['whatsapp'] = patch.whatsapp;
  if (patch.theme !== undefined)       row['theme'] = patch.theme;

  if (Object.keys(row).length === 0) return;

  const { error } = await supabase.from('stores').update(row).eq('id', patch.id);
  if (error) warn('store update', error);
}

export async function persistStoreInsert(
  userId: string | undefined,
  store: Store
): Promise<void> {
  if (!canWrite(userId)) return;

  const { error } = await supabase.from('stores').insert({
    id:          isUuid(store.id) ? store.id : undefined,
    owner_id:    userId,
    name:        store.name,
    slug:        store.slug,
    description: store.description,
    logo:        store.logo,
    banner:      store.banner,
    location:    store.location,
    instagram:   store.instagram ?? null,
    whatsapp:    store.whatsapp ?? null,
    theme:       store.theme,
  });

  if (error) warn('store insert', error);
}
