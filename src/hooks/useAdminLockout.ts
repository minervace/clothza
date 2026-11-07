// ============================================================
// hooks/useAdminLockout.ts — Clothza v4.0
// Admin authentication lockout after 5 failed attempts (15 min)
// Persisted in localStorage — survives page refresh
// ============================================================

import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { ADMIN_SECURITY } from '@/lib/constants';

interface LockoutState {
  isLocked: boolean;
  lockedUntil: number | null;
  attempts: number;
  remainingMs: number;
  recordFailedAttempt: () => void;
  resetLockout: () => void;
  attemptsRemaining: number;
}

/**
 * Admin lockout hook.
 * Tracks failed admin login attempts and enforces a 15-minute lockout
 * after MAX_ATTEMPTS failures. State persists across page refreshes.
 *
 * Returns:
 *   isLocked        — whether the admin panel is currently locked
 *   lockedUntil     — timestamp (ms) when lockout expires
 *   attempts        — current failed attempt count
 *   remainingMs     — milliseconds remaining in lockout
 *   attemptsRemaining — how many attempts before lockout
 *   recordFailedAttempt — call this on every wrong password
 *   resetLockout    — call this on successful login (clear state)
 */
export function useAdminLockout(): LockoutState {
  const [attempts, setAttempts] = useLocalStorage<number>(
    ADMIN_SECURITY.localStorageKeyAttempts,
    0
  );
  const [lockedUntil, setLockedUntil] = useLocalStorage<number | null>(
    ADMIN_SECURITY.localStorageKeyLockedUntil,
    null
  );

  const now = Date.now();
  const isLocked = lockedUntil !== null && now < lockedUntil;
  const remainingMs = isLocked ? lockedUntil! - now : 0;

  // Auto-clear expired lockout
  if (lockedUntil !== null && now >= lockedUntil) {
    // Don't call setters in render — use effect pattern is handled in component
    // The lockout will be cleared naturally on next recordFailedAttempt or reset
  }

  const recordFailedAttempt = useCallback(() => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (newAttempts >= ADMIN_SECURITY.maxAttempts) {
      setLockedUntil(Date.now() + ADMIN_SECURITY.lockoutDurationMs);
    }
  }, [attempts, setAttempts, setLockedUntil]);

  const resetLockout = useCallback(() => {
    setAttempts(0);
    setLockedUntil(null);
  }, [setAttempts, setLockedUntil]);

  return {
    isLocked,
    lockedUntil,
    attempts,
    remainingMs,
    attemptsRemaining: Math.max(0, ADMIN_SECURITY.maxAttempts - attempts),
    recordFailedAttempt,
    resetLockout,
  };
}
