# Tasks: Offline OCR Pipeline Rewrite

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~2000-3000 (14 new files, ~3 modified) |
| 400-line budget risk | High |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr (exception-ok) |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: High

## Phase 1: Foundation — Scan Infrastructure

- [ ] 1.1 Create `src/lib/scan/` with scan-specific `types.ts` (`ScanProgress`, `ScanResult`, `OCRWords`, `PreprocessedImage`, engine option types) migrated from `../workspace-previo-import/src/lib/scan/types.ts`
- [ ] 1.2 Migrate `capabilities.ts` — WASM/SIMD detection with `detectCapabilities()`
- [ ] 1.3 Migrate `storage-manager.ts` — IndexedDB model cache with `getStorageInfo()`, `clearModelCaches()`
- [ ] 1.4 Migrate `download-tracker.ts` — `DownloadTracker` class with progress callbacks

## Phase 2: Preprocessing

- [ ] 2.1 Migrate `preprocessor.ts` — canvas dewarp, binarize, resize, auto-crop; adapt for `OffscreenCanvas` + `createImageBitmap` inside worker
- [ ] 2.2 Gap-analysis merge with existing `src/workers/image.utils.ts` if present (or document that no such file exists yet)
- [ ] 2.3 Unit tests for `preprocessor.ts` — verify dewarp, binarize, resize, auto-crop with mock canvas input

## Phase 3: Tesseract Engine

- [ ] 3.1 Migrate `tesseract-engine.ts` — `scanWithTesseract()` using Tesseract.js v5, load WASM from IndexedDB cache
- [ ] 3.2 Migrate `ner-engine.ts` — `classifyWithNER()` for receipt entity extraction (merchant, date, items, totals)
- [ ] 3.3 Migrate `tesseract-ner-engine.ts` — `scanWithTesseractNer()` combining Tesseract OCR + NER inference
- [ ] 3.4 Unit tests for engines — mock Tesseract.js output, verify NER entity extraction, test fallback on empty OCR

## Phase 4: Florence-2 (Opt-in, Feature-Flagged)

- [ ] 4.1 Migrate `florence-engine.ts` — `scanWithFlorence()` via `@huggingface/transformers`, gated behind explicit opt-in
- [ ] 4.2 Wire feature flag in settings: `preferredEngine: 'florence2'` toggles Florence-2 engine (already in `AppData.settings`)

## Phase 5: Parsing & Orchestration

- [ ] 5.1 Migrate `receipt-parser.ts` — `parseReceiptText()` maps OCR output to `TicketItem[]` (name, quantity, unitPrice), handles Spanish locale
- [ ] 5.2 Migrate `mini-agent.ts` — `classifyIntent()` selects best NER model from raw OCR text
- [ ] 5.3 Migrate `model-manager.ts` — singleton `modelManager` for download/load/switch between engine models
- [ ] 5.4 Migrate `orchestrator.ts` — `scanTicket(input, options)` coordinates load → preprocess → engine select → OCR → NER → parse → result with fallback chain

## Phase 6: Worker Integration

- [ ] 6.1 Rewrite `src/workers/ocr.worker.ts` — Comlink-wrapped worker exposing `processImage(dataUrl, opts, onProgress)`, using orchestrator from `src/lib/scan/`
- [ ] 6.2 Update `src/views/OCRScanner.tsx` — replace mock with real `Comlink.wrap()` call to the worker, wire progress and result into `useAppStore`
- [ ] 6.3 Integration test — full pipeline with mock canvas input, verify `ScanResult` items map correctly to store fields

## Phase 7: Build Verification

- [ ] 7.1 Run `tsc --noEmit` — fix type errors across new and modified files
- [ ] 7.2 Run unit tests — all existing + new tests pass
- [ ] 7.3 Run dev build (`vite build` or `pnpm build`) — confirm no bundling errors from Comlink or worker imports
