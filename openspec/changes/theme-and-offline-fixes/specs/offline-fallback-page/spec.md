# Delta Specification: offline-fallback-page

## Purpose
Introduce a dedicated static HTML page at `public/offline.html` that the service worker serves when a navigation request fails the network. Today the user sees either Chrome's native "ERR_INTERNET_DISCONNECTED" diamond or — if the SW claims control first — an unstyled inline HTML string with no `<title>`, no viewport, no charset, no theming, and no retry affordance. The new page provides a self-contained offline UX: viewport-aware layout, app icon, app title, language, light/dark rendering via `prefers-color-scheme`, and an offline-friendly retry CTA without any external JS/CSS dependency.

Page MUST render identically with or without the rest of the SPA available, MUST be a single static file referenced from `public/`, and MUST be precached by the service worker (see `service-worker-precache/spec.md`).

## ADDED Requirements

### REQ-offline-page-exists: Offline page is shipped under public/
The repository SHALL contain `public/offline.html` as a static file served at `GET /offline.html` with `Content-Type: text/html`.
The page MUST be self-contained: no external `<script src>` referencing `/src/` or `/assets/` bundles, no external `<link rel="stylesheet">` referencing application CSS. Inline `<style>` and inline SVG icons are allowed.

#### Scenario: File is served at /offline.html
Given `public/offline.html` is shipped as part of the build artifacts
When the SW receives a navigation request that fails the network
And the SW fetches `/offline.html` from the cache
Then the browser MUST render the page's documented contents (title, heading, retry button, layout).

#### Scenario: No external network dependency for the page itself
Given the user is fully offline
When the offline page renders
Then it MUST NOT attempt to load external stylesheets, scripts, fonts, or icons that require network
And all visuals (icon, layout, theming) MUST be served from the page itself.

### REQ-offline-page-document-metadata: Required HTML metadata
`public/offline.html` MUST declare, at minimum:
- `<title>SplitEat — Sin conexión</title>` (or equivalent app-name-aware title)
- `<meta charset="UTF-8">`
- `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
- `<html lang="es">` to match the application language

#### Scenario: Document declares required meta tags
Given the page's source HTML
When inspected
Then `<title>`, `<meta charset>`, `<meta name="viewport">`, and `<html lang>` MUST be present
And each carries the values defined in this requirement.

### REQ-offline-page-content: Informative content and retry CTA
The page MUST contain (semantically, not only visually):
- A `<main>` element wrapping the user message.
- An `<h1>` heading stating the app is offline (e.g. "Sin conexión").
- A short `<p>` explanation in Spanish (e.g. that the user may connect to the internet and retry).
- An inline retry affordance: either a `<button>` that uses `location.reload()` via an inline `<script>` event listener, OR a same-page `<a href=".">Reintentar</a>` link. Script MUST be limited to retry behavior; MUST NOT pull in the SPA bundle.

#### Scenario: Page communicates offline state and offers retry
Given the offline page is rendered
Then a screen reader MUST identify the page as offline state from the heading alone
And a keyboard-only user MUST be able to activate the retry affordance (button or link) without requiring a pointer device.

### REQ-offline-page-theming: Light and dark rendering via prefers-color-scheme
The page MUST support both light and dark color schemes via the `@media (prefers-color-scheme: dark)` CSS block in its inline `<style>`.
Light and dark palettes SHOULD match the application's `--background` / `--foreground` / `--primary` semantic family (emerald on amber-tinted surface for light, deep navy on emerald-tinted surface for dark), but MUST NOT depend on the SPA's CSS variables being in scope.

#### Scenario: Light scheme renders without inverted or invisible text
Given the OS reports `prefers-color-scheme: light`
When the page renders
Then body text MUST meet WCAG 2.1 AA contrast (≥ 4.5:1 normal text) against its background.

#### Scenario: Dark scheme renders without inverted or invisible text
Given the OS reports `prefers-color-scheme: dark`
When the page renders
Then body text MUST meet WCAG 2.1 AA contrast (≥ 4.5:1 normal text) against its background.

### REQ-offline-page-installation: Precache enrolment
The offline page MUST be referenced from the SW precache manifest exactly once. Adding the page AND installing the SW MUST succeed without user-visible errors under normal load.

#### Scenario: Precache list references /offline.html
Given `public/sw.js` is the installed service worker
When the SW runs `cache.addAll(PRECACHE_URLS)` at install time
Then the list returned MUST contain `'/offline.html'`
And the offline page response MUST be retrievable via `caches.match('/offline.html')` after install completes.
