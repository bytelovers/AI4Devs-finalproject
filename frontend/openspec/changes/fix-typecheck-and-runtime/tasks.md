# Tasks: fix-typecheck-and-runtime

## Review Workload Forecast

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

| Field | Value |
|---|---|
| Estimated changed lines | ~470–590 across 47 files |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR-A type layer → PR-B lint → PR-C runtime/a11y |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending — user picks stacked-to-main vs feature-branch-chain before apply |

### Suggested Work Units

| Unit | Goal | PR | Focused test | Runtime harness | Rollback |
|---|---|---|---|---|---|
| 1 | AppState/semantic/mechanical/tests | PR-A | `pnpm exec tsc -b && pnpm test` | vitest on touched tests + backup describe | revert store/types/tests; additive interface |
| 2 | Flat lint config + gate | PR-B | `pnpm lint` | real run, exit 0 | delete eslint.config.js; revert script+deps |
| 3 | Runtime/a11y/build gate | PR-C | `pnpm build` | manual backup, CTA click, a11y pass | revert views/meta/tsconfig/script |

## Frentes

A AppState+backup (store.ts, SettingsView, store.test.ts) · B semantic (EngineInfo, chart, useCamera, preprocessor, ScanOnboarding) · C mechanical TS6133/6192/6196/2307 (~30 files) · D tests · E lint flat · F runtime/a11y/meta/tsconfig/build

## Tasks

- [x] T-01 (A/PR-A; R2,R4) `store.ts`: declare 24 AppState actions mirroring runtime store.ts:66–367 (22 mirrored + exportData/importData), §Interfaces. Done: `tsc -b` 286→~109. Deps: —
- [x] T-02 (A/PR-A; R2,R5) `store.ts`: exportData():string, importData(json):boolean, isValidAppData guard (~20 lines), §Data Flow. Done: tsc store clean. Deps: T-01
- [x] T-03 (A/PR-A; R5,R7) `store.test.ts`: backup describe — round-trip, valid import, invalid input graceful (+40). Done: `pnpm test src/lib/store.test.ts`. Deps: T-02
- [x] T-04 (A/PR-C; R5) `SettingsView.tsx`: `new Blob([exportData()],{type:'application/json'})`; `importData(importText)` — both edits, §Data Flow. Done: tsc + manual. Deps: T-02
- [x] T-05 (B/PR-A; R2) `scan/types.ts` EngineInfo +requiresConnection/requiresDownload/precision; `capabilities.ts` populate 4 entries (**WIP overlap EXIF**). Done: tsc ScanEngineSelector clean. Deps: T-01
- [x] T-06 (B/PR-A; R2) `chart.tsx` recharts v3 (TS2339×4, TS7006×3, TS2344×1). Done: tsc chart clean. Deps: —
- [x] T-07 (B/PR-A; R2) `useCamera.ts` grabFrame cast; `useCamera.test.ts` canvas mock type. Done: tsc + `pnpm test src/hooks/useCamera.test.ts`. Deps: —
- [x] T-08 (B/PR-A; R2) `preprocessor.ts` Uint8ClampedArray generics+unused; `ScanOnboarding.tsx` TS2367 (**WIP overlap EXIF**). Done: tsc both clean. Deps: —
- [x] T-09 (B/PR-A; R2) fix call-site TS2345/2322/2741 (AssignmentEditor createdAt×2, GroupsView, OcrReviewView) at call sites, never loosen interface. Done: tsc leaves only unused/test errors. Deps: T-01
- [x] T-10 (C/PR-A; R2) delete unused imports/vars TS6133/6192/6196/2307 across ~30 files (~120 lines, pure deletions). Done: tsc leaves only test-file errors. Deps: T-09
- [x] T-11 (D/PR-A; R7) `AssignmentEditor.test.tsx`: expectation-only — 1/N `toBeCloseTo(1/2,5)`; +0.05 `toBeCloseTo(0.55,5)`; rename titles (§Tests). Done: `pnpm test src/components/ticket/AssignmentEditor.test.tsx`. Deps: T-09
- [x] T-12 (D/PR-A; R2,R7) `exifHelper.test.ts`: factory `vi.mock('exifreader',()=>({load:vi.fn()}))`; sync imports (RawExifResult from @/lib/types; drop convertDMSToDecimal; drop parseExifDate assertion); stays tsc-excluded (**WIP overlap**). Done: `pnpm test src/utils/exifHelper.test.ts`. Deps: —
- [x] T-13 (D/PR-A; R2,R7) `preprocessor.test.ts`: add `import { beforeEach } from 'vitest'` (TS2304). Done: tsc + test green. Deps: —
- [x] T-14 (E/PR-B; R3) create `eslint.config.js` (ESM) per §Lint verbatim: @eslint/js, globals.browser, ts recommended.rules (no-explicit-any off, no-unused-vars off), react-hooks (exhaustive-deps off), reactRefresh.configs.vite, node-globals block. Done: `pnpm lint` loads config. Deps: —
- [x] T-15 (E/PR-B; R3) `package.json`: lint script `eslint . --report-unused-disable-directives --max-warnings 0` (drop --ext); devDeps @eslint/js@^8.57.1 + globals (**keep WIP radix bumps**). Done: lint gate runs. Deps: T-14
- [x] T-16 (E/PR-B; R3) lint triage: fix trivial; flip noisy rules (react-refresh only-export-components on ui) to off until 0. Done: `pnpm lint` exit 0. Deps: T-15
- [x] T-17 (F/PR-C; R6) `HomeView.tsx`: remove setStartManual wrapper (L17) + 3 call-sites (51/63/135); L136 setView('new-ticket')→navigate('/tickets/new'). Done: grep 0 setView|setStartManual|_startManual in src/; tsc 0. Deps: —
- [x] T-18 (F/PR-C; R2) `tsconfig.app.json`: exclude ["src/utils/exifHelper.test.ts"] + JSONC comment (§Typecheck Config). Done: `tsc -b` exit 0. Deps: T-09..T-13
- [x] T-19 (F/PR-C; R1) `package.json`: build → `tsc -b && vite build` (same file as T-15; base on PR-B branch). Done: `pnpm build` exit 0. Deps: T-18
- [x] T-20 (F/PR-C; R8) `index.html`: add `<meta name="mobile-web-app-capable" content="yes" />`; keep apple-*. Done: grep meta present. Deps: —
- [x] T-21 (F/PR-C; R8) a11y views: GroupsView 121/214, ContactsView 121/227, TicketsListView 92, NewTicketReviewView 75, TicketDetailView 84 — id/aria-label (design table). Done: a11y pass (grep + axe). Deps: —
- [x] T-22 (F/PR-C; R8) a11y components: PeopleGroupsManager 129/349, AssignmentEditor 617, TicketItemsEditor 310/347/481/489/503, sidebar 325 — aria-label. Done: a11y pass. Deps: —

