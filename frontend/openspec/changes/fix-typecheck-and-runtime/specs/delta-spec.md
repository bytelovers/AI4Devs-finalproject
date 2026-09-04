# Delta for build-quality

New capability `build-quality` — no `openspec/specs/` exists yet; all requirements below are ADDED by this change. Restores static protection (typecheck + lint) and fixes latent runtime defects in the SplitEat frontend.

## ADDED Requirements

### Requirement: Build gate type-checks before bundling

The `build` script MUST run `tsc -b` then `vite build`; plain `tsc` on a solution-style root (`files: []`) MUST NOT pass the gate.

#### Scenario: Clean build passes

- GIVEN no TypeScript errors in prod or test sources
- WHEN `pnpm build` runs in `frontend/`
- THEN `tsc -b` exits 0 and `vite build` completes

#### Scenario: Type error fails the build

- GIVEN an introduced TypeScript error in a source file
- WHEN `tsc -b` runs in `frontend/`
- THEN it exits non-zero
- AND `vite build` does not run

### Requirement: Typecheck reports zero errors across prod and tests

`tsc -b` MUST report 0 errors for `tsconfig.app.json` (prod + tests) and `tsconfig.node.json`. `src/utils/exifHelper.test.ts` MUST be excluded via `tsconfig.app.json` `exclude` with a comment; `exifreader` MUST NOT be installed.

#### Scenario: Zero errors after remediation

- GIVEN all 286 errors remediated except exifHelper.test.ts
- WHEN `npx tsc -b` runs in `frontend/`
- THEN exit code is 0

#### Scenario: EXIF test excluded and documented

- GIVEN tsconfig.app.json excludes exifHelper.test.ts with a comment
- WHEN `npx tsc -b` runs in `frontend/`
- THEN no errors reference exifHelper.test.ts
- AND `exifreader` is absent from package.json

### Requirement: Lint gate passes with zero warnings

A flat `eslint.config.js` MUST exist. The `lint` script MUST be `eslint . --report-unused-disable-directives --max-warnings 0` (no `--ext`). `pnpm lint` MUST exit 0.

#### Scenario: Lint passes on clean codebase

- GIVEN `eslint.config.js` present and no warnings
- WHEN `pnpm lint` runs in `frontend/`
- THEN exit code is 0

#### Scenario: Warnings fail the gate

- GIVEN a lint warning in the codebase
- WHEN `pnpm lint` runs in `frontend/`
- THEN `--max-warnings 0` makes it exit non-zero

### Requirement: AppState declares all runtime actions

`AppState` MUST declare all 24 runtime actions (people/groups/tickets/items/discounts/recalc/profile/settings/backup) mirroring runtime signatures exactly, eliminating TS2339/TS2551/TS7006 at call sites.

#### Scenario: Store call sites type-check

- GIVEN AppState declares the 24 actions with exact runtime signatures
- WHEN `npx tsc -b` runs in `frontend/`
- THEN no `Property X does not exist on type 'AppState'` errors remain
- AND no implicit-any (TS7006) errors remain in store.ts

#### Scenario: All action domains covered

- GIVEN the AppState declaration
- THEN people, groups, tickets, items, discounts, recalc, profile/settings and backup actions type-check at every call site

### Requirement: Backup export and import work

The store MUST implement `exportData()` returning serializable AppData JSON for download and `importData(json)` restoring AppData after validation. Invalid input MUST fail gracefully without crash or state corruption.

#### Scenario: Export produces downloadable JSON

- GIVEN the SettingsView backup section with export button
- WHEN the user clicks export
- THEN a JSON file with current AppData is downloaded

#### Scenario: Valid import restores state

- GIVEN a valid AppData JSON pasted in the import textarea
- WHEN the user clicks import
- THEN store state matches the imported AppData

#### Scenario: Invalid import degrades gracefully

- GIVEN malformed or non-AppData JSON
- WHEN the user imports it
- THEN an error is surfaced, no crash
- AND existing state remains unchanged

### Requirement: Empty-state CTA navigates without crashing

The HomeView empty-state "Crear primer ticket" MUST call `navigate('/tickets/new')` keeping `setStartManual(false)`. `setView` and the dead `_startManual` wrapper MUST be removed.

#### Scenario: CTA navigates to new ticket

- GIVEN HomeView rendered with no tickets
- WHEN the user clicks "Crear primer ticket"
- THEN the app navigates to `/tickets/new`
- AND no ReferenceError appears in the console

#### Scenario: Dead code removed

- GIVEN the HomeView fix applied
- THEN no `setView` or `_startManual` references remain in `src/`

### Requirement: Test suite passes

`pnpm test` MUST pass with 0 failures. The two stale AssignmentEditor tests MUST be updated to current behavior (shared mode normalizes weights to 1/N) without logic changes.

#### Scenario: Full suite green

- GIVEN AssignmentEditor tests updated to 1/N expectations
- WHEN `pnpm test` runs in `frontend/`
- THEN all tests pass with 0 failed

#### Scenario: Shared-mode expectation matches implementation

- GIVEN shared assignment mode with N participants
- WHEN weights are normalized
- THEN each participant weight equals 1/N

### Requirement: Accessible inputs and web-app meta

The 17 unlabeled inputs MUST have accessible names via `id`/`name`/`aria-label`. `index.html` MUST include `mobile-web-app-capable` while keeping apple-* metas.

#### Scenario: Inputs have accessible names

- GIVEN the 17 flagged inputs across views and components
- WHEN each input's DOM node is inspected
- THEN each has an id/name or aria-label

#### Scenario: Meta tag present

- GIVEN the `index.html` head
- THEN `mobile-web-app-capable` meta exists
- AND apple-* metas remain
