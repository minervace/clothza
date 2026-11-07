// ============================================================
// hooks/useLocalStorage.ts — Clothza v4.0
// Safe JSON parse/stringify wrapper with SSR-safe initialization
// ============================================================

import { useState, useCallback, useEffect } from 'react';

type SetValue<T> = (value: T | ((prev: T) => T)) => void;

/**
 * A useState wrapper that persists state in localStorage.
 * - Safe JSON parse with fallback to default value on error.
 * - Supports functional updater pattern.
 * - Syncs across tabs via storage event.
 *
 * @param key - localStorage key
 * @param initialValue - default value if key doesn't exist
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, SetValue<T>, () => void] {
  // Initialize state from localStorage
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item === null) return initialValue;
      return JSON.parse(item) as T;
    } catch {
      // If parsing fails, return the initial value
      return initialValue;
    }
  });

  // Persist to localStorage whenever value changes
  const setValue: SetValue<T> = useCallback(
    (value) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch {
        // Silently fail if localStorage is full or blocked
        console.warn(`[useLocalStorage] Failed to persist key: ${key}`);
      }
    },
    [key, storedValue]
  );

  // Remove the key from localStorage
  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch {
      console.warn(`[useLocalStorage] Failed to remove key: ${key}`);
    }
  }, [key, initialValue]);

  // Sync state across browser tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key !== key) return;
      try {
        const newValue = e.newValue ? (JSON.parse(e.newValue) as T) : initialValue;
        setStoredValue(newValue);
      } catch {
        setStoredValue(initialValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}
