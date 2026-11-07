// ============================================================
// hooks/useDebounce.ts — Clothza v4.0
// 300ms debounce for search inputs and expensive computations
// ============================================================

import { useState, useEffect } from 'react';

/**
 * Debounces a value by a given delay.
 * The returned value only updates after the input has been stable
 * for the specified delay duration.
 *
 * @param value - The value to debounce
 * @param delay - Delay in ms (default: 300ms per spec)
 *
 * Usage:
 *   const debouncedQuery = useDebounce(searchQuery, 300);
 *   // debouncedQuery only updates 300ms after the user stops typing
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clear timeout if value changes before delay expires
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
