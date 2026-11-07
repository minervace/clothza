// ============================================================
// hooks/useTheme.ts — Clothza v4.0
// Light / dark / system theme with localStorage persistence
// No flash on initial load (index.html applies the theme first)
// ============================================================

import { useState, useEffect, useCallback } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'clothza_theme';

const darkQuery = (): MediaQueryList => window.matchMedia('(prefers-color-scheme: dark)');

const getSystemTheme = (): ResolvedTheme => (darkQuery().matches ? 'dark' : 'light');

const getSavedPreference = (): ThemePreference => {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
  } catch {
    // Storage unavailable — fall through to system
  }
  return 'system';
};

const applyTheme = (theme: ResolvedTheme): void => {
  document.documentElement.classList.toggle('dark', theme === 'dark');
};

const persist = (preference: ThemePreference): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // Silently fail
  }
};

/**
 * Custom hook for theme management.
 *
 * `preference` is what the user picked (light / dark / system);
 * `theme` is the resolved scheme actually applied.
 */
export function useTheme() {
  const [preference, setPreferenceState] = useState<ThemePreference>(getSavedPreference);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);

  const theme: ResolvedTheme = preference === 'system' ? systemTheme : preference;

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Track the OS scheme so 'system' follows it live
  useEffect(() => {
    const mql = darkQuery();
    const onChange = (e: MediaQueryListEvent) => setSystemTheme(e.matches ? 'dark' : 'light');
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const setTheme = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    persist(next);
  }, []);

  const cycleTheme = useCallback(() => {
    setPreferenceState(prev => {
      const next: ThemePreference = prev === 'light' ? 'dark' : prev === 'dark' ? 'system' : 'light';
      persist(next);
      return next;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  return {
    preference,
    theme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    isSystem: preference === 'system',
    setTheme,
    cycleTheme,
    toggleTheme,
  };
}
