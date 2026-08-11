import js from '@eslint/js'
import globals from 'globals'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist/**', 'node_modules/**', 'openspec/**', 'coverage/**', 'test-exploration/**'] },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { parser: tsParser, globals: { ...globals.browser } },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'off', // v1: codebase has many any (store merge, chart)
      '@typescript-eslint/no-unused-vars': 'off', // tsc noUnusedLocals already gates this
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-hooks/exhaustive-deps': 'off', // v1: would demand many useEffect rewrites
    },
  },
  { files: ['**/*.{ts,tsx}'], ...reactRefresh.configs.vite },
  {
    // shadcn/ui primitives export components + helpers (variants, cva) — not HMR-safe by design
    files: ['src/components/ui/**'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    files: ['vite.config.ts', 'vitest.config.ts', 'eslint.config.js'],
    languageOptions: { globals: { ...globals.node } },
  },
]
