# Design: OCR Demo Pipeline

## Technical Approach
Implement client-side receipt-processing PoC with offline Tesseract.js OCR, canvas-based binarization with manual slider controls, and Dexie.js (IndexedDB) + LLM (WebLLM mockup) Web Worker parsing to enable SplitEat's offline-first capabilities.

## Architecture Decisions

### Decision: Canvas Binarization Algorithm
| Option | Tradeoff | Decision |
| :--- | :--- | :--- |
| **Global Thresholding** | Fast, but fails on receipts with uneven lighting or shadows. | Rejected. |
| **Adaptive Thresholding** | Robust to uneven lighting, but computationally expensive. | Rejected for initial MVP. |
| **Otsu Binarization + Manual Slider** | Calculates optimal threshold automatically via Otsu, and allows manual fine-tuning (0–255) for shadows/fades. | **Selected**. Combines auto-calculation with manual override. |

### Decision: Offline OCR Threading
| Option | Tradeoff | Decision |
| :--- | :--- | :--- |
| **Main Thread Execution** | Easy to implement, but blocks the UI during OCR (heavy WASM calculations). | Rejected. |
| **Native Tesseract Worker** | Isolated OCR execution, but makes custom preprocessing and post-processing difficult to orchestrate. | Rejected. |
| **Dedicated Web Worker + Comlink** | Offloads Tesseract lifecycle, image preprocessing, and text grouping from the main thread. Comlink provides RPC. | **Selected**. Custom Worker running Tesseract.js wrapped in Comlink. |

### Decision: Local Storage Setup
| Option | Tradeoff | Decision |
| :--- | :--- | :--- |
| **LocalStorage** | Simple API, but 5MB size limit, string-only, synchronous. | Rejected. |
| **Vanilla IndexedDB** | Standard browser DB, but complex and verbose API. | Rejected. |
| **Dexie.js** | Lightweight IndexedDB wrapper, versioned schemas, promise-based, and type-safe query interface. | **Selected**. Dexie.js version 1 schema. |

### Decision: Heuristic Parsing
| Option | Tradeoff | Decision |
| :--- | :--- | :--- |
| **In-Memory Mock** | Fast, but does not simulate async processing or isolate work. | Rejected. |
| **Full WebLLM Integration** | Real LLM offline, but requires downloading GBs of WASM weights (not suitable for PoC). | Rejected. |
| **Mock LLM Worker + Comlink** | Uses regex/heuristics in a separate thread. Mocks asynchronous LLM parsing and keeps UI responsive. | **Selected**. Isolated mockup worker. |

## Data Flow
```
Uploaded Image ──→ Canvas (Otsu/Slider Binarization in image.utils.ts)
                          │ (ImageData)
                          ▼
                  ocr.worker.ts (Tesseract.js OCR & Line Grouping)
                          │ (Raw Text & Bounding Boxes)
                          ▼
                  llm.worker.ts (Regex/Heuristic Parsing into JSON)
                          │ (Mocked Receipt JSON)
                          ▼
                  useTicketStore.ts (Zustand updates UI & db/localDB.ts)
```

## File Changes
| File | Action | Description |
| :--- | :--- | :--- |
| `frontend/src/db/localDB.ts` | Create | Initializes Dexie database with tables `tickets`, `items`, and `participants`. |
| `frontend/src/workers/ocr.worker.ts` | Create | Web Worker running Tesseract.js for text extraction and Y-coordinate grouping. |
| `frontend/src/workers/llm.worker.ts` | Create | Web Worker mockup parsing raw OCR text into structured JSON. |
| `frontend/src/workers/image.utils.ts` | Create | Preprocessing utility implementing Otsu's binarization. |
| `frontend/src/store/useTicketStore.ts` | Create | Zustand store managing OCR progress, current ticket, and items state. |
| `frontend/src/components/DemoOCR.tsx` | Create | Main UI panel with file upload, binarization slider, canvas, and JSON viewer. |
| `frontend/src/App.tsx` | Create | Standard layout routing navigation to `/demo`. |
| `frontend/src/main.tsx` | Modify | Update rendering entrypoint to import and render `App.tsx`. |

## Interfaces / Contracts

```typescript
// Web Worker Interfaces (Comlink RPC)
export interface OCRResult {
  text: string;
  confidence: number;
  lines: string[];
}

export interface OCRWorkerAPI {
  processImage(imageData: ImageData): Promise<OCRResult>;
}

export interface ReceiptData {
  title: string;
  totalAmount: number;
  items: Array<{ name: string; price: number; quantity: number }>;
}

export interface LLMWorkerAPI {
  parseReceiptText(text: string): Promise<ReceiptData>;
}

// Dexie Schema
export interface Ticket {
  id?: number;
  rawText: string;
  confidence: number;
  totalAmount: number;
  createdAt: Date;
}

export interface Item {
  id?: number;
  ticketId: number;
  name: string;
  price: number;
  quantity: number;
}

export interface Participant {
  id?: number;
  name: string;
}
```

## Testing Strategy
| Layer | What to Test | Approach |
| :--- | :--- | :--- |
| **Unit** | Binarization algorithms in `image.utils.ts` and Zustand state transitions in `useTicketStore.ts`. | Vitest unit tests with mocks for browser API dependencies. |
| **Integration** | Comlink message exchange between main thread and `ocr.worker.ts`/`llm.worker.ts`. | Integration tests wrapping Web Workers using inline workers or mock Comlink channels. |
| **E2E** | Image upload, binarization adjustment, OCR run, and JSON rendering. | Cypress/Playwright tests running the `/demo` page. |

## Migration / Rollout
No database migration is required since this is version 1 of the schema. The `/demo` route will be deployed hidden from public navigation or flag-controlled for developer testing.

## Open Questions
- [ ] How will we cache the Tesseract.js language trained data (`eng.traineddata`) to work fully offline without any CDN fallback?
- [ ] Should we implement perspective correction in `image.utils.ts` in a future iteration to support skewed receipts?
