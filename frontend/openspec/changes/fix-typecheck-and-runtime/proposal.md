# Proposal: fix-typecheck-and-runtime

## Intent

- `build` runs `tsc` without `-b` on a solution-style tsconfig → **0 files checked**, releases ship untyped; `tsc -b` reveals **286 errors** (46 files).
- Root cause: `AppState` declares 3 members vs ~24 runtime actions (~62% of errors).
- Broken `pnpm lint` (no config); latent crashes: missing `exportData`/`importData` (SettingsView backup), `setView` ReferenceError (HomeView:136), dead `_startManual`; 17 unlabeled inputs; deprecated meta; 2 stale tests.

## Scope

### In

- Build gate `tsc -b && vite build`; acceptance: 0 errors (prod + tests).
- Fix all 286 errors except `src/utils/exifHelper.test.ts` (EXIF deferred → `tsconfig.app.json` `exclude` + comment; no exifreader install).
- Flat `eslint.config.js` (typescript-eslint v6 + react-hooks + react-refresh; eslint 8.57.1 auto-detects flat config — verified; drop `--ext`, invalid in flat mode). `pnpm lint` passes with `--max-warnings 0`.
- `AppState`: declare 24 actions mirroring runtime signatures; implement `exportData()`/`importData()`.
- HomeView:136 → `navigate('/tickets/new')` (keep `setStartManual(false)`); remove dead `_startManual`.
- Update stale AssignmentEditor tests to 1/N (no logic change).
- A11y: label 17 inputs; add `mobile-web-app-capable` meta (keep apple-*).

### Out

- EXIF/exifreader (deferred; test stays excluded).
- No new features; restored behavior only.
- No eslint/TS upgrade; no tsconfig restructure.

## Capabilities

- **New**: None (refactor/config/fix).
- **Modified**: None (no `openspec/specs/` yet).

## Approach

1. Gate: `build` → `tsc -b && vite build`.
2. Root cause: declare 24 actions in `AppState` (~177 errors gone).
3. Layers: unused imports → EngineInfo → chart/preprocessor/useCamera → remaining tests.
4. Runtime: `exportData`/`importData`; `setView`→`navigate`; remove `_startManual`.
5. Lint: add config; audit react-refresh/exhaustive-deps strictness; remediate.
6. A11y: labels + meta.

## Affected Areas

| Area | Impact |
|------|--------|
| `package.json`, `tsconfig.app.json` | Modified |
| `eslint.config.js` | New |
| `src/lib/store.ts`, `src/views/HomeView.tsx`, `src/views/SettingsView.tsx` | Modified |
| `index.html` | Modified |
| 9 view/component files | Modified (a11y) |
| ~30 prod + 12 test files | Modified (TS cleanup) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Diff >400 lines (46+ files) | High | Forecast in tasks; chain PRs |
| Store typing drift hides call-site bugs | Med | Mirror signatures; let TS2345/2322 surface rest |
| Lint remediation size (max-warnings 0) | Med | Lenient v1 rules; separate workstream |
| Uncommitted in-flight EXIF/radix work overlaps files | Med | Baseline on working tree; coordinate commits |
| exifHelper.test vitest runtime (exifreader missing) | Med | Triage/skip; not a tsc blocker |
| Test update masks regression | Low | Expectations only; 1/N matches `distributeEqually` |

## Rollback Plan

Revert per-commit: build script (1 line), additive interface members, isolated backup code, delete lint config.

## Dependencies

- Uncommitted EXIF work + radix bumps committed/stashed first.
- typescript-eslint v6.21 has no flat presets (verified) → assemble from `configs.recommended.rules`.

## Success Criteria

- [ ] `pnpm build` = `tsc -b && vite build`, 0 errors
- [ ] `pnpm lint` exit 0 (`--max-warnings 0`)
- [ ] `pnpm test` green; stale tests updated to 1/N
- [ ] SettingsView backup works; no `setView`/`_startManual` refs
- [ ] 17 inputs labeled; meta present

## Proposal question round

- Lint strictness: lenient v1 vs full react-refresh/exhaustive-deps? (proposal: lenient v1)
- exifHelper.test: `exclude` vs `@ts-nocheck`? (proposal: `exclude` + comment)
- `_startManual`: remove wrapper + call sites? (proposal: yes)
