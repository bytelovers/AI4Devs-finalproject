import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  // Enable class-based dark mode so Tailwind's dark: variant aligns
  // with the .dark class applied by useTheme hook and the FOUC script
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Sage & Amber design palette — mapped to CSS custom properties
        // so theme switching (light/dark) is reflected automatically
        sage: 'var(--color-sage)',
        amber: 'var(--color-amber)',
      },
    },
  },
  plugins: [],
};

export default config;
