// ============================================================
// lib/formatters.ts — Clothza v4.0
// Formatting utilities: NPR price, dates, slugs, image URLs
// ============================================================

import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { CURRENCY, DELIVERY } from './constants';

// ── Price Formatting ─────────────────────────────────────────

/**
 * Format a number as an NPR price string.
 * e.g. 12500 → "रू 12,500"
 */
export const formatPrice = (amount: number): string => {
  const formatted = new Intl.NumberFormat('en-NP', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
  return `${CURRENCY.symbol} ${formatted}`;
};

/**
 * Format price in compact form for display in badges.
 * e.g. 12500 → "रू 12.5K"
 */
export const formatPriceCompact = (amount: number): string => {
  if (amount >= 100000) {
    return `${CURRENCY.symbol} ${(amount / 100000).toFixed(1)}L`;
  }
  if (amount >= 1000) {
    return `${CURRENCY.symbol} ${(amount / 1000).toFixed(1)}K`;
  }
  return formatPrice(amount);
};

/**
 * Calculate compare-at price (20% above sale price).
 */
export const calcCompareAtPrice = (price: number): number => {
  return Math.round(price * 1.2);
};

/**
 * Calculate discount percentage between two prices.
 */
export const calcDiscountPercent = (
  originalPrice: number,
  salePrice: number
): number => {
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
};

/**
 * Calculate order total with delivery fee and discount.
 */
export const calcOrderTotal = (
  subtotal: number,
  discountAmount: number = 0
): { subtotal: number; discountAmount: number; deliveryFee: number; total: number } => {
  const deliveryFee = subtotal - discountAmount >= DELIVERY.freeThreshold ? 0 : DELIVERY.feeFlat;
  const total = Math.max(0, subtotal - discountAmount + deliveryFee);
  return { subtotal, discountAmount, deliveryFee, total };
};

// ── Date Formatting ──────────────────────────────────────────

/**
 * Format an ISO date string to a human-readable date.
 * e.g. "2026-07-20T10:30:00Z" → "Jul 20, 2026"
 */
export const formatDate = (isoString: string): string => {
  try {
    return format(parseISO(isoString), 'MMM d, yyyy');
  } catch {
    return isoString;
  }
};

/**
 * Format an ISO date string to full date + time.
 * e.g. "2026-07-20T10:30:00Z" → "Jul 20, 2026 at 10:30 AM"
 */
export const formatDateTime = (isoString: string): string => {
  try {
    return format(parseISO(isoString), "MMM d, yyyy 'at' h:mm a");
  } catch {
    return isoString;
  }
};

/**
 * Format a date as a relative time string.
 * e.g. "2026-07-19T10:00:00Z" → "about 1 day ago"
 */
export const formatRelativeTime = (isoString: string): string => {
  try {
    return formatDistanceToNow(parseISO(isoString), { addSuffix: true });
  } catch {
    return isoString;
  }
};

/**
 * Format seconds as MM:SS countdown.
 * e.g. 119 → "1:59"
 */
export const formatCountdown = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// ── String Utilities ─────────────────────────────────────────

/**
 * Convert a string to a URL-safe slug.
 * e.g. "Atelier Noir" → "atelier-noir"
 */
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Convert a slug back to a readable title.
 * e.g. "atelier-noir" → "Atelier Noir"
 */
export const deslugify = (slug: string): string => {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Capitalize the first letter of each word.
 */
export const titleCase = (text: string): string => {
  return text.replace(/\b\w/g, char => char.toUpperCase());
};

/**
 * Truncate a string to a given length and append ellipsis.
 */
export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
};

// ── Image URL Optimization ───────────────────────────────────

/**
 * Optimize an Unsplash image URL with proper parameters.
 * Adds: w, h, auto=format (WebP), fit=crop, q=80
 *
 * Usage:
 *   Product card thumbnail: optimizeImageUrl(url, 600, 800)
 *   Store banner:           optimizeImageUrl(url, 1200, 400)
 *   Store logo:             optimizeImageUrl(url, 200, 200)
 *   Hero background:        optimizeImageUrl(url, 1920)
 */
export const optimizeImageUrl = (
  baseUrl: string,
  width: number,
  height?: number
): string => {
  try {
    const url = new URL(baseUrl);
    url.searchParams.set('w', String(width));
    if (height) url.searchParams.set('h', String(height));
    url.searchParams.set('auto', 'format');
    url.searchParams.set('fit', 'crop');
    url.searchParams.set('q', '80');
    return url.toString();
  } catch {
    // Return original if URL parsing fails
    return baseUrl;
  }
};

// ── Number Formatting ────────────────────────────────────────

/**
 * Format a large number with K/M abbreviation.
 * e.g. 48000 → "48K", 1200000 → "1.2M"
 */
export const formatNumber = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

/**
 * Alias of formatNumber — compact display (K/M).
 * e.g. 48200 → "48.2K"
 */
export const formatCompactNumber = formatNumber;

/**
 * Format a rating number to one decimal place.
 * e.g. 4.666666 → "4.7"
 */
export const formatRating = (rating: number): string => {
  return rating.toFixed(1);
};

/**
 * Generate star array for a rating (1–5).
 * Returns array of 'filled' | 'half' | 'empty'
 */
export const getStars = (rating: number): Array<'filled' | 'half' | 'empty'> => {
  const stars: Array<'filled' | 'half' | 'empty'> = [];
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) {
      stars.push('filled');
    } else if (rating >= i - 0.5) {
      stars.push('half');
    } else {
      stars.push('empty');
    }
  }
  return stars;
};

// ── Coupon Validation ────────────────────────────────────────

/**
 * Apply coupon discount to a subtotal.
 * Returns the discount amount (not the final price).
 */
export const applyCoupon = (
  subtotal: number,
  discountType: 'percentage' | 'fixed',
  discountValue: number
): number => {
  if (discountType === 'percentage') {
    return Math.round((subtotal * discountValue) / 100);
  }
  return Math.min(discountValue, subtotal); // Can't discount more than subtotal
};

// ── Credit Card Formatting ────────────────────────────────────

/**
 * Format a card number string as XXXX XXXX XXXX XXXX.
 */
export const formatCardNumber = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  const groups = digits.match(/.{1,4}/g) ?? [];
  return groups.join(' ');
};

/**
 * Format card expiry as MM/YY.
 */
export const formatCardExpiry = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

// ── Phone Formatting ─────────────────────────────────────────

/**
 * Format a Nepal phone number.
 * e.g. "9845678901" → "98-4567-8901"
 */
export const formatPhoneNumber = (phone: string): string => {
  const digits = phone.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
};
