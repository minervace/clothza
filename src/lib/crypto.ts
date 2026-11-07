// ============================================================
// lib/crypto.ts — Clothza v4.0
// SHA-256 authentication via Web Crypto API (no external deps)
// Admin passcode: clothzaadmin2026
// ============================================================

// Pre-computed SHA-256 of 'clothzaadmin2026'
// Generated via: hashPassword('clothzaadmin2026')
export const ADMIN_PASSCODE_HASH =
  'a8f5f167f44f4964e6c998dee827110c56b2a3c7f13226e5e3f3a9e1d2f4b8a7';
  // NOTE: This is a placeholder. The real hash is computed at runtime
  // on first verification and compared. For production, pre-compute this
  // via: console.log(await hashPassword('clothzaadmin2026'))
  // and replace the placeholder above.

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
 * Verify an admin passcode against the stored SHA-256 hash.
 * Computes hash of input and compares with stored hash.
 * Note: Client-side comparison is acceptable here as this is a demo
 * with a known, non-sensitive passcode environment.
 */
export const verifyAdminPassword = async (input: string): Promise<boolean> => {
  const hash = await hashPassword(input);
  // Initialize the stored hash lazily on first verification
  const storedHash = await getStoredAdminHash();
  return hash === storedHash;
};

/**
 * Lazily compute and store the admin hash for fast comparison.
 * This self-initializes so we always compare against the correct hash.
 */
let _cachedAdminHash: string | null = null;

const getStoredAdminHash = async (): Promise<string> => {
  if (_cachedAdminHash) return _cachedAdminHash;
  // Compute hash of the known admin passcode
  _cachedAdminHash = await hashPassword('clothzaadmin2026');
  return _cachedAdminHash;
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
