# Word-Level Parsing Plan — Deterministic Receipt Parser Upgrade

Status: PLANNED (research complete, no implementation yet)
Branch: `research/unit-price-exploration`
Date: 2026-08-06

## 1. Objective

Upgrade the spliteat receipt scanner from a **text-only heuristic parser** to a
**word-level deterministic parser** that uses Tesseract's per-word geometry and
confidence — while keeping the existing text path as the compatibility baseline.

The goal is a reader that works for **any shop**, runs **100% local/offline on
mobile**, adds **zero model weight by default**, and **never invents data**.

## 2. Hard constraints (product decisions, non-negotiable)

| Constraint | Consequence |
|---|---|
| Many different shops | No per-merchant templates/menus as backbone. Structure must be *inferred* per ticket from geometry, not from shop knowledge |
| 100% local offline on mobile | No cloud APIs at runtime. No heavy layout models (Surya/PaddleOCR) in the PWA |
| No model weight by default | BERT (~110MB) / Florence-2 (~400MB) are **user opt-in options** via the existing `ScanEngineSelector`, never an automatic fallback layer. `modelManager` already keeps only one model in RAM |
| Must not invent data | Items whose price appears nowhere (e.g. `8 -CHUP. DON JULIO BLA +`) are surfaced as **unpriced candidates for user confirmation**, never guessed |
| Printed TOTAL is the anchor | Item sums are the hypothesis; only an assignment that reconciles to the printed TOTAL is accepted as `balanced` |

## 3. Key insight

> **The text is the compatibility baseline; the geometry is the upgrade.**

`tesseract-engine.ts` currently discards everything except `result.data.text`
(line 82). Tesseract.js already returns `result.data.lines[].words[]` with
per-word `confidence` (0-100) and `bbox {x0,y0,x1,y1}` — verified against
`tesseract.js@5.1.1` typings. For ragged thermal tickets, **the right edge `x1`
is the stable column signal**, not `x0` (columns drift left/right as paper feeds).

## 4. Design (8 blocks)

### 4.1 Word-level data capture — `page-tokens.ts` (new, pure)

Extract from `result.data.lines[]` (already ordered; no fragile y-clustering):

```ts
interface Token { text: string; confidence: number /*0-100*/; x0: number; y0: number; x1: number; y1: number; isNumeric: boolean }
interface AnnotatedLine {
  index: number; text: string; tokens: Token[]
  yCenter: number; xLeft: number; xRight: number
  role?: 'item' | 'total' | 'subtotal' | 'tax' | 'discount' | 'header' | 'footer' | 'unknown'
  numbers: Token[]           // parse via parseSpanishAmount to (0, 500]
  priceTokens?: { lineTotal?: Token; unit?: Token; qty?: Token; unreadable: Token[] }
  candidates?: LineCandidate[]
}
```

Reconstruct lines from `data.lines` (not the flattened `data.words`); re-sort by
(block order, bbox.y0); keep orphan tokens in an `orphanTokens` array — never
silently dropped. Normalize confidence at the boundary: `pageConfidence01 =
data.confidence / 100` (`ScanResult.confidence` is documented 0-1).

### 4.2 Column classification — `classify-columns.ts` (new, pure)

Shop-agnostic, per-ticket inference (NOT per-merchant):

1. Cluster **`x1` (right edge)** of all price-like tokens page-wide (excluding
   header/footer lines); merge clusters closer than `gap = 0.02 * imageWidth`.
2. Role by ordering: rightmost cluster = **total column**; next left = **unit
   column**; left of that with integer tokens = **quantity column**; non-numeric
   = name column.
3. Per-line assignment with ragged tolerance (`± 2*gap`): token in total band →
   `lineTotal`; next numeric leftward → `unit`; next integer → `qty`.
4. If fewer than 3 numeric tokens exist, disable column logic → text fallback.

### 4.3 Confidence as corruption flag (never a veto)

- Numeric token conf `< 65` → `priceUnreadable = true`, item created with empty
  price for user confirmation (the DON JULIO case — today dropped at
  `receipt-parser.ts:201`).
- Numeric token conf `< 50` → drop from price columns (garbage).
- Name tokens `< 40` → `nameLowConfidence` badge.
- Page confidence `< 0.4` → ticket-level `lowQualityOcr` banner.

### 4.4 Parser integration — `parse-receipt-words.ts` (new, pure)

`parseReceiptText(text)` is left **byte-for-byte unchanged** (same signature,
regexes, 5 fases). New module reuses the 5 fases as skeleton, importing the
regexes/`parseSpanishAmount` as exports only (no behavior change). Each item
line enumerates ≤3 candidates:

- `C0` — column-based from §4.2
- `C1` — text-only: literal output of existing phase-3 heuristic on `line.text`
  (guarantees the enriched path can never do worse than today)
- `C2` — structural: single-price line `{qty:1, unit:price}` or qty-prefix variant

