# Design: Offline OCR Pipeline Rewrite

## Technical Approach

Replace the single-engine Tesseract.js-only OCR pipeline with a multi-engine pipeline (Tesseract, Tesseract+NER, Florence-2) wrapped inside a single Comlink worker. The orchestrator coordinates the full sequence: load → preprocess → engine selection → OCR → NER → parse → result. Preprocessing runs inside the worker via OffscreenCanvas; the main thread only handles image capture and perspective adjustment.

## Architecture Decisions

### Decision: Single-worker pipeline encapsulation

**Choice**: One Comlink worker (`ocr.worker.ts`) hosts the orchestrator and all engines.
**Alternatives**: Separate workers per engine; main-thread orchestrator dispatching to engine workers.
**Rationale**: Single worker eliminates cross-worker serialization overhead between pipeline stages, matches the existing Comlink pattern, and keeps engine fallback logic local. Engines that manage their own workers (Tesseract.js, Transformers.js) nest inside this worker.

### Decision: OffscreenCanvas for worker-side preprocessing

**Choice**: Adapt `preprocessor.ts` to use `OffscreenCanvas` + `createImageBitmap` inside the worker, with a main-thread fallback path.
**Alternatives**: Run preprocessor on main thread; skip preprocessor and let engines handle their own input.
**Rationale**: The imported engines already call the preprocessor internally. Keeping everything in the worker avoids serializing intermediate image buffers across the worker boundary. OffscreenCanvas has 94%+ browser support (Chrome 69+, Firefox 105+, Safari 16.4+).

### Decision: Default engine = `tesseract-ner`

**Choice**: `tesseract-ner` is the default when no `preferredEngine` is set.
**Alternatives**: Tesseract-only (no NER benefits); Florence-2 (requires 400MB download); server (excluded).
**Rationale**: Matches spec requirement. NER adds merchant/entity extraction without requiring user opt-in, at ~110MB download. Florence-2 requires explicit opt-in due to model size.

## Data Flow

```mermaid
flowchart LR
    A[Image Capture] --> B[Dewarp / Perspective]
    B --> C{Pass to Worker}
    C --> D[Preprocess\nResize · HistEq · Contrast]
    D --> E{Engine Selection}
    E -->|tesseract| F[Tesseract.js OCR]
    E -->|tesseract-ner| G[Tesseract OCR]
    G --> H[NER Inference]
    E -->|florence2| I[Florence-2 VLM]
    F --> J[Receipt Parser]
    H --> J
    I --> J
    J --> K[ScanResult\nTicketItem[]]
    K --> L[useTicketStore]
```

**Type pipeline**: `string` (data URL) → `PreprocessedImage` (data URL) → `OCRWords` (text + bbox + confidence) → `ParsedItems` → `TicketItem[]`

## Module-to-Pipeline Mapping

| Stage | Module | Exported API |
|-------|--------|-------------|
| Load | — | `imageDataUrl: string` via Comlink proxy |
| Preprocess | `preprocessor.ts` | `preprocessReceiptImage()` |
| Engine selection | `orchestrator.ts` | `scanTicket(input, options)` |
| OCR | `tesseract-engine.ts` | `scanWithTesseract()` |
| OCR+NER | `tesseract-ner-engine.ts` | `scanWithTesseractNer()` |
| VLM OCR | `florence-engine.ts` | `scanWithFlorence()` |
| NER | `ner-engine.ts` | `classifyWithNER()` |
| Model mgmt | `model-manager.ts` | Singleton `modelManager` |
| Download | `download-tracker.ts` | `DownloadTracker` class |
| Storage | `storage-manager.ts` | `getStorageInfo()`, `clearModelCaches()` |
| Capabilities | `capabilities.ts` | `detectCapabilities()` |
| Mini-agent | `mini-agent.ts` | `classifyIntent()` |
| Parse | `receipt-parser.ts` | `parseReceiptText()` |

## Worker Strategy

```typescript
// ocr.worker.ts — wraps orchestrator via Comlink
import * as Comlink from 'comlink';
import { scanTicket, enableFlorenceEngine, enableNerEngine } from '../lib/scan/orchestrator';
import type { ScanProgress, ScanResult } from '../lib/scan/types';

const api = {
  async processImage(
    imageSrc: string,
    options: {
      preferredEngine: 'tesseract' | 'tesseract-ner' | 'florence2';
      useMiniAgent?: boolean;
      verboseLogs?: boolean;
    },
    onProgress?: (p: ScanProgress) => void
  ): Promise<ScanResult> {
    if (options.preferredEngine === 'florence2') enableFlorenceEngine();
    if (options.preferredEngine !== 'tesseract') enableNerEngine();
    return await scanTicket(
      { imageDataUrl: imageSrc },
      {
        forceTesseract: options.preferredEngine === 'tesseract',
        forceTesseractNer: options.preferredEngine === 'tesseract-ner',
        useMiniAgent: options.useMiniAgent ?? false,
        engineTimeoutMs: 120_000,
        onProgress,
      }
    );
  }
};
Comlink.expose(api);
export type OCRWorkerType = typeof api;
```

