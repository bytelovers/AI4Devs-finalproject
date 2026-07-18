# Proposal: ocr-pipeline-rewrite

## Intent

Replace the current single-engine Tesseract.js-only OCR pipeline with a multi-engine pipeline supporting Tesseract.js, NER-enhanced extraction, and optional Florence-2 VLM, migrated from the proven external project at `workspace-previo-import/src/lib/scan/`.

## Scope

### In Scope
- Copy 14 scan modules → `frontend/src/lib/scan/` (skip `server-engine.ts`)
- Adapt `@/lib/...` imports to relative paths
- New `ocr.worker.ts` wrapping orchestrator via Comlink
- Florence-2 behind `preferredEngine` flag (opt-in)
- Default engine: `tesseract-ner` (Tesseract.js + NER)
- Merge `image.utils.ts` into `preprocessor.ts`
- `OCRScanner.tsx` uses real pipeline, not mock
- Unit tests: `receipt-parser`, `preprocessor`, `capabilities`
- Integration test with mocked worker

### Out of Scope
- `server-engine.ts` (no server available)
- Camera capture UI (Phase 2), FFmpeg/wasm, server-side OCR

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `offline-ocr-pipeline`: Requirements expand from single Tesseract.js → multi-engine pipeline with orchestrator, NER, and Florence-2.

## Approach

1. Copy scan modules to `frontend/src/lib/scan/`, adapt imports to relative paths, drop `server-engine.ts`.
2. Add `@huggingface/transformers` as optional dep.
3. New `ocr.worker.ts` imports orchestrator, exposes API via Comlink.
4. Update `OCRScanner.tsx` to call worker instead of mock.
5. Existing workers kept as rollback point.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `frontend/src/lib/scan/*.ts` | New | 14 scan pipeline modules (orchestrator, engines, parser, preprocessor, model mgmt) |
| `frontend/src/workers/ocr.worker.ts` | Modified | Rewritten to use orchestrator via Comlink |
| `frontend/src/workers/image.utils.ts` | Modified | Merged into preprocessor or re-exported |
| `frontend/src/views/OCRScanner.tsx` | Modified | Uses real pipeline instead of mock |
| `frontend/package.json` | Modified | Adds `@huggingface/transformers` (optional) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Tesseract.js WASM loading in workers (CORS, CSP) | Medium | Pin CDN paths, test with Vite worker config |
| `@huggingface/transformers` + Florence-2 model is ~400MB | Medium | Feature-flag, lazy import, never auto-download |
| NER model download size (~110MB) | Medium | Show download progress via download-tracker |
| Receipt parser assumes Spanish locale | Low | Matches current project's Spanish receipt target |

## Rollback Plan

`git revert` the migration commit — the old `ocr.worker.ts`, `image.utils.ts`, and `llm.worker.ts` remain intact and untouched. The `lib/scan/` directory can be deleted on revert.

## Dependencies

- `@huggingface/transformers` (optional, Florence-2)
- Tesseract.js (`^5.1.1`) already present
- No external server deps

## Success Criteria

- [ ] All scan modules compile with zero TypeScript errors
- [ ] OCR pipeline runs end-to-end in a Web Worker with real image input
- [ ] `npm run build` succeeds
- [ ] Unit tests pass for receipt-parser, preprocessor, capabilities
- [ ] Integration test passes with mocked worker
