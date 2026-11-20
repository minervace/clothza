// ============================================================
// lib/crypto.ts — Clothza v4.0
// SHA-256 hashing for the admin gate (Web Crypto, no deps)
//
// IMPORTANT: this gate only hides the admin UI. Real access
// control is server-side: profiles.role = 'admin' plus the RLS
// policies in supabase/schema.sql and supabase/roles.sql.
// ============================================================

/**
 * SHA-256 hex digest of the admin passcode.
 * Regenerate with: hashPassword('<new passcode>')
 * and replace the value below.
 */
export const ADMIN_PASSCODE_HASH =
  '111b0cae7304da5c9ebbead562eb07877ed3de26b90be57e5304125be6b5c813';

/**
 * Hash a string using SHA-256 via the native Web Crypto API.
 * Returns hex-encoded hash string.
 */
export const hashPassword = async (input: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Verify an admin passcode against ADMIN_PASSCODE_HASH.
 * Compares digests, so the plaintext passcode never exists in
 * the bundle.
 */
export const verifyAdminPassword = async (input: string): Promise<boolean> => {
  const hash = await hashPassword(input);
  if (hash.length !== ADMIN_PASSCODE_HASH.length) return false;

  // Constant-time-ish comparison: always walk the full string
  let diff = 0;
  for (let i = 0; i < hash.length; i++) {
    diff |= hash.charCodeAt(i) ^ ADMIN_PASSCODE_HASH.charCodeAt(i);
  }
  return diff === 0;
};

/**
 * Generate a random order tracking ID.
 * Format: CLZ-2026-XXXXX (5 alphanumeric chars)
 */
export const generateTrackingId = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const random = Array.from({ length: 5 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
  return `CLZ-2026-${random}`;
};

/**
 * Generate a UUID v4 (for entity IDs).
 */
export const generateId = (): string => {
  return crypto.randomUUID();
};