## Task → Requirement Map

| Task | Req | Task | Req | Task | Req |
|---|---|---|---|---|---|
| T-01 | R2,R4 | T-08 | R2 | T-15 | R3 |
| T-02 | R2,R5 | T-09 | R2 | T-16 | R3 |
| T-03 | R5,R7 | T-10 | R2 | T-17 | R6 |
| T-04 | R5 | T-11 | R7 | T-18 | R2 |
| T-05 | R2 | T-12 | R2,R7 | T-19 | R1 |
| T-06 | R2 | T-13 | R2,R7 | T-20 | R8 |
| T-07 | R2 | T-14 | R3 | T-21,22 | R8 |

## Execution Order (topological)

- Wave 1: T-01 (gate-opener) → T-02→T-03→T-04 chain; T-06, T-07, T-08, T-12, T-13 parallel.
- Wave 2: T-05, T-09 after T-01 (shrinks error noise); T-10 after T-09; T-11 after T-09.
- PR-B: T-14→T-15→T-16 sequential. PR-C: T-17, T-20–T-22 parallel; T-04 after T-02; T-18 after type layer; T-19 last.
- Gate per PR: PR-A `tsc -b && pnpm test`; PR-B `pnpm lint`; PR-C `pnpm build`.

## Slices (3 PRs)

- **PR-A type layer** (~40 files, ~300–360 ln): T-01..T-03, T-05..T-13. Kills ~286 tsc errors; backup store + unit tests; stale tests fixed. Base: tracker/feature branch.
- **PR-B lint** (~5 files, ~120–150 ln): T-14..T-16. Flat config + deps + script.
- **PR-C runtime/a11y/build** (~13 files, ~60–80 ln): T-04, T-17..T-22. Backup wiring, HomeView CTA, a11y, meta, tsconfig exclude, build script. Base: PR-B branch (T-15/T-19 same file).
- Step 0: commit/stash EXIF WIP + radix bumps BEFORE branching (ScanOnboarding, ScanEngineSelector, capabilities, exifHelper*, sw.js).

## DoD (global)

- [ ] Baseline: EXIF WIP + radix bumps committed/stashed (design step 0)
- [ ] `pnpm build` (= `tsc -b && vite build`) exit 0
- [ ] `npx tsc -b` exit 0; exifHelper.test.ts excluded + comment; exifreader NOT installed
- [ ] `pnpm lint` exit 0 (`--max-warnings 0`)
- [ ] `pnpm test` green (AssignmentEditor 1/N + 0.05; exifHelper factory mock)
- [ ] SettingsView export/import works; no setView/_startManual refs in src/
- [ ] 17 inputs labeled; mobile-web-app-capable meta present; apple-* kept
- [ ] No WIP overlap regressions (ScanEngineSelector/capabilities/exifHelper not double-fixed)