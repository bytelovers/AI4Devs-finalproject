# Design: fix-typecheck-and-runtime

## Technical Approach

Restore static protection and fix latent runtime defects. Attack by dependency layer: the `AppState` interface divergence is the root cause (~62% of the 286 `tsc -b` errors) — re-declare the 24 actions mirroring runtime signatures, then let TypeScript surface the remaining call-site mismatches. Independent fronts (lint, a11y, meta, HomeView, backup) are sequenced after the type layer so the diff stays reviewable. Baseline = **current working tree** (uncommitted EXIF WIP is present and overlaps `ScanEngineSelector.tsx`, `ScanOnboarding.tsx`, `exifHelper*`; see Risks).

## Attack Order (layered)

| Step | Front | Rationale |
|------|-------|-----------|
| 0 | Baseline: commit/stash EXIF WIP (`exif-metadata-mapping`) | Overlap on ScanEngineSelector/exifHelper/ScanOnboarding |
| 1 | `AppState` 24 actions + `exportData`/`importData` in `store.ts` | Kills ~177 errors (TS2339×137 + TS2551×4 + TS7006×36) incl. store.test (60), wizard-loaders.test (15), ScanEngineSelector, GroupsView, OcrReviewView |
| 2 | Remaining semantic fixes: `EngineInfo`, `chart.tsx` (recharts v3), `useCamera`, `preprocessor.ts` generics, call-site TS2345/2322/2741/2367 | Dependent on step 1 (errors only visible after AppState is typed) |
| 3 | Mechanical cleanup: TS6133/6192/6196/2307 unused imports/vars across ~30 files | Pure deletions, no logic |
| 4 | Tests: AssignmentEditor 1/N + 0.55; exifHelper.test sync; preprocessor.test `beforeEach` import | Suite must be green independent of tsc |
| 5 | Independent fronts: build script + tsconfig exclude, HomeView, lint config + deps, a11y 17 inputs, meta | No type-layer dependency; parallelizable |
| 6 | Gates: `tsc -b && vite build`, `pnpm lint`, `pnpm test` | Final acceptance |

Steps 1–4 are one commit chain (type layer); step 5 splits into 2–3 small PRs (build gate, lint, runtime/a11y) to keep diffs under review budget.

## Architecture Decisions

| Decision | Options | Chosen | Rationale |
|----------|---------|--------|-----------|
| AppState signatures | Invent / mirror runtime | **Mirror exactly** (below) | Prevents hiding real call-site bugs; TS2345/2322 then surface genuine mismatches to be fixed at call sites, never by loosening the interface |
| Backup validation | zod vs manual guard | **Manual ~20-line guard** (`isValidAppData` helper) | 0 new deps (scope: "no new features"); single v1 schema; matches existing `merge()` migration style in persist |
| `exportData`/`importData` contract | object vs string | **`exportData(): string`**, **`importData(json: string): boolean`** | Symmetric raw-string pair; **requires 2 edits in SettingsView** (see Data Flow — current `JSON.stringify(exportData())` would double-encode and `importData(JSON.parse(...))` must become `importData(importText)`) |
| `@eslint/js` in pnpm strict | add direct devDep vs avoid | **Add `@eslint/js@^8.57.1` + `globals` as direct devDeps** | Verified: `@eslint/js` is a transitive dep of eslint 8.57.1, invisible at root; pinning `^8.57.1` is zero version risk; manual globals would reinvent |
| Lint severity v1 | warn / error / off | **`error` for small stable set, `off` for noisy rules** | `--max-warnings 0` makes `warn` ≡ fail, so v1 uses `off` instead of `warn` for `no-explicit-any`, `exhaustive-deps`, `react-refresh`; harden later by flipping to `error` + fixing. Justification: 46 broken files cannot absorb strict rules in one diff; a green minimal gate beats a red strict one |
| typescript-eslint v6 wiring | flat presets vs manual | **Manual from `configs.recommended.rules`** | Verified: v6.21 exports only eslintrc-style configs (no `flat/` keys). `recommended` is **non-type-checked** → no `parserOptions.project`, fast lint, no tsconfig coupling |
| exifHelper.test vitest | touch mock vs exclude from vitest | **Sync test imports + factory mock** (see Tests) | Verified NOW failing in vitest: `Failed to resolve import "exifreader"` — the "passes with hoisted mock" premise is false in the current tree; minimal fix keeps coverage |
| `_startManual` | keep no-op vs remove | **Remove wrapper + all 3 call sites** | Nothing reads it; spec requires zero `_startManual` refs in `src/`; spec's "keep setStartManual(false)" is vacuous once the wrapper dies (see Open Questions) |

