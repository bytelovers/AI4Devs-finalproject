# Delta Specification: service-worker-precache

## Purpose
Extend the service worker's precache to include a new offline fallback page and update the navigation failure handler so that the cached `/offline.html` is preferred over both the legacy root-shell fallback and the inline bare-HTML string returned on network error. Today, when the SW serves a `navigate` request that fails the network, it first probes `caches.match('/')` and only falls through to a hand-written HTML string with no `<title>`, charset, or theming. After this delta, the precache list grows by exactly one entry, and the navigation path serves the dedicated offline page whenever it is present in the cache, keeping the inline string only as a final last-resort guard.

## MODIFIED Requirements

### REQ-precache-manifest: Precache manifest contents
The service worker SHALL precache, at install time, the minimal set of static assets required to render an in-shell page and the offline fallback. The list MUST include at least the application root, the web manifest, the application icon, and `/offline.html`.
The service worker SHALL keep the existing stale-while-revalidate fetch strategy for non-navigation requests unchanged.

#### Scenario: Offline HTML is precached on install
Given a freshly registered service worker in `public/sw.js`
When the `install` event handler runs `cache.addAll(PRECACHE_URLS)`
Then the list MUST include `'/offline.html'` as one of its entries
And a subsequent `caches.match('/offline.html')` for the active cache (`cuadra-app-v3` or its successor) MUST resolve to a non-null Response.

#### Scenario: Existing cached assets remain precached
Given the prior precache manifest contained `/`, `/manifest.webmanifest`, and `/icon.svg`
When the precache list is updated for this delta
Then those three entries MUST still be present
And removing any of them is out of scope.

### REQ-navigation-fallback: Navigation failure serves offline page before any string fallback
The service worker SHALL handle network failure for `navigate` requests by preferring a cached `/offline.html` response over the cached root `/` response, and over the inline minimal-HTML string fallback.
The inline HTML string fallback SHALL remain only as a final last-resort when neither cache lookup resolves.

#### Scenario: Offline page wins over cached root on navigation failure
Given the SW is active and `/offline.html` is present in the cache
When a navigation request fails the network (`fetch(...).catch(handleNetworkError)`)
Then the handler MUST first try `caches.match('/offline.html')` and return it when present
And MUST NOT return `caches.match('/')` ahead of the offline page in that case.

#### Scenario: Cached root still serves when offline page is not yet cached
Given `/offline.html` is NOT in the cache (e.g. first install mid-flight, or the user landed on the page before the SW activated)
When a navigation request fails the network
Then the handler MUST fall back to `caches.match('/')` exactly as the prior baseline did
And MUST return the root response when present.

#### Scenario: Inline HTML is the last-resort safety net only
Given neither `/offline.html` nor `/` is present in the cache
When a navigation request fails the network
Then the handler MUST return a `Response` with `Content-Type: text/html` synthesized from the inline minimal-HTML string
And that string path MUST be reachable only when both cache lookups miss.

### REQ-no-install-regression: Existing clients install without regression
The activation flow, including the backfill loop that warms the cache from already-loaded assets, MUST NOT be changed by this delta. Only the precache manifest and the navigation-fallback preference order change.

#### Scenario: activate and claim flow is unchanged
Given a client upgrades from the prior service worker version to the new one
When the `install` and `activate` events fire
Then the precache install MUST succeed for every URL in the list (including the new `/offline.html`)
And the activation cache-cleanup and `clients.claim()` behavior MUST be byte-equivalent to the baseline.

#### Diff
- `public/sw.js`: append `'/offline.html'` to `PRECACHE_URLS`. No other entries removed.
- `public/sw.js` `handleNetworkError` for `request.mode === 'navigate'`: add `caches.match('/offline.html')` ahead of the existing `caches.match('/')` lookup; keep the inline-HTML `new Response(...)` last-resort branch unchanged.
- All other fetch branches, the stale-while-revalidate path, the activate/cleanup logic, and the backfill loop are unchanged.
