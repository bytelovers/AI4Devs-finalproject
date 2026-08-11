# Exploration: fix-typecheck-and-runtime

## Current State

### 1. Build pipeline: `tsc` is a NO-OP

- `frontend/tsconfig.json` is solution-style: `{ "files": [], "references": ["./tsconfig.app.json", "./tsconfig.node.json"] }`.
- `frontend/package.json` `build` script is `"tsc && vite build"` — `tsc` WITHOUT `-b` on a solution-style config **compiles 0 files** and exits 0 (verified: `npx tsc --noEmit` → exit 0, no output).
- `vite build` alone succeeds (exit 0, 3.7s) → the release pipeline has been shipping **without any type checking**.
- Verified fix candidates (run inside `frontend/`):
  - `npx tsc -b` → **286 errors**, exit 1. Identical output to `npx tsc -p tsconfig.app.json --noEmit` (byte-identical diff).
  - `npx tsc -p tsconfig.node.json --noEmit` → 0 errors, exit 0 (vite/vitest configs are clean).
  - `tsc -b` writes `.tsbuildinfo` to `node_modules/.tmp/` (already configured via `tsBuildInfoFile`), does NOT pollute the repo.
  - Both `tsconfig.app.json` and `tsconfig.node.json` carry `"composite": true` + `"noEmit": true`, which is the create-vite default and works with `tsc -b`.