**Preprocessing adaptation**: `preprocessor.ts` uses `new Image()` and `document.createElement('canvas')`. Inside the worker these become:
- `const img = await createImageBitmap(await fetch(url).then(r => r.blob()))`
- `const canvas = new OffscreenCanvas(w, h)`
- `canvas.transferToImageBitmap()` → convert back to data URL via `Blob`

## Engine Selection Logic

| `preferredEngine` | `forceTesseract` | `forceTesseractNer` | Model downloads |
|---|---|---|---|
| `tesseract-ner` (default) | false | true | Tesseract WASM ~5MB + NER ONNX ~110MB |
| `tesseract` | true | false | Tesseract WASM ~5MB only |
| `florence2` | false | false | Florence-2 ONNX ~400MB (opt-in) |

Fallback chain (when `noFallback: false`): `florence2` → `server` (excluded) → `tesseract-ner` → `tesseract`. Each engine gets a configurable timeout (default 120s). If an engine returns 0 items and a higher-ranked engine is available, it auto-fallback.

## Feature Flags

| Flag | Scope | Behavior when enabled | Behavior when disabled |
|------|-------|-----------------------|------------------------|
| `showOcrReview` | UI-only | Shows raw OCR text/image panel in scanner UI | Hide raw output panel; show only structured result |
| `verboseLogs` | Pipeline | `console.log` debug output for each stage | Suppress debug logs |
| `useMiniAgent` | Pipeline | Orchestrator runs `classifyIntent()` on raw OCR text to select best NER model | NER uses default model (`general`); skips mini-agent classification |

All flags are non-blocking — the pipeline completes regardless of flag state.

## Integration with App Store

The pipeline returns `ScanResult` which maps to `useTicketStore`:

| `ScanResult` field | `TicketStoreState` field | Notes |
|---|---|---|
| `items[]` | `finalJson.items` | Array of `{name, quantity, unitPrice}` |
| `merchant` | `finalJson.establishment` | NER-extracted or parsed |
| `total` | `finalJson.totalAmount` | Parsed from receipt |
| `rawText` | `groupedLines` | Split by newline, set in store |
| `engine` | (stored in Dexie ticket record) | Which engine produced the result |

The `DemoOCR.tsx` caller receives `ScanResult`, destructures it, and calls the store setters. The existing `OCRScanner.tsx` mock will be replaced to call the same worker API.

## Exclusions

- **`server-engine.ts`**: NOT copied. The `server` engine is excluded from the `scanTicket` switch-case in the adapted orchestrator. If `preferredEngine` references it, it resolves to `tesseract-ner` as fallback.
- **Camera capture UI**: Out of scope — the existing camera/capture flow in `DemoOCR.tsx` stays unchanged.
- **`llm.worker.ts`**: Replaced by the built-in `receipt-parser.ts` inside the pipeline. The old file is preserved but unused.

## Worker Boundary Summary

```
┌─ Main Thread ──────────────────────────────┐
│  DemoOCR.tsx / OCRScanner.tsx               │
│  ├── loadImage() → data URL                 │
│  ├── flattenReceipt() → dewarp              │
│  ├── show binarized preview (UI only)       │
│  └── Comlink.wrap(ocr.worker)               │
│        └── processImage(dataUrl, opts, cb)  │
│              → Promise<ScanResult>          │
├─ Worker Thread (ocr.worker.ts) ────────────┤
│  Orchestrator (scanTicket)                  │
│  ├── preprocessor.ts (OffscreenCanvas)      │
│  ├── engine selection                       │
│  ├── engine execution (Tesseract/Florence)  │
│  ├── receipt-parser.ts                      │
│  └── return ScanResult                      │
└─────────────────────────────────────────────┘
```

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary. The change is entirely within the browser's Web Worker / Canvas sandbox.

## Migration / Rollback

**No data migration required**. The old `ocr.worker.ts` and `llm.worker.ts` remain in the repo as rollback points. On revert, delete `src/lib/scan/` and restore the two worker files from git.

Rollout order: (1) copy lib/scan modules + adapt imports, (2) rewrite ocr.worker.ts with orchestrator, (3) update DemoOCR.tsx caller, (4) update OCRScanner.tsx, (5) add unit tests, (6) update integration test.

## Open Questions

- [ ] Does the existing `OffscreenCanvas` polyfill strategy need coverage for iOS Safari <16.4?
- [ ] Should `preprocessor.ts` run conditionally when the image is already binarized by the main thread, or does every engine prefer color input?
- [ ] Confirm whether `showOcrReview` should gate `rawText` in the ScanResult or if the component filters it