Plug-in point: only `scanWithTesseract` (`tesseract-engine.ts:81-93`); NER and
mini-agent engines inherit automatically (they call `scanWithTesseract`);
Florence-2 has no geometry and stays on the text path.

### 4.5 Constraint reconciliation — `reconcile-total.ts` (new, pure, zero deps)

Constraint: `Σ(selected.lineTotal) + taxAmount − discounts == TOTAL` within
`ε = 0.02` (cent tolerance), TOTAL = printed anchor from phase 2.

Algorithm: subset-sum style DFS with bounds pruning (partial ± min/max remaining
collapse the search — ≥80% of lines have a single column-confident candidate).
Hard budget: `maxNodes = 200_000`, `maxMs = 150`, synchronous in the worker.
Tie-break: max candidate weight, then fewer unreadable lines, then lexicographic.

Outcomes:
- `balanced` — items set from chosen candidates; success banner
- `unreconciled` — best partial, signed `difference` ("suma 2,10 € por debajo"),
  keep C1 heuristic values, flag for review. **Never force a candidate to fit.**

### 4.6 User confirmation flow (grounded in real UI)

- Types: `TicketItem.scanMeta?` (`confidence`, `priceUnreadable`,
  `nameLowConfidence`, `needsConfirmation`, `suggestionSource`, raw tokens);
  `ScanMetadata.reconciliation?`; `ScanResult.annotations?` + `reconciliation`.
- `ItemRow` (`TicketItemsEditor.tsx:463-535`): empty price input + label
  "Precio ilegible en el ticket — escribe el importe" when `priceUnreadable`;
  ⚠ badge when `confidence < 0.65` (AlertCircle already imported).
- `NewTicketReviewView`: banner when `status === 'unreconciled'` reusing
  ScanSuccessBanner/ScanErrorBanner language.
- `NewTicketCaptureView`: map `mergedResult.annotations` → `TicketItem.scanMeta`.
- `reviewLoader` already allows items with empty price (`wizard-loaders.ts:80`)
  — no wizard gating change needed.

### 4.7 Offline model bundling (approach only)

Current: `createWorker('spa', 1, {logger, errorHandler})` pulls traineddata +
worker/core WASM from CDN at runtime (`tesseract-engine.ts:17`). Approach:
bundle `spa.traineddata.gz` (~10MB) in `public/tessdata` with `langPath`, and
worker/core WASM via Vite `?url` imports. Do **not** load eagerly — bundling
only changes *where* bytes come from, never *when*. Gate behind the existing
`ScanEngineSelector` UX. Tesseract (~5MB WASM) stays outside `modelManager`.

### 4.8 Implementation order (each step independently testable)

| # | Step | Gate |
|---|---|---|
| 0 | Freeze baseline: confirm 64 tests in `receipt-parser.test.ts`; add the 2 real tickets as golden fixtures | 64 tests + 2 tickets reproducible |
| 1 | `page-tokens.ts` — extract/validate AnnotatedLine[] from Page-shaped fixtures | unit tests, no runtime change |
| 2 | `classify-columns.ts` — x1 clustering + role bands, ragged/thermal fixtures | unit tests |
| 3 | `reconcile-total.ts` — candidates + solver; property tests (no-match, budget exhaustion, tie-break determinism) | unit tests |
| 4 | `parse-receipt-words.ts` — integrate 1-3 with the 5 fases; parity: identical output to `parseReceiptText` when word data is empty | parity check on integration fixtures |
| 5 | Wire `tesseract-engine.ts` (result.data → parseReceiptWords); keep rawText logging; mocked result.data tests | engine-level tests; the 2 real tickets improve |
| 6 | Extend types + `multiSectionMerger` annotation pass-through | types/store tests green |
| 7 | UI: ItemRow empty-price + badge, review banner, capture mapping | component tests + manual offline flow |
| 8 | Offline bundling + DevTools offline verification | offline page-load test |

Steps 1-4 are pure and free; step 5 is the first behavior-shift point and is
covered by step 4's parity guarantee.

## 5. Expansion strategy — any ticket type (no per-shop templates)

1. **Adaptive column profile**: `x1` clustering infers *how many* numeric
   columns a ticket has (supermarket: qty/unit/DTO/total/IVA-per-line;
   restaurant: qty/unit/total) and assigns roles by order + token type. The same
   algorithm learns the format per ticket; nothing is hardcoded per shop.
2. **Candidates are the expansion mechanism**: each new variant (multi-line
   name/price, weight per 100g, 3x2 offers, per-line discount, mixed VAT
   7/10/21%) is a new *candidate generator*. The universal invariant
   `Σ lines + IVA = printed TOTAL` arbitrates. New variants compete and are
   verified — they never become special-case regexes that break other shops.
3. **Structural line-role classification**: header/footer/item by geometry +
   content (item = name + token in price band; footer = right-aligned numeric,
   no name), not by merchant keywords.
