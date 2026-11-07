// ============================================================
// hooks/useTheme.ts — Clothza v4.0
// Dark/light mode toggle with localStorage persistence
// No flash on initial load (reads class from <html> element)
// ============================================================

import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'clothza_theme';

/**
 * Reads the system preference for dark mode.
 */
const getSystemTheme = (): Theme => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

/**
 * Reads the saved theme from localStorage, falling back to system preference.
 */
const getSavedTheme = (): Theme => {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
    return saved === 'light' || saved === 'dark' ? saved : getSystemTheme();
  } catch {
    return getSystemTheme();
  }
};

/**
 * Apply theme class to <html> element and persist to localStorage.
 */
const applyTheme = (theme: Theme): void => {
  const html = document.documentElement;
  if (theme === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Silently fail
  }
};

/**
 * Custom hook for theme management.
 * Returns: [theme, toggleTheme, setTheme]
 *
 * Usage:
 *   const { theme, toggleTheme, isDark } = useTheme();
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Read from DOM (set by inline script in index.html or previous session)
    const htmlClass = document.documentElement.classList.contains('dark');
    return htmlClass ? 'dark' : getSavedTheme();
  });

  // Apply theme on mount and whenever it changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if user hasn't manually set a preference
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        setThemeState(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return {
    theme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    toggleTheme,
    setTheme,
  };
}
