# Testing Capabilities

| Layer | Runner / Tool | Command / Pattern | Status | Notes |
|---|---|---|---|---|
| Unit Testing | Vitest | `pnpm test` (`src/**/*.test.ts`) | Active | Core calculation logic, stores, scan pipelines |
| Component Testing | Vitest + RTL | `pnpm test` (`src/**/*.test.tsx`) | Active | JSDOM environment with `@testing-library/react` |
| Integration Testing | Vitest | `pnpm test` (`src/**/*.integration.test.ts`) | Active | OCR pipeline and complex flow integration tests |
| Type Checking | TypeScript Compiler | `pnpm build` (`tsc`) | Active | Strict TypeScript validation |
| Linting | ESLint | `pnpm lint` | Active | ESLint with React Hooks and TS rules |

## TDD Policy
Strict TDD is enforced (`strict_tdd: true`). All structural and logic changes require test-first validation.
