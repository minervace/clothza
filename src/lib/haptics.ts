// ============================================================
// lib/haptics.ts — Clothza v4.0
// Haptic feedback via Vibration API (mobile tactile UX)
// No-op on unsupported devices — safe to call anywhere
// ============================================================

/**
 * Haptic feedback utilities.
 * All methods are safe to call on devices without vibration support.
 *
 * Usage:
 *   haptic.success()  → Add to cart, order confirmed, lookbook saved
 *   haptic.error()    → Wrong admin password, form validation fail
 *   haptic.light()    → Tap on button, tab switch
 *   haptic.medium()   → Toggle favorite, toggle cart item
 *   haptic.heavy()    → Long press, destructive action
 *   haptic.selection()→ Radio/checkbox selection
 */
export const haptic = {
  /** Soft 10ms pulse — button taps, minor interactions */
  light: (): void => {
    navigator.vibrate?.(10);
  },

  /** 25ms pulse — favorites toggle, cart update */
  medium: (): void => {
    navigator.vibrate?.(25);
  },

  /** 50ms pulse — heavy interactions */
  heavy: (): void => {
    navigator.vibrate?.(50);
  },

  /** Double-pulse — selection change (radio, checkbox) */
  selection: (): void => {
    navigator.vibrate?.([5, 30, 5]);
  },

  /** Triple success pulse — add to cart, order confirmed, lookbook saved */
  success: (): void => {
    navigator.vibrate?.([10, 50, 10]);
  },

  /** Error pattern — wrong password, failed action */
  error: (): void => {
    navigator.vibrate?.([100, 30, 100]);
  },

  /** Warning pattern — low stock, cart conflict */
  warning: (): void => {
    navigator.vibrate?.([50, 30, 50]);
  },
} as const;
