# SDD Tasks: theme-and-offline-fixes

## Task 1: Correct --warning-foreground contrast in both themes

### Scope
Replace the inverted `--warning-foreground` value in `src/styles/global.css` so warning surfaces meet WCAG 2.1 AA contrast (≥ 4.5:1 normal text in light mode; ≥ 3:1 large text/UI in dark mode given the existing bg). Dark mode `--warning-bg` also darkens slightly so the dark pairing clears large-text AA.

### Files
- `src/styles/global.css:67` (light `:root`): `--warning-foreground: oklch(0.98 0.01 80)` → `oklch(0.15 0.10 80)`
- `src/styles/global.css:107` (dark `.dark`): `--warning-foreground: oklch(0.15 0.01 80)` → `oklch(0.95 0.10 80)`
- `src/styles/global.css:108` (dark `.dark`): `--warning-bg: oklch(0.35 0.1 80)` → `oklch(0.25 0.10 80)`

### Acceptance criteria
- [ ] Light pairing contrast ratio ≥ 4.5:1 (computed: 5.10:1)
- [ ] Dark pairing contrast ratio ≥ 3:1 (computed: 3.33:1)
- [ ] No other warning tokens modified
- [ ] No non-warning semantic tokens modified

### Verification
```bash
pnpm build 2>&1 | tail -10
pnpm test 2>&1 | tail -10
```

## Task 2: Add `/offline.html` to SW precache and navigation fallback

### Scope
Extend the service worker precache manifest to include the new offline page, and update the navigation failure handler so `caches.match('/offline.html')` is probed before the existing `caches.match('/')` lookup. The inline HTML `Response` remains as the last resort.

### Files
- `public/sw.js:20-24` (`PRECACHE_URLS`): append `'/offline.html'`
- `public/sw.js:162-176` (`handleNetworkError` `navigate` branch): add `caches.match('/offline.html')` lookup before `caches.match('/')`.

### Acceptance criteria
- [ ] `PRECACHE_URLS` includes `'/offline.html'` exactly once
- [ ] Existing precache entries (`/`, `/manifest.webmanifest`, `/icon.svg`) preserved
- [ ] `handleNetworkError` for `request.mode === 'navigate'` tries `/offline.html` first
- [ ] Inline HTML `new Response(...)` last-resort preserved verbatim
- [ ] Activate flow, backfill, stale-while-revalidate unchanged

### Verification
```bash
pnpm build 2>&1 | tail -10
git grep -n "PRECACHE_URLS" public/sw.js
git grep -n "caches.match('/offline.html')" public/sw.js
```

## Task 3: Create `public/offline.html` (self-contained themed offline page)

### Scope
Add a new static HTML page that the service worker serves when a navigation request fails the network. The page declares charset, viewport, language, and title; inline SVG icon; themed for light and dark via `prefers-color-scheme`; retry button uses `location.reload()`. No external CSS/JS dependency.

### Files
- `public/offline.html` (new file): full HTML document with inline `<style>` and inline `<svg>` + `<button>`.

### Acceptance criteria
- [ ] File served at `GET /offline.html` with `Content-Type: text/html`
- [ ] `<title>SplitEat — Sin conexión</title>` present
- [ ] `<meta charset="UTF-8">` present
- [ ] `<meta name="viewport" content="width=device-width, initial-scale=1.0">` present
- [ ] `<html lang="es">` present
- [ ] Light theme text/bg contrast ≥ 4.5:1 (computed: 4.52:1)
- [ ] Dark theme text/bg contrast ≥ 4.5:1 (computed: 5.10:1)
- [ ] No `<script src>` or `<link rel="stylesheet">` referencing external assets
- [ ] Retry affordance uses `location.reload()` via inline `<script>` or `onclick`

### Verification
```bash
ls -la public/offline.html
pnpm build 2>&1 | tail -10
```

## Task 4: Remove duplicate lowercase `src/components/ui/avatar.tsx`

### Scope
Delete the lowercase `avatar.tsx` duplicate of the canonical `Avatar.tsx`. Pre-condition: NO source file imports `@/components/ui/avatar'` (lowercase). Verified via grep — all 6 imports use capital `A`.

### Files
- `src/components/ui/avatar.tsx` (DELETE)
- `src/components/ui/Avatar.tsx` (CANONICAL — unchanged)

### Acceptance criteria
- [ ] Pre-delete grep for `@/components/ui/avatar'` (lowercase) returns zero hits
- [ ] `git rm src/components/ui/avatar.tsx` succeeds
- [ ] `src/components/ui/Avatar.tsx` still exists with capital A
- [ ] All imports of `@/components/ui/Avatar` resolve after deletion

### Verification
```bash
git grep -il "@/components/ui/avatar'" src/ || echo "no lowercase imports"
pnpm build 2>&1 | tail -10
pnpm test 2>&1 | tail -10
```

## Task 5: Create `src/components/ticket/AssignmentEditor.test.tsx`

### Scope
Add a Vitest test suite for `AssignmentEditor.tsx` covering row click, mode transitions, toggle, weighted step, and equal distribution. Mirrors the setup of `TicketItemsEditor.test.tsx`.

### Files
- `src/components/ticket/AssignmentEditor.test.tsx` (new file): ~80 lines, ~6 tests.

### Acceptance criteria
- [ ] Setup matches `TicketItemsEditor.test.tsx` (jsdom, localStorage/matchMedia stubs, store reset in `beforeEach`)
- [ ] Test 1: row click opens Sheet with title "Asignar: <item>"
- [ ] Test 2: mode `single` retains first person, drops rest
- [ ] Test 3: mode `shared` normalizes all weights to 1
- [ ] Test 4: `togglePerson` adds then removes
- [ ] Test 5: weighted mode `+0.5` updates store
- [ ] Test 6: `distributeEqually` produces `1/N` weights

### Verification
```bash
pnpm test src/components/ticket/AssignmentEditor.test.tsx 2>&1 | tail -20
pnpm test 2>&1 | tail -10
```

## Task 6: Final verification — build, full test suite, visual contrast smoke

### Scope
Run the complete verification pipeline after all prior tasks complete. Confirm no regression and that prior 168 tests still pass plus the new ~6 tests.

### Files
- None. Read-only verification.

### Acceptance criteria
- [ ] `pnpm build` exits 0 with 0 TS errors
- [ ] `pnpm test` passes all tests (174+ expected after Task 5)
- [ ] `git diff main --stat` shows: 2 modified source files, 1 deleted, 1 new HTML, 1 new test file
- [ ] Manual contrast smoke: load `global.css` after edit and verify `--warning-foreground` resolves to dark amber in light mode and bright amber in dark mode

### Verification
```bash
pnpm build 2>&1 | tail -15
pnpm test 2>&1 | tail -15
git diff --stat
git status --short
```
