# Proposal: ocr-demo-pipeline

## Intent
Establish a client-side receipt-processing PoC using offline Tesseract.js OCR, local canvas binarization with manual slider controls, and skeletons for IndexedDB (Dexie) and LLM (WebLLM) parsing to lay the groundwork for SplitEat's offline-first capabilities.

## Scope

### In Scope
- **Interactive UI (`DemoOCR.tsx`)**: File uploader, binarized preview canvas, threshold manual slider (default: auto/128), confidence icon, and read-only JSON viewer.
- **Offline OCR Worker (`ocr.worker.ts`)**: Direct Tesseract.js invocation in a web worker thread to prevent main thread blocking.
- **Binarization Helper (`image.utils.ts`)**: Pure canvas image preprocessing functions for contrast optimization (supermarket and restaurant receipts focus).
- **Database Skeleton (`localDB.ts`)**: Basic Dexie.js database schema for tickets, items, and participants.
- **LLM Worker Skeleton (`llm.worker.ts`)**: Placeholder worker generating mock structured JSON from OCR text.

### Out of Scope
- Google Cloud Vision integrations or remote Firebase Functions.
- Live WebLLM local execution or large weight file downloads.
- Real database synchronization or user authentication.

## Capabilities

### New Capabilities
- `offline-ocr-pipeline`: Direct client-side receipt binarization and Tesseract.js text extraction with live UI confidence reporting.
- `local-datastore-skeleton`: Local storage schema initialization using Dexie.js for offline data persistence.
- `llm-parser-skeleton`: Structured JSON parser framework running within a placeholder web worker.

### Modified Capabilities
- None

## Approach
1. Implement pure canvas binarization algorithms in `image.utils.ts`.
2. Configure Tesseract.js worker inside `ocr.worker.ts` for offline text extraction.
3. Build the Dexie DB instance in `localDB.ts` with tables matching our system models.
4. Establish the `llm.worker.ts` structure to accept OCR text and reply with mock receipt JSON.
5. Create the `DemoOCR.tsx` dashboard component and integrate it into the main layout.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `frontend/src/db/localDB.ts` | New | Dexie.js database schemas and client setup. |
| `frontend/src/workers/ocr.worker.ts` | New | Tesseract.js offline OCR thread. |
| `frontend/src/workers/llm.worker.ts` | New | WebLLM mockup parser thread. |
| `frontend/src/workers/image.utils.ts` | New | Canvas-based image thresholding and binarization utilities. |
| `frontend/src/components/DemoOCR.tsx` | New | Main interface for binarization fine-tuning, scan, and JSON preview. |
| `frontend/src/App.tsx` | Modified | Import and route/render the new DemoOCR component. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|-------------|
| Slow WASM startup offline | Medium | Lazy-load Tesseract assets and display progress spinner. |
| Unreadable text on skewed tickets | Medium | Manual slider allows users to adjust binarization contrast interactively. |

## Rollback Plan
Run `git checkout` to discard modified files and delete the new components/workers/db subdirectories.

## Dependencies
- `tesseract.js@5.0.0`
- `dexie@4.0.0`

## Success Criteria
- [ ] Client-side Tesseract.js extracts receipt text offline.
- [ ] Changing binarization slider re-renders canvas immediately.
- [ ] UI shows OCR confidence score and metadata.
- [ ] LLM worker successfully mocks structured JSON receipt layout.
- [ ] Dexie initializes without database schema errors.
