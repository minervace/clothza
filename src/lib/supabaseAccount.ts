// ============================================================
// lib/supabaseAccount.ts — Clothza v5.0
// Saved addresses, phone, order stats and account deletion.
// All calls are scoped to the signed-in user by RLS.
// ============================================================

import supabase, { isSupabaseConfigured } from '@/lib/supabase';

export interface Address {
  id:        string;
  label:     string;
  fullName:  string;
  phone:     string;
  address:   string;
  city:      string;
  province:  string;
  isDefault: boolean;
  createdAt: string;
}

export interface OrderStats {
  orders: number;
  spent:  number;
  lastOrder?: string;
}

type Row = Record<string, unknown>;

const mapAddress = (r: Row): Address => ({
  id:        String(r['id']),
  label:     String(r['label'] ?? 'Home'),
  fullName:  String(r['full_name'] ?? ''),
  phone:     String(r['phone'] ?? ''),
  address:   String(r['address'] ?? ''),
  city:      String(r['city'] ?? ''),
  province:  String(r['province'] ?? ''),
  isDefault: Boolean(r['is_default']),
  createdAt: String(r['created_at'] ?? ''),
});

export async function fetchAddresses(): Promise<Address[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return (data as Row[]).map(mapAddress);
}

export async function saveAddress(input: Omit<Address, 'id' | 'createdAt'> & { id?: string }): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { ok: false, error: 'Supabase is not configured' };

  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return { ok: false, error: 'Sign in first' };

  const row = {
    user_id:    uid,
    label:      input.label || 'Home',
    full_name:  input.fullName,
    phone:      input.phone,
    address:    input.address,
    city:       input.city,
    province:   input.province,
    is_default: input.isDefault,
  };

  const { error } = input.id
    ? await supabase.from('addresses').update(row).eq('id', input.id)
    : await supabase.from('addresses').insert(row);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteAddress(id: string): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { ok: false, error: 'Supabase is not configured' };
  const { error } = await supabase.from('addresses').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function savePhone(phone: string): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { ok: false, error: 'Supabase is not configured' };
  const { error } = await supabase.rpc('set_my_phone', { p_phone: phone });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function fetchOrderStats(): Promise<OrderStats> {
  if (!isSupabaseConfigured) return { orders: 0, spent: 0 };
  const { data, error } = await supabase.rpc('my_order_stats');
  if (error || !data) return { orders: 0, spent: 0 };
  const row = (Array.isArray(data) ? data[0] : data) as Row | undefined;
  if (!row) return { orders: 0, spent: 0 };
  return {
    orders:    Number(row['orders'] ?? 0),
    spent:     Number(row['spent'] ?? 0),
    lastOrder: (row['last_order'] as string) ?? undefined,
  };
}

export async function deleteMyAccount(): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { ok: false, error: 'Supabase is not configured' };
  const { error } = await supabase.rpc('delete_my_account');
  if (error) return { ok: false, error: error.message };
  await supabase.auth.signOut();
  return { ok: true };
}
