// ============================================================
// lib/supabaseSubscriptions.ts — Clothza v5.0
// Seller plans: apply, read, cancel. Activation is admin-only
// and happens in Postgres (activate_seller_subscription).
// ============================================================

import supabase, { isSupabaseConfigured } from '@/lib/supabase';

export type SellerPlan   = 'monthly' | 'yearly';
export type SellerStatus = 'pending' | 'active' | 'expired' | 'cancelled';
export type SellerTier   = 'bronze' | 'silver' | 'gold';

export interface SellerSubscription {
  id:        string;
  plan:      SellerPlan;
  tier:      SellerTier;
  status:    SellerStatus;
  amount:    number;
  startedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

type Row = Record<string, unknown>;

const mapSub = (r: Row): SellerSubscription => ({
  id:        String(r['id']),
  plan:      (r['plan'] as SellerPlan) ?? 'monthly',
  tier:      (r['tier'] as SellerTier) ?? 'bronze',
  status:    (r['status'] as SellerStatus) ?? 'pending',
  amount:    Number(r['amount'] ?? 0),
  startedAt: (r['started_at'] as string) ?? undefined,
  expiresAt: (r['expires_at'] as string) ?? undefined,
  createdAt: String(r['created_at'] ?? new Date().toISOString()),
});

/** The signed-in user's most recent subscription, if any. */
export async function fetchMySubscription(): Promise<SellerSubscription | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from('seller_subscriptions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) return null;
  return mapSub(data[0] as Row);
}

export async function applyForSubscription(
  plan: SellerPlan,
  tier: SellerTier,
  method?: string
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { ok: false, error: 'Supabase is not configured' };

  const { error } = await supabase.rpc('apply_for_seller_subscription', {
    p_plan:   plan,
    p_tier:   tier,
    p_method: method ?? null,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function cancelSubscription(id: string): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { ok: false, error: 'Supabase is not configured' };

  const { error } = await supabase.rpc('cancel_seller_subscription', { p_id: id });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Admin only — grants the seller role and sets the expiry. */
export async function activateSubscription(id: string): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { ok: false, error: 'Supabase is not configured' };

  const { error } = await supabase.rpc('activate_seller_subscription', { p_id: id });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ── Plan catalogue ──────────────────────────────────────────

export interface PlanDef {
  id:       SellerPlan;
  tier:     SellerTier;
  name:     string;
  price:    number;      // NPR
  period:   string;
  blurb:    string;
  perks:    string[];
  featured?: boolean;
}

export const SELLER_PLANS: PlanDef[] = [
  {
    id: 'monthly', tier: 'silver', name: 'Monthly', price: 1500, period: 'per month',
    blurb: 'For a shop testing the market.',
    perks: ['Up to 200 products', 'Storefront analytics', 'Customer messages', 'Cancel anytime'],
  },
  {
    id: 'yearly', tier: 'gold', name: 'Yearly', price: 15000, period: 'per year',
    blurb: 'Two months free, priority placement.',
    perks: ['Unlimited products', 'Analytics + priority placement', 'Customer messages', 'Featured in Spotlight'],
    featured: true,
  },
];
