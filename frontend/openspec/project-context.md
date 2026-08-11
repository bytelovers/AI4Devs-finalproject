# Project Context: spliteat-frontend

## Stack Overview
- **Framework**: React 18 + Vite 5
- **Language**: TypeScript 5.2
- **State Management**: Zustand 4.5
- **Routing**: React Router DOM v7
- **UI Components & Styling**: Tailwind CSS v4, Radix UI primitives, Lucide React, Framer Motion
- **Package Manager**: pnpm

## Testing Setup
- **Runner**: Vitest 1.6
- **Environment**: JSDOM
- **Setup File**: `src/setupTests.ts`
- **Command**: `pnpm test` (`vitest run`)
- **Strict TDD**: Enabled (`strict_tdd: true`)

## Project Structure
- `src/components/`: UI components (scan, ticket, common)
- `src/hooks/`: Custom React hooks (`useCamera`, `useTheme`, etc.)
- `src/lib/`: Core domain models, state, scan engines, OCR pipelines, wizard loaders
- `src/utils/`: General utilities
- `openspec/`: OpenSpec specifications and SDD configuration