## Data Flow

```
SettingsView (backup card)
  exportData() ──► string (AppData JSON, no draftTicketId) ──► Blob download
  importData(rawString) ──► JSON.parse → isValidAppData() guard → set({...DEFAULT_DATA, ...data})
                                 └─ invalid ──► throw Error ──► SettingsView try/catch → toast.error
zustand persist middleware auto-persists the imported state to localStorage (no extra write)
```

SettingsView edits (both required):
- `new Blob([JSON.stringify(exportData(), null, 2)])` → `new Blob([exportData()], { type: 'application/json' })`
- `importData(JSON.parse(importText))` → `importData(importText)`

## Interfaces / Contracts

`AppState` gains (beyond existing `draftTicketId`/`setDraftTicketId`/`clearDraftTicketId` + `AppData`): **22 mirrored runtime actions + 2 new**:

```ts
// People
addPerson: (name: string) => Person
updatePerson: (id: ID, patch: Partial<Person>) => void
deletePerson: (id: ID) => void
// Groups
addGroup: (name: string, memberIds?: ID[]) => Group
updateGroup: (id: ID, patch: Partial<Group>) => void
deleteGroup: (id: ID) => void
addMemberToGroup: (groupId: ID, personId: ID) => void
removeMemberFromGroup: (groupId: ID, personId: ID) => void
// Tickets
addTicket: (partial: Partial<Ticket>) => Ticket
updateTicket: (id: ID, patch: Partial<Ticket>) => void
deleteTicket: (id: ID) => void
// Items
addTicketItem: (ticketId: ID, item?: Partial<TicketItem>) => void
updateTicketItem: (ticketId: ID, itemId: ID, patch: Partial<TicketItem>) => void
deleteTicketItem: (ticketId: ID, itemId: ID) => void
// Discounts
addTicketDiscount: (ticketId: ID, discount?: Partial<TicketDiscount>) => void
updateTicketDiscount: (ticketId: ID, discountId: ID, patch: Partial<TicketDiscount>) => void
deleteTicketDiscount: (ticketId: ID, discountId: ID) => void
// Recalc
recalcTicket: (ticketId: ID) => void
// Profile/settings
updateProfile: (patch: Partial<AppData['profile']>) => void
updateSettings: (patch: Partial<AppData['settings']>) => void
updateFeatureFlags: (patch: Partial<AppData['featureFlags']>) => void
resetAll: () => void
// Backup (new)
exportData: () => string
importData: (json: string) => boolean
```

All 22 mirror store.ts:66–367 exactly (return types from runtime: `addPerson`/`addGroup`/`addTicket` return entities; `addTicketItem`/`addTicketDiscount` return void). The `create<AppState>()` generic then contextually types store params, erasing the 36 TS7006. Expected post-declaration call-site errors (fix at call sites, not the interface): TS2741 missing `createdAt` on Person literals; TS2322 on `items` lacking `id`; TS2345 where callers pass incompatible patches.

`exportData()`: `JSON.stringify({ ...get().people/groups/tickets/profile/settings/featureFlags/version })` (mirrors `partialize`; excludes `draftTicketId`).

`importData()`: try/catch `JSON.parse` → module-level `isValidAppData(data): data is AppData` guard (object; arrays `people/groups/tickets`; objects `profile/settings/featureFlags`; `version` is number) → defensive deep merge over `DEFAULT_DATA` (`settings: {...DEFAULT_DATA.settings, ...data.settings}` etc.) → `set({...merged, draftTicketId: null})` → return true; throw `Error` on any invalid step. No zod (decision above).

`EngineInfo` (scan/types.ts:79): add `requiresConnection?: boolean; requiresDownload?: boolean; precision?: string`; populate in `getEngines()` (capabilities.ts, 4 entries) — the WIP component already consumes these fields. Fix is additive + type-safe.

## Typecheck Config

`tsconfig.app.json`: add

```jsonc
/* EXIF deferred: exifHelper.test.ts is excluded from typecheck until
   exifreader is installed (SDD exif-metadata-mapping). vitest still runs it. */
"exclude": ["src/utils/exifHelper.test.ts"]
```

(tsconfig supports JSONC comments.) `tsconfig.node.json` already clean (0 errors). Vitest impact: none from tsc; the file's runtime failure is handled in Tests.

