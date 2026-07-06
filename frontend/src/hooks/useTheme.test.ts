import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from './useTheme';

describe('useTheme Hook', () => {
  let mediaQueryListener: (() => void) | null = null;
  let matchesMock = false;

  beforeEach(() => {
    // Clear localStorage and mocks
    localStorage.clear();
    document.documentElement.className = '';
    mediaQueryListener = null;
    matchesMock = false;

    // Mock localStorage
    const store: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      clear: vi.fn(() => {
        for (const key in store) {
          delete store[key];
        }
      }),
    });

    // Mock matchMedia
    vi.stubGlobal('window', {
      ...window,
      matchMedia: vi.fn().mockImplementation((query: string) => ({
        matches: matchesMock,
        media: query,
        onchange: null,
        addListener: vi.fn(), // Deprecated
        removeListener: vi.fn(), // Deprecated
        addEventListener: vi.fn((event: string, callback: () => void) => {
          if (event === 'change') {
            mediaQueryListener = callback;
          }
        }),
        removeEventListener: vi.fn((event: string, callback: () => void) => {
          if (event === 'change' && mediaQueryListener === callback) {
            mediaQueryListener = null;
          }
        }),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('should initialize with system theme by default when localStorage is empty', () => {
    matchesMock = true; // System is dark
    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe('system');
    expect(result.current.resolvedTheme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });

  it('should read from localStorage on initialization', () => {
    localStorage.setItem('theme', 'light');
    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe('light');
    expect(result.current.resolvedTheme).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('should update theme and resolvedTheme when setTheme is called', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setTheme('dark');
    });

    expect(result.current.theme).toBe('dark');
    expect(result.current.resolvedTheme).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    act(() => {
      result.current.setTheme('light');
    });

    expect(result.current.theme).toBe('light');
    expect(result.current.resolvedTheme).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('should react to system preference changes when set to system theme', () => {
    matchesMock = false; // Initially system is light
    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe('system');
    expect(result.current.resolvedTheme).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);

    // Simulate system change to dark
    matchesMock = true;
    if (mediaQueryListener) {
      act(() => {
        mediaQueryListener!();
      });
    }

    expect(result.current.theme).toBe('system');
    expect(result.current.resolvedTheme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });

  it('should not react to system preference changes when theme is explicitly set', () => {
    matchesMock = false;
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setTheme('light');
    });

    expect(result.current.theme).toBe('light');
    expect(result.current.resolvedTheme).toBe('light');

    // Simulate system change to dark
    matchesMock = true;
    if (mediaQueryListener) {
      act(() => {
        mediaQueryListener!();
      });
    }

    // Should remain light
    expect(result.current.theme).toBe('light');
    expect(result.current.resolvedTheme).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('should clean up listeners on unmount', () => {
    const { unmount } = renderHook(() => useTheme());
    expect(mediaQueryListener).toBeDefined();

    unmount();
    expect(mediaQueryListener).toBeNull();
  });
});
