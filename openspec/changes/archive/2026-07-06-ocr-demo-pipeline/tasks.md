# Tasks: OCR Demo Pipeline

## Review Workload Forecast
- Estimated changed lines: 500-750 lines (7 new files + main.tsx modification).
- 400-line budget risk: High.
- Chained PRs recommended: Yes.
- Suggested split:
  - PR 1: Foundation (db/localDB.ts, workers/image.utils.ts, store/useTicketStore.ts).
  - PR 2: Workers & Routing (workers/ocr.worker.ts, workers/llm.worker.ts, App.tsx router update).
  - PR 3: Components & UI (components/DemoOCR.tsx, wiring and integration).
- Delivery strategy: exception-ok.
- Chain strategy: size-exception.
- Decision needed before apply: No.

## Phase 1: Foundation
- [x] 1.1 Create `frontend/src/db/localDB.ts` with Dexie schema for `tickets`, `items`, and `participants` tables.
- [x] 1.2 Implement Otsu binarization and threshold helper functions in `frontend/src/workers/image.utils.ts`.
- [x] 1.3 Create Zustand store in `frontend/src/store/useTicketStore.ts` to manage OCR status, current ticket data, and items list.

## Phase 2: Workers & Core Processing
- [x] 2.1 Implement Web Worker in `frontend/src/workers/ocr.worker.ts` with Tesseract.js initialization and line-grouping logic.
- [x] 2.2 Create mockup Web Worker in `frontend/src/workers/llm.worker.ts` to parse raw text and return mock structured receipt JSON.

## Phase 3: UI & Routing Integration
- [x] 3.1 Implement "Subir de la Galería" file upload button using HTML file input in `frontend/src/components/DemoOCR.tsx`.
- [x] 3.2 Implement "Tomar Foto" button with mobile device camera capture (`capture="environment"`) or a webcam stream in `frontend/src/components/DemoOCR.tsx`.
- [x] 3.3 Create interactive canvas preview and binarization threshold slider (0-255) in `frontend/src/components/DemoOCR.tsx`.
- [x] 3.4 Display OCR confidence scores, progress indicators, and parsed JSON output in `frontend/src/components/DemoOCR.tsx`.
- [x] 3.5 Update routing in `frontend/src/App.tsx` and `frontend/src/main.tsx` to include and render the `/demo` route.
- [x] 3.6 Modify `package.json` scripts to add portless commands (`dev:portless` and `dev:mobile`) for local HTTPS and mobile testing.

## Phase 4: Verification and Testing
- [x] 4.1 Set up Vitest tests for binarization algorithms in `frontend/src/workers/image.utils.ts`.
- [x] 4.2 Write Vitest unit tests for Zustand state transitions in `frontend/src/store/useTicketStore.ts`.
- [x] 4.3 Verify integration of the full OCR pipeline from image input to JSON parsing using mock workers.

