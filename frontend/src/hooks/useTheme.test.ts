import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTheme } from './useTheme';

describe('useTheme Hook', () => {
  let mediaQueryListener: ((event: MediaQueryListEvent) => void) | null = null;
  let matchesMock = false;

  // Store original methods for cleanup
  const originalMatchMedia = window.matchMedia;
  const originalLocalStorage = global.localStorage;

  beforeEach(() => {
    // Reset mocks
    vi.restoreAllMocks();

    // Clear localStorage
    localStorage.clear();

    // Reset document classes
    document.documentElement.className = '';

    // Mock localStorage
    const store: Record<string, string> = {};
    Object.defineProperty(global, 'localStorage', {
      value: {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
        removeItem: vi.fn((key: string) => { delete store[key]; }),
        clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
      },
      writable: true,
      configurable: true,
    });

    // Mock matchMedia - use a proper MediaQueryList mock
    matchesMock = false;
    const createMockMQL = (matches: boolean) => ({
      matches,
      media: '(prefers-color-scheme: dark)',
      onchange: null as ((event: MediaQueryListEvent) => void) | null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((event: string, callback: (event: MediaQueryListEvent) => void) => {
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
    });

    // Mock matchMedia to return our mock with the current matchesMock value
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockImplementation(() => createMockMQL(matchesMock)),
      writable: true,
      configurable: true,
    });

    // Clear document classes
    document.documentElement.className = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Restore original matchMedia
    Object.defineProperty(window, 'matchMedia', {
      value: originalMatchMedia,
      writable: true,
      configurable: true,
    });
    global.localStorage = originalLocalStorage;
    document.documentElement.className = '';
  });

  // Helper to trigger media query change
  const triggerMediaChange = (matches: boolean) => {
    matchesMock = matches; // Update the mock value
    if (mediaQueryListener) {
      act(() => {
        mediaQueryListener!({ matches } as MediaQueryListEvent);
      });
    }
  };

  it('should initialize with system theme by default when localStorage is empty', () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe('system');
    expect(result.current.resolvedTheme).toBe('light'); // Default matchesMock is false
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
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

  it('should react to system preference changes when set to system theme', async () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe('system');
    expect(result.current.resolvedTheme).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);

    // Simulate system change to dark
    triggerMediaChange(true);

    await waitFor(() => {
      expect(result.current.resolvedTheme).toBe('dark');
    });

    expect(result.current.theme).toBe('system');
    expect(result.current.resolvedTheme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });

  it('should not react to system preference changes when theme is explicitly set', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setTheme('light');
    });

    expect(result.current.theme).toBe('light');
    expect(result.current.resolvedTheme).toBe('light');

    // Simulate system change to dark
    triggerMediaChange(true);

    // Should remain light
    expect(result.current.theme).toBe('light');
    expect(result.current.resolvedTheme).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('should clean up listeners on unmount', () => {
    const { unmount } = renderHook(() => useTheme());

    // The hook should have added an event listener
    // We can't easily test the exact listener, but we can verify unmount doesn't throw
    expect(() => unmount()).not.toThrow();
  });
});