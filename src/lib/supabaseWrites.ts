// ============================================================
// lib/supabaseWrites.ts — Clothza v4.0
// Best-effort persistence for user-generated rows. Every helper
// no-ops unless the user is a real Supabase account and the ids
// are UUIDs from the database, so demo/seed data keeps working.
// ============================================================

import supabase, { isSupabaseConfigured } from '@/lib/supabase';
import type { Order, Review } from '@/context/MarketplaceContext';

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