## Lint (flat, eslint 8.57.1)

New `eslint.config.js` (ESM — `"type": "module"`), assembled manually:

```js
import js from '@eslint/js'
import globals from 'globals'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist/**', 'node_modules/**', 'openspec/**', 'coverage/**'] },
  { files: ['**/*.{ts,tsx}'], languageOptions: { parser: tsParser, globals: { ...globals.browser } },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: { ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'off',          // v1: codebase has many any (store merge, chart)
      '@typescript-eslint/no-unused-vars': 'off' }, },      // tsc noUnusedLocals already gates this
  { files: ['**/*.{ts,tsx}'], plugins: { 'react-hooks': reactHooks },
    rules: { ...reactHooks.configs.recommended.rules,
      'react-hooks/exhaustive-deps': 'off' } },             // v1: would demand many useEffect rewrites
  { files: ['**/*.{ts,tsx}'], ...reactRefresh.configs.vite }, // verified flat-shaped: {plugins, rules}
  { files: ['vite.config.ts', 'vitest.config.ts', 'eslint.config.js'],
    languageOptions: { globals: { ...globals.node } } },
]
```

Verified shapes: `reactRefresh.configs.vite` is a flat-style object (`name/plugins/rules`, `plugins` not an array) → usable directly; `reactHooks.configs.recommended` is legacy (`plugins: ['react-hooks']` string) → wrap manually; `tsPlugin.configs.recommended` is legacy → take `.rules` only; js recommended comes from the new `@eslint/js` devDep. `package.json`: `lint` → `eslint . --report-unused-disable-directives --max-warnings 0` (drop `--ext`); add devDeps `@eslint/js@^8.57.1`, `globals` (pin to eslint's own transitive version). Iterate: run `pnpm lint`, triage stragglers (fix trivial, `off` the noisy) until exit 0. `react-refresh/only-export-components` may flag files exporting components + helpers (e.g., ui components) — triage in the same pass.

## Independent Fronts

- **HomeView.tsx**: remove `setStartManual` wrapper (line 17). Line 136 `setView('new-ticket')` → `navigate('/tickets/new')`; empty-state CTA becomes `onClick: () => navigate('/tickets/new')`. Hero CTAs (lines 51, 63): drop `setStartManual(...)` calls, keep `navigate(...)`. Zero `_startManual`/`setStartManual` refs remain (kills TS2304 + TS2353).
- **Backup**: store.ts (Interfaces) + SettingsView 2 edits (Data Flow).
- **A11y (17 inputs, 9 files)** — `Input` spreads props (verified), so call-site-only:

| File:line | Approach |
|-----------|----------|
| GroupsView 121, 214 | `id` + `aria-label` ("Renombrar grupo", "Nuevo grupo") |
| ContactsView 121, 227 | `id` + `aria-label` ("Renombrar contacto", "Nuevo contacto") |
| TicketsListView 92 | `aria-label="Buscar tickets"` |
| NewTicketReviewView 75 | `aria-label="Título del ticket"` (visible label is structural) |
| PeopleGroupsManager 129, 349 | `aria-label` ("Añadir persona", "Nombre del grupo") |
| AssignmentEditor 617 | `aria-label="Peso de {persona}"` (compact inline) |
| TicketItemsEditor 310, 347, 481, 489, 503 | `aria-label` per input (descuento nombre/importe, item nombre/cantidad/precio) |
| sidebar 325 | `aria-label` on SidebarInput |
| TicketDetailView 84 | `id` + `aria-label="Título del ticket"` |

- **index.html**: add `<meta name="mobile-web-app-capable" content="yes" />` in PWA/Apple block (keep all apple-*).

## Tests

- **AssignmentEditor.test.tsx** (2 expectation-only edits, no logic):
  - "mode shared normalizes all weights to 1" → rename "…to 1/N"; `expect(a.weight).toBe(1)` → `toBeCloseTo(1 / 2, 5)` (setMode('shared') at AssignmentEditor:395 → `1/current.length` = 0.5).
  - "weighted mode number-step +0.5 updates store" → step is **+0.05** (AssignmentEditor:637 `weight + 0.05`); `expect(anaAssignment.weight).toBe(1.0)` → `toBeCloseTo(0.55, 5)`; rename "+0.05". (`initialWeight === 0.5` still passes.)
- **exifHelper.test.ts** (sync to exported surface + make vitest runnable; evidence: current run → `Failed to resolve import "exifreader"`, 1 file failed):
  - `vi.mock('exifreader')` → `vi.mock('exifreader', () => ({ load: vi.fn() }))` (factory removes resolution).
  - Import `RawExifResult` from `@/lib/types` (it lives there; exifHelper imports it but does not re-export — TS2459).
  - Drop unused `convertDMSToDecimal` import.
  - `parseExifDate` is not exported (TS2459) and is used as a value (line 41) → remove the direct assertion; the same conversion is already asserted via `mapRawExifToNamespace` timestamp (lines 50, 69). Alternative (if EXIF workstream prefers): export `parseExifDate` from exifHelper.ts — flagged to avoid double-touching WIP.
  - File stays **excluded from tsc** (no exifreader types needed) but **runs in vitest**.
- **store.test.ts**: optionally add export/import round-trip + invalid-input describe (~40 lines) — covers spec scenarios 2/3 at unit level; recommended.

## File Changes

| File | Action | Lines (est.) |
|------|--------|-------------|
| `src/lib/store.ts` | Modify | +60 (24 signatures) +45 (exportData/importData + guard) |
| `src/views/SettingsView.tsx` | Modify | −2 |
| `src/lib/scan/types.ts` | Modify | +6 (EngineInfo fields) |
| `src/lib/scan/capabilities.ts` | Modify (WIP overlap) | +8 |
| `src/components/ui/chart.tsx` | Modify | ±35 (recharts v3 types) |
| `src/hooks/useCamera.ts` | Modify | −3 +3 (grabFrame cast) |
| `src/hooks/useCamera.test.ts` | Modify | ±5 (canvas mock type) |
| `src/lib/scan/preprocessor.ts` | Modify | ±6 (Uint8ClampedArray generics + unused) |
| `src/components/onboarding/ScanOnboarding.tsx` | Modify (WIP overlap) | ±5 (unused + comparison) |
| `src/views/HomeView.tsx` | Modify | −6 |
| `src/components/ticket/AssignmentEditor.test.tsx` | Modify | ±6 |
| `src/utils/exifHelper.test.ts` | Modify (WIP overlap) | ±8 |
| `src/lib/store.test.ts` | Modify | +40 (backup tests, optional) |
| ~30 prod/test files (TS6133/6192/6196) | Modify | −1..−5 each (~120 total) |
| 9 a11y files | Modify | +20–30 |
| `tsconfig.app.json` | Modify | +2 |
| `package.json` | Modify | +5 (scripts/deps) |
| `eslint.config.js` | Create | +100 |
| `index.html` | Modify | +1 |

**~47 files, ~470–580 lines** → above the 400-line budget → chain into ≥3 PRs (see Risks).

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | exportData/importData round-trip + invalid input | new store.test.ts describe |
| Unit | 1/N + 0.05 expectations | AssignmentEditor.test.tsx edits |
| Integration | `tsc -b` exit 0 (prod + tests) | gate |
| Integration | `pnpm lint` exit 0 | gate |
| E2E/manual | backup export/import, HomeView CTA, a11y labels, meta | manual + a11y snapshot check |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary. (`package.json` script edits are config, not an injection surface.)

## Migration / Rollout

No data migration. One behavioral note: `importData` sets `draftTicketId: null` and persist auto-writes to localStorage; existing `merge()` migration still runs on rehydrate. Rollback = revert per-PR (build script 1 line, additive interface members, isolated backup code, delete lint config).

## Open Questions

- [ ] Spec wording "keeping setStartManual(false)" vs "no `_startManual` references remain": resolved in design as **remove wrapper + calls** (dead code, nothing consumes it) — confirm with orchestrator during tasks.
- [ ] `parseExifDate`: drop redundant direct assertion (chosen) vs export from exifHelper (EXIF workstream owns the file).
- [ ] Optional store.test.ts backup tests: include (recommended) or skip to shrink diff.

## Forecast (Review Workload Guard)

| PR chain | Files | Lines |
|----------|-------|-------|
| PR-A type layer (store + semantic + mechanical + tests) | ~40 | ~300–360 |
| PR-B lint (config + deps + package.json + triage) | ~5 | ~120–150 |
| PR-C runtime/a11y (HomeView, SettingsView, a11y, meta, tsconfig, build script) | ~13 | ~60–80 |

Total ~47 files / ~480–590 lines → forecasted **>400 → split as above**; PR-A itself is >300 → consider splitting store + mechanical cleanup.
