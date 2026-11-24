// ============================================================
// lib/supabaseAuth.ts — Clothza v4.0
// Email + password auth against Supabase Auth, with the profile
// row (created by the handle_new_user trigger) mapped onto User.
// ============================================================

import supabase, { isSupabaseConfigured } from '@/lib/supabase';
import type { User } from '@/context/MarketplaceContext';

export interface AuthResult {
  ok: boolean;
  error?: string;
  needsConfirmation?: boolean;
}

type Row = Record<string, unknown>;

const mapProfile = (r: Row): User => ({
  id:               String(r['id'] ?? ''),
  name:             String(r['name'] ?? ''),
  email:            String(r['email'] ?? ''),
  phone:            (r['phone'] as string) ?? undefined,
  avatarUrl:        (r['avatar_url'] as string) ?? undefined,
  role:             (r['role'] as User['role']) ?? 'customer',
  storeId:          (r['store_id'] as string) ?? undefined,
  subscriptionTier: (r['subscription_tier'] as User['subscriptionTier']) ?? 'free',
  totalSpent:       Number(r['total_spent'] ?? 0),
  joinedAt:         String(r['joined_at'] ?? new Date().toISOString()),
  adminRequest:     (r['admin_request'] as User['adminRequest']) ?? undefined,
});

/** Reads the profile row for an authenticated user. */
export async function fetchProfile(userId: string): Promise<User | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return mapProfile(data as Row);
}

/** Current session, if any. */
export async function getSessionUser(): Promise<User | null> {
  if (!isSupabaseConfigured) return null;

  const { data } = await supabase.auth.getSession();
  const id = data.session?.user.id;
  if (!id) return null;

  return fetchProfile(id);
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  if (!isSupabaseConfigured) return { ok: false, error: 'Supabase is not configured' };

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function signUp(
  email: string,
  password: string,
  name: string,
  role: 'customer' | 'seller' = 'customer'
): Promise<AuthResult> {
  if (!isSupabaseConfigured) return { ok: false, error: 'Supabase is not configured' };

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, role } },
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true, needsConfirmation: !data.session };
}

/**
 * Starts the Google OAuth flow. Supabase redirects the browser to Google,
 * then back to this app, where onAuthStateChange picks up the session.
 */
export async function signInWithGoogle(
  redirectTo: string = window.location.origin
): Promise<AuthResult> {
  if (!isSupabaseConfigured) return { ok: false, error: 'Supabase is not configured' };

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: { access_type: 'offline', prompt: 'select_account' },
    },
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Changes the password for the signed-in email/password account. */
export async function changePassword(newPassword: string): Promise<AuthResult> {
  if (!isSupabaseConfigured) return { ok: false, error: 'Supabase is not configured' };

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Updates the display name on the auth user and the profiles row. */
export async function updateDisplayName(name: string): Promise<AuthResult> {
  if (!isSupabaseConfigured) return { ok: false, error: 'Supabase is not configured' };

  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) return { ok: false, error: 'Not signed in' };

  const authResult = await supabase.auth.updateUser({ data: { name } });
  if (authResult.error) return { ok: false, error: authResult.error.message };

  const { error } = await supabase.from('profiles').update({ name }).eq('id', id);
  if (error) return { ok: false, error: error.message };

  return { ok: true };
}

/** Whether this account signs in with a password or through Google. */
export async function getAuthProvider(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.app_metadata?.provider ?? null;
}

export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured) return;
  await supabase.auth.signOut();
}

/** Subscribes to auth state changes; returns an unsubscribe function. */
export function onAuthStateChange(callback: (user: User | null) => void): () => void {
  if (!isSupabaseConfigured) return () => undefined;

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    const id = session?.user.id;
    if (!id) {
      callback(null);
      return;
    }
    void fetchProfile(id).then(profile => callback(profile));
  });

  return () => data.subscription.unsubscribe();
}
