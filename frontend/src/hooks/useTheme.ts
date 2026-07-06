/**
 * useTheme — Sage & Amber Visual Redesign
 * Manages manual and system theme selection with localStorage persistence
 * and FOUC-free class application on <html>.
 */

import { useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export interface UseThemeReturn {
  /** The stored theme preference ('light' | 'dark' | 'system') */
  theme: Theme;
  /** The effective theme currently applied to the document */
  resolvedTheme: ResolvedTheme;
  /** Change the theme and persist to localStorage */
  setTheme: (theme: Theme) => void;
}

const STORAGE_KEY = 'theme';
const DARK_CLASS = 'dark';
const LIGHT_CLASS = 'light';

/** Read the OS preference via matchMedia */
function getSystemTheme(): ResolvedTheme {
  if (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  ) {
    return 'dark';
  }
  return 'light';
}

/** Resolve a stored theme preference to an actual 'light' | 'dark' value */
function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
}

/** Apply the resolved class to <html>, removing the opposite class */
function applyThemeClass(resolved: ResolvedTheme): void {
  const root = document.documentElement;
  if (resolved === 'dark') {
    root.classList.add(DARK_CLASS);
    root.classList.remove(LIGHT_CLASS);
  } else {
    root.classList.add(LIGHT_CLASS);
    root.classList.remove(DARK_CLASS);
  }
}

/** Read and validate the stored theme from localStorage */
function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {
    // localStorage may be unavailable in private browsing or SSR
  }
  return 'system';
}

export function useTheme(): UseThemeReturn {
  const [theme, setThemeState] = useState<Theme>(() => readStoredTheme());
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolveTheme(readStoredTheme())
  );

  // Persist + apply whenever theme changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Ignore write errors
    }
    const resolved = resolveTheme(theme);
    setResolvedTheme(resolved);
    applyThemeClass(resolved);
  }, [theme]);

  // Listen to OS theme changes — only relevant when theme === 'system'
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (): void => {
      // Only react when the user has selected 'system'
      setThemeState((current) => {
        if (current === 'system') {
          const resolved = resolveTheme('system');
          setResolvedTheme(resolved);
          applyThemeClass(resolved);
        }
        return current;
      });
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  const setTheme = useCallback((newTheme: Theme): void => {
    setThemeState(newTheme);
  }, []);

  return { theme, resolvedTheme, setTheme };
}
