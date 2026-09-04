/**
 * ThemeSelector — Dropdown component for Light/Dark/System theme selection.
 * Renders in the Drawer footer. Follows WCAG 2.1 AA keyboard navigation.
 */

import React from 'react';
import { useTheme, type Theme } from '../hooks/useTheme';

interface ThemeOption {
  value: Theme;
  label: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
  { value: 'system', label: 'Sistema' },
];

export function ThemeSelector(): React.ReactElement {
  const { theme, setTheme } = useTheme();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    const selected = event.currentTarget.value as Theme;
    setTheme(selected);
  };

  return (
    <div className="theme-selector-wrapper">
      <label
        htmlFor="theme-selector"
        className="theme-selector-label"
      >
        Tema
      </label>
      <select
        id="theme-selector"
        aria-label="Theme selector"
        value={theme}
        onChange={handleChange}
        className="theme-selector-select"
      >
        {THEME_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default ThemeSelector;