- **Lint is also broken**: `pnpm lint` → `ESLint couldn't find a configuration file` (exit 2). There is NO `.eslintrc*` and NO `eslint.config.*` anywhere in `frontend/`. `pnpm lint` currently fails outright, so lint provides zero protection too. Lint does not use `tsc` (it's eslint-only), but it's a second unguarded gate.
- **Vitest does NOT type-check** (esbuild transform only) → `pnpm test` runs (255 passed, 2 failed) despite the 286 TS errors. Tests are green-ish independently of the type layer.

### 2. TypeScript error inventory: 286 errors, `tsc -b` / `tsc -p tsconfig.app.json --noEmit` identical

Run: `cd frontend && npx tsc -b` (or `npx tsc -p tsconfig.app.json --noEmit`).

- **286 total errors** across **46 unique files** (34 production, 12 test-only).
- **118 errors in test files** (`*.test.ts(x)`), **168 in production files**.
- Dominant root cause: the `AppState` interface declares only 3 members (`draftTicketId`, `setDraftTicketId`, `clearDraftTicketId`) while the runtime store implements ~24 actions → **137 errors are `Property X does not exist on type 'AppState'`** + 4 `TS2551` (`updateFeatureFlags` suggestion) + 36 `TS7006` implicit-any params inside `store.ts` itself (the store's own action params have no contextual type because the interface doesn't declare them).

Error-code distribution:

| Code | Count | Meaning |
|------|-------|---------|
| TS2339 | 151 | Property does not exist (137 on AppState; 9 EngineInfo in ScanEngineSelector; 4 recharts chart.tsx; 1 ImageCapture in useCamera) |
| TS6133 | 57 | Declared but never read (unused imports/vars) |
| TS7006 | 40 | Parameter implicitly any (36 in store.ts, 3 chart.tsx, 1 CameraScanFlow) |
| TS6196 | 5 | Declared but never used (locals) |
| TS2551 | 4 | Property does not exist w/ suggestion (all `updateFeatureFlags` on AppState) |
| TS2345 | 4 | Argument not assignable |
| TS2322 | 4 | Type not assignable (3 Uint8ClampedArray generics in preprocessor.ts, 1 canvas mock in useCamera.test) |
| TS6192 | 3 | All imports in import declaration unused |
| TS2459 | 3 | Module declares X locally but not exported (exifHelper.test imports non-exported symbols) |
| TS2307 | 3 | Cannot find module: `cmdk`, `react-resizable-panels`, `exifreader` |
| TS2774 | 2 | Condition always true (fn always defined) |
| TS2741 | 2 | Missing required property `createdAt` (AssignmentEditor creates Person w/o createdAt) |
| TS2503 | 2 | Cannot find namespace `vi` (exifHelper.test) |
| TS2353 | 2 | Object literal only known properties (`_startManual` in HomeView, calendar ClassNames) |
| TS2304 | 2 | Cannot find name (`beforeEach` in preprocessor.test, `setView` in HomeView) |
| TS2367 | 1 | Comparison unintentional (ScanOnboarding status vs 'downloading') |
| TS2344 | 1 | Type does not satisfy constraint (chart.tsx recharts) |

Files with most errors (production): `src/lib/store.ts` (36), `src/components/scan/ScanEngineSelector.tsx` (22), `src/views/GroupsView.tsx` (12), `src/views/OcrReviewView.tsx` (9), `src/components/ticket/TicketItemsEditor.tsx` (9), `src/views/SettingsView.tsx` (8), `src/components/ui/chart.tsx` (8).
Files with most errors (tests): `src/lib/store.test.ts` (60), `src/lib/wizard-loaders.test.ts` (15), `src/components/ticket/TicketItemsEditor.test.tsx` (11), `src/components/ticket/AssignmentEditor.test.tsx` (10), `src/utils/exifHelper.test.ts` (8), `src/views/NewTicketCaptureView.test.tsx` (6).

**Effort estimate per category** — see table below.

### 3. Zustand store: exact AppState divergence (ROOT CAUSE)

`frontend/src/lib/store.ts`:

- **Interface `AppState` (lines 23-38)** declares ONLY: `draftTicketId: ID | null`, `setDraftTicketId(id)`, `clearDraftTicketId()` + `extends AppData` (state fields from `types.ts`).
- **Runtime store (lines 66-367)** implements (inside `create<AppState>()`), NONE of which are in the interface:
  - People: `addPerson(name)`, `updatePerson(id, patch)`, `deletePerson(id)`
  - Groups: `addGroup(name, memberIds?)`, `updateGroup(id, patch)`, `deleteGroup(id)`, `addMemberToGroup(groupId, personId)`, `removeMemberFromGroup(groupId, personId)`
  - Tickets: `addTicket(partial)`, `updateTicket(id, patch)`, `deleteTicket(id)`
  - Items: `addTicketItem(ticketId, item?)`, `updateTicketItem(ticketId, itemId, patch)`, `deleteTicketItem(ticketId, itemId)`
  - Discounts: `addTicketDiscount(ticketId, discount?)`, `updateTicketDiscount(ticketId, discountId, patch)`, `deleteTicketDiscount(ticketId, discountId)`
  - Recalc: `recalcTicket(ticketId)`
  - Profile/settings: `updateProfile(patch)`, `updateSettings(patch)`, `updateFeatureFlags(patch)`, `resetAll()`

- **Divergence #2 (dead runtime actions)**: `SettingsView.tsx:49-50,174,250` calls `exportData()` and `importData()` from the store, but **neither exists in the runtime store NOR in the interface** → latent runtime `TypeError: exportData is not a function` on the "Export/Import backup" buttons (only the `importData` textarea id collides with the action name). These two actions must be implemented or the SettingsView UI must be adjusted.
- **Divergence #3 (ghost view state)**: `HomeView.tsx:17` writes `useAppStore.setState({ _startManual: v })` — `_startManual` is in neither AppData, AppState, nor the runtime store's own state shape, and **nothing ever reads it** (verified: only 1 match in the whole codebase). Dead code from the pre-router view-state refactor.

**Impact of fixing the interface alone**: re-declaring the 24 runtime actions in `AppState` with their real signatures fixes **137 TS2339 + 4 TS2551 + 36 TS7006 = ~177 of 286 errors (~62%)**, including nearly all test-file errors (`store.test.ts` 60, `wizard-loaders.test.ts` 15, ScanEngineSelector, etc.).

### 4. Runtime bug: `setView` in HomeView empty state

`frontend/src/views/HomeView.tsx:134-137`:

```tsx
action={{
  label: 'Crear primer ticket',
  onClick: () => {
      setStartManual(false)
      setView('new-ticket')   // ← ReferenceError: setView is not defined (2×)
    },
}}
```

- `setView` is not defined anywhere in the file (only `navigate`, `setStartManual`, `setShowAll`). Also flagged by tsc: `TS2304: Cannot find name 'setView'` at line 136.
- Confirmed present in committed HEAD (`git show HEAD:frontend/src/views/HomeView.tsx` line 136), not introduced by working-tree changes.
- The other two CTAs (lines 47-70) correctly do `setStartManual(...)` + `navigate('/tickets/new')`.
- **Fix**: replace `setView('new-ticket')` with `navigate('/tickets/new')`, keeping `setStartManual(false)`. Consistent with the hero CTA.
- **No other remnants** of the old view-state system in `frontend/src` (grep `setView|currentView|view state`): only `HomeView.tsx:136` (the bug) and `_startManual` (dead write, HomeView:17). `_startManual` can be removed entirely with the two call sites adjusted, or kept as no-op — recommendation: remove, since nothing consumes it.
- Third latent runtime bug: `exportData`/`importData` missing from store (see #3) — backup export/import buttons in SettingsView would throw.

### 5. Accessibility warnings (inputs without label/id)

Located 17 unlabeled/id-less inputs via `grep "<Input|<input"` (2 in SettingsView have proper `id` + `<Label htmlFor>`: `defaultTax`, `defaultTip`, `importData` — those are fine). The rest:

| File | Inputs | Context | Fix class |
|------|--------|---------|-----------|
| `src/views/GroupsView.tsx:121,214` | 2 | inline rename; "Nuevo grupo" dialog | Trivial: add `id` + `aria-label` (dialog has visible title) |
| `src/views/ContactsView.tsx:121,227` | 2 | inline rename; "Nuevo contacto" dialog | Trivial: add `id` + `aria-label` |
| `src/views/TicketsListView.tsx:92` | 1 | search box w/ Search icon | Trivial: `aria-label="Buscar tickets"` |
| `src/views/NewTicketReviewView.tsx:75` | 1 | title input | Trivial: `aria-label` (label visible would be structural — it's a bordered card) |
| `src/components/people/PeopleGroupsManager.tsx:129,349` | 2 | add-person; "Crear nuevo grupo" dialog | Trivial |
| `src/components/ticket/AssignmentEditor.tsx:617` | 1 | weighted % number input | Trivial: `aria-label` (compact inline) |
| `src/components/ticket/TicketItemsEditor.tsx:310,347,481,489,503` | 5 | discount name/value, item name/qty/price | Trivial: `aria-label` per input |
| `src/components/ui/sidebar.tsx:325` | 1 | SidebarInput wrapper (unused?) | Trivial |
| `src/views/TicketDetailView.tsx:84` | 1 | inline title edit | Trivial: `id`+`aria-label` |

- **Trivial (17/18)**: add `id`/`name` + `aria-label` (or `Label htmlFor` where a visible label makes sense). No structural change needed.
- **Structural-ish (1)**: `NewTicketReviewView` title input — visible label would need a layout tweak; `aria-label` suffices for WCAG AA.
- **Meta tag**: `index.html:36` has deprecated `apple-mobile-web-app-capable`; suggested replacement `mobile-web-app-capable` (keep the apple-* ones, they're still the iOS-correct family; add the standard one).

### 6. OpenSpec convention

- Active OpenSpec store is **`frontend/openspec/`** (no root `openspec/` in the monorepo). Config: `frontend/openspec/config.yaml` (project `spliteat-frontend`, persistence mode `hybrid`).
- Existing changes: `frontend/openspec/changes/{exif-metadata-mapping, new-ticket-6-steps-migration, ocr-review-screen, ticket-image-adjuster, visual-full-migration}/`; archived under `frontend/openspec/changes/archive/` (e.g. `ticket-image-adjuster`).
- Change folders use flat artifact files (`proposal.md`, `design.md`, `tasks.md`, `specs/delta-spec.md` / `specs/spec.md`, `exploration.md`). No `state.yaml` exists for any change yet.
- New change folder created: `frontend/openspec/changes/fix-typecheck-and-runtime/` (this file is its `exploration.md`).

## Affected Areas

- `frontend/package.json` — `build` script (`tsc` → `tsc -b`); `lint` broken (missing eslint config).
- `frontend/src/lib/store.ts` — re-declare all 24 runtime actions in `AppState`; decide on `exportData`/`importData`.
- `frontend/src/lib/types.ts` — only if store signatures need new types; mostly not needed.
- `frontend/src/views/HomeView.tsx` — `setView` → `navigate`; remove `_startManual`.
- `frontend/src/views/SettingsView.tsx` — depends on exportData/importData decision; unused imports.
- `frontend/src/components/scan/ScanEngineSelector.tsx` — `EngineInfo` fields `requiresConnection`/`requiresDownload`/`precision` not in `scan/types.ts` type (9 errors) — either extend type or fix component.
- `frontend/src/components/ui/chart.tsx`, `useCamera.ts` — recharts/ImageCapture typing (minor).
- ~30 files with unused imports (`TS6133`) — mechanical cleanup.
- 12 test files (118 errors) — mostly auto-fixed by AppState declaration; exifHelper.test additionally imports non-exported symbols (`convertDMSToDecimal`, `parseExifDate`, `RawExifResult`) and module `exifreader` (not installed) — test out of sync with implementation.
- `frontend/index.html` — meta tag replacement.
- 9 view/component files for a11y input labels.

## Approaches

1. **Typecheck-gate + full error remediation (Recommended)**
   - Change `build` to `tsc -b && vite build`.
   - Fix the ~286 errors in layers: (a) declare runtime actions in `AppState` (~62%), (b) fix `EngineInfo`, (c) mechanical unused-import cleanup, (d) exifHelper.test sync, (e) chart/useCamera/preprocessor typing.
   - Fix `setView` bug + `exportData`/`importData` + remove `_startManual`.
   - Add eslint config so `lint` actually runs (or disable the broken script).
   - Pros: real type safety restored; release gate becomes meaningful; one coherent change. Cons: largest diff; risk of subtle behavior changes in store typing (but signatures mirror runtime exactly).
   - Effort: High (mostly mechanical; store typing is the only design-sensitive part).

2. **Gate first, remediate incrementally**
   - Change `build` to `tsc -b && vite build` and fix only the build-blocking subset, leaving some errors via `@ts-expect-error`/exclusions temporarily.
   - Pros: gate lands immediately. Cons: ship-then-fix debt; 286 errors can't be cleanly "partially" gated; `--max-warnings 0` style enforcement impossible with exclusions.
   - Effort: Medium.

3. **Separate test typecheck from app typecheck**
   - Keep `tsc -b` for app; exclude `*.test.*` from app tsconfig and add a `tsconfig.test.json` (or `vitest --typecheck`).
   - Pros: smaller prod surface. Cons: tests still broken (118 errors); double config; not addressing root cause.
   - Effort: Low-Medium.

## Recommendation

**Approach 1**, executed in dependency order:

1. Re-declare the 24 runtime actions in `AppState` (store.ts) with exact runtime signatures → kills ~177 errors including all store/wizard/ScanEngineSelector test noise.
2. Decide `exportData`/`importData`: implement them in the store (they're used by SettingsView backup) — small, removes a latent runtime crash.
3. Fix `setView` → `navigate` in HomeView; remove `_startManual` dead code.
4. Mechanical cleanup: unused imports (TS6133/6196/6192), then EngineInfo type, chart.tsx, preprocessor generics, useCamera, ScanOnboarding comparison.
5. Sync exifHelper.test.ts with actual exports (or fix exports) + install/remove `exifreader` dependency decision.
6. Switch `build` to `tsc -b && vite build` and run `tsc -b` to zero in CI as the acceptance gate.
7. a11y: add `id`/`aria-label` to 17 inputs; replace deprecated meta tag.
8. Add eslint config (or remove broken `lint` script) — separate concern, flag to orchestrator.

Vitest is unaffected structurally (no typecheck), but the 2 currently failing tests (`AssignmentEditor.test.tsx` "mode shared normalizes all weights to 1" — expects weight 1, code produces 1/N; "weighted mode number-step +0.5" — store update assertion) and `exifHelper.test.ts` (fails at import: `exifreader` not installed) must be triaged: fix test expectations vs fix code (the shared-mode normalize behavior at `AssignmentEditor.tsx:392-399` computes `1/N`, while the test expects `1` — code and test disagree; decide which is intended, likely the test is stale from the `64a1a54` normalize-assignment-percentages commit).

## Risks

- **Behavioral drift risk in store typing**: if action signatures are declared wrong (e.g. `addTicket` partial shape), errors may hide real call-site mismatches. Mitigation: mirror signatures from runtime exactly, then let remaining TS2345/TS2322 surface call-site bugs.
- **Two currently-failing tests** reveal a code-vs-test disagreement (shared weights 1 vs 1/N) — must be resolved deliberately, not silenced.
- **`exportData`/`importData`** are real missing runtime features: users clicking backup export/import crash today. Scope decision needed (implement vs. hide UI).
- **Lint is broken** with no config — out of the tsc scope but blocks any "lint gate" claim. Needs a decision (add flat config vs. drop script).
- **eslint-plugin-react-hooks / react-refresh** are installed but never configured — same root cause as no eslint config.

## Ready for Proposal

**Yes.** Evidence is complete: root cause (AppState divergence) explains ~62% of the 286 errors; the no-op `tsc` and broken lint mean the release had zero static protection; one runtime bug (`setView`) confirmed in HEAD; two additional latent runtime issues found (`exportData`/`importData` missing, dead `_startManual`). The orchestrator should proceed to Proposal with Approach 1 (typecheck gate + full remediation), and explicitly decide scope for: lint config, `exportData`/`importData`, and the 2 failing AssignmentEditor tests.