4. **Human-in-the-loop closes the residual**: anything undeterminable
   (unpriced, collapsed columns) → user confirmation. The system works day 1 on
   any ticket: present, never block, never invent.
5. **Labeled corpus by structural category**: supermarket / restaurant / fuel /
   pharmacy… score precision/recall per category; corpus gaps generate new
   candidate generators; user corrections feed the corpus.

**Golden rule**: every new variant enters as *candidate + verification against
TOTAL*; if it does not reconcile, the user confirms and the case enriches the
corpus.

## 6. Compatibility contract

**Unchanged (invariant):** `parseReceiptText` and `parseSpanishAmount` —
signatures, regexes, five-phase behavior. Florence-2 and NER engines stay on the
text path. `ScanResult` existing fields keep semantics. `scanTicket`,
`ocr.worker.ts` processImage/processSections signatures unchanged. Store actions
(`updateTicket`, `updateTicketItem`, `recalcTicket`) unchanged.

**Added (opt-in, additive):** `parseReceiptWords` runs only inside
`scanWithTesseract`; new optional fields `annotations`, `reconciliation`,
`confidence` on `ScanResult`; `scanMeta` on `TicketItem`;
`reconciliation/tokens` on `ScanMetadata`. Nothing removed, renamed, or made
required. Text path remains the fallback whenever word data is absent.

## 7. Open questions (to resolve before/while implementing)

1. **Baseline location**: the 64-test suite lives in this worktree
   (`frontend/src/lib/scan/receipt-parser.test.ts`); the main repo only has the
   21 cases in `ocr-pipeline.integration.test.ts`. Freeze the worktree suite as
   the compatibility contract.
2. **Auto-apply on solver success**: recommend auto-apply when `balanced` +
   unique assignment (banner "precios verificados contra el total"); otherwise
   keep heuristic values + banner.
3. **Confidence canonicalization**: 0-100 raw in token DTO, 0-1 in public types.
4. **Multi-section reconciliation**: prefer trailing-section TOTAL (merger rule
   today) or surface discrepancy as `unreconciled`?
5. **Rollout gating**: ship word-level path as default or behind a dev flag
   until a thermal-receipt corpus regression passes (recommend flag initially).

## 8. Key files map (verified in this exploration)

- `frontend/src/lib/scan/tesseract-engine.ts` — OCR entry; discards word data at
  `:81-93`; CDN worker/lang (`:17`); THE single integration point.
- `frontend/src/lib/scan/receipt-parser.ts` — 5-fase heuristic parser, kept
  unchanged; export regexes/`parseSpanishAmount` for reuse.
- `frontend/src/lib/scan/receipt-parser.test.ts` — 64 tests (worktree baseline).
- `frontend/src/lib/scan/ocr-pipeline.integration.test.ts` — 21 integration
  cases (main repo baseline).
- `frontend/src/lib/scan/types.ts` — `ScanResult` (`:10`, confidence 0-1 `:33`),
  `EngineInfo` (`:79`), multi-section types (`:89-192`).
- `frontend/src/lib/scan/orchestrator.ts` — engine chain + fallback (`:69`),
  mini-agent (`:151`), engine toggles (`:30-47`).
- `frontend/src/lib/scan/capabilities.ts` — `getEngines` (`:108`),
  `getRecommendedEngine` (`:188`).
- `frontend/src/workers/ocr.worker.ts` — Comlink boundary (`:32-130`).
- `frontend/src/lib/scan/florence-engine.ts` — VLM, text-only, `:173`.
- `frontend/src/lib/scan/tesseract-ner-engine.ts` — wraps scanWithTesseract,
  annotations survive spread (`:55-60`).
- `frontend/src/lib/scan/multiSectionMerger.ts` — trailing totals (`:57-71`),
  dedupe by name_unitPrice (`:83`); needs annotation pass-through.
- `frontend/src/lib/scan/model-manager.ts` — one heavy model in RAM.
- `frontend/src/lib/types.ts` — `TicketItem` (`:43`), `ScanMetadata` (`:116`).
- `frontend/src/lib/store.ts` — Zustand partial patches, `recalcTicket` (`:315`).
- `frontend/src/views/NewTicketCaptureView.tsx` — scan flow, persists results +
  scanMetadata (`:164-210`).
- `frontend/src/views/NewTicketReviewView.tsx` — review step hosts
  TicketItemsEditor (`:84`).
- `frontend/src/components/ticket/TicketItemsEditor.tsx` — ItemRow
  (`:463-535`), banners (`:577-613`).
- `frontend/src/lib/wizard-loaders.ts` — `reviewLoader` only requires items
  (`:80`).
- `node_modules/tesseract.js/src/index.d.ts` — authoritative `Page`/`Word`
  shape (words, confidence, bbox, `is_numeric`).
- `exploration/edge_cases.js` — 33-case battery (29 meaningful pass).
- `exploration/SOLUTION_SUMMARY.md` — current implementation status.
