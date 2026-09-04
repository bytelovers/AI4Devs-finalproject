# Delta: offline-ocr-pipeline

## ADDED Requirements

### Requirement: Pipeline Orchestrator
The system MUST orchestrate the sequence load → preprocess → select engine → OCR → parse → result, exposed via a single `processImage(imageSource)` entry point that returns structured ticket data.

#### Scenario: Full pipeline execution
- GIVEN a valid image source is provided
- WHEN processImage() is called
- THEN the system MUST execute load, preprocess, engine selection, OCR, parse, and result in sequence
- AND the system MUST return structured ticket data on success

#### Scenario: Pipeline failure propagation
- GIVEN an image source that fails during preprocessing
- WHEN processImage() is called
- THEN the system MUST abort the pipeline
- AND the system MUST return an error result with the failure reason

### Requirement: Multi-Engine OCR
The system MUST support three OCR engines: `tesseract` (Tesseract.js), `tesseract-ner` (Tesseract.js + NER), and `florence2` (Florence-2 VLM). The default engine MUST be `tesseract-ner`. Florence-2 MUST be opt-in and never auto-download its model.

#### Scenario: Default engine selection
- GIVEN no preferred engine is configured
- WHEN the orchestrator selects an OCR engine
- THEN the system MUST use `tesseract-ner` by default

#### Scenario: Florence-2 opt-in only
- GIVEN the preferred engine is florence2
- WHEN the orchestrator selects an OCR engine
- THEN the system MUST load `@huggingface/transformers` only when explicitly opted in
- AND the system MUST NOT auto-download the Florence-2 model

### Requirement: Receipt Parser
The system MUST parse raw OCR text output into structured `TicketItem[]` objects containing name, quantity, and price. The parser MUST handle Spanish receipt locale.

#### Scenario: Successful receipt parsing
- GIVEN raw OCR text from a Spanish receipt
- WHEN the receipt parser processes the text
- THEN the system MUST return TicketItem[] with name, quantity, and price populated

#### Scenario: Unparseable OCR output
- GIVEN OCR text with no recognizable receipt structure
- WHEN the receipt parser processes the text
- THEN the system MUST return an empty array
- AND the system MUST log a warning without throwing

### Requirement: NER Extraction
The system MUST identify merchant name, date, line items, and totals from OCR text using Named Entity Recognition.

#### Scenario: Full entity extraction from complete receipt
- GIVEN OCR text containing a complete receipt
- WHEN NER extraction runs
- THEN the system MUST return merchant, date, items, and totals

#### Scenario: Partial extraction from incomplete data
- GIVEN OCR text with partial receipt data
- WHEN NER extraction runs
- THEN the system MUST return only the entities it can identify
- AND the system MUST NOT fail or throw on missing fields

### Requirement: Model Download Manager
The system MUST download and cache WASM-based models in IndexedDB with downloadable progress reporting.

#### Scenario: First-time model download
- GIVEN an OCR engine model is not cached locally
- WHEN the system requires the model
- THEN the system MUST download the model
- AND the system MUST report download progress
- AND the system MUST cache the result in IndexedDB

#### Scenario: Model loaded from cache
- GIVEN an OCR engine model is already cached in IndexedDB
- WHEN the system requires the model
- THEN the system MUST load from cache
- AND the system MUST NOT re-download the model

### Requirement: Capability Detection
The system MUST detect WASM and SIMD support before engine initialization and MUST fall back gracefully when unavailable.

#### Scenario: WASM unsupported browser
- GIVEN WASM is not supported by the browser
- WHEN the system initializes OCR capabilities
- THEN the system MUST disable Tesseract-based engines
- AND the system MUST report the limitation to the caller

### Requirement: Feature Flags
The system MUST support feature flags `showOcrReview`, `verboseLogs`, and `useMiniAgent`. Flags MUST NOT block pipeline execution when disabled.

#### Scenario: Feature flag disables optional behavior
- GIVEN useMiniAgent is false
- WHEN the pipeline executes
- THEN the system MUST skip mini-agent behavior
- AND the pipeline MUST still complete successfully

## MODIFIED Requirements

### Requirement: Image Loading and Preprocessing
The system MUST support canvas-based image loading, dewarping, binarization, resize, and auto-crop. Processing order MUST be: dewarp → binarize → resize → auto-crop.
(Previously: Supported dewarping and binarization only. Resize and auto-crop are new preprocessing steps.)

#### Scenario: Image loading and automatic dewarping handle initialization
- GIVEN a user uploads a receipt image
- WHEN the image is loaded into the canvas
- THEN the system MUST render interactive corner handles at 10% margins

#### Scenario: Adjusting perspective before automatic binarization
- GIVEN the interactive handles are rendered
- WHEN the user applies perspective correction
- THEN the system MUST calculate the automatic binarization threshold on the dewarped canvas
- AND the system MUST draw the thresholded black-and-white preview of the dewarped image on the canvas

#### Scenario: Adjusting manual binarization threshold on dewarped canvas
- GIVEN the dewarped and binarized canvas is rendered in the UI
- WHEN the user adjusts the manual binarization threshold slider
- THEN the system MUST immediately update the binarization threshold
- AND the system MUST redraw the updated black-and-white preview of the dewarped image on the canvas

#### Scenario: Auto-crop and resize after binarization [NEW]
- GIVEN a binarized canvas image
- WHEN the preprocessing pipeline reaches the auto-crop step
- THEN the system MUST crop blank margins
- AND the system MUST resize the image to fit the selected engine's input constraints

### Requirement: Offline OCR Extraction and Grouping
OCR text extraction MUST execute offline via Web Workers using the configured OCR engine. The orchestrator MUST coordinate engine execution inside the worker. The source image MUST be the preprocessed canvas output.
(Previously: OCR executed Tesseract.js only inside a Web Worker. Now the orchestrator selects and coordinates the engine.)

#### Scenario: Multi-engine Web Worker execution [UPDATED]
- GIVEN a preprocessed canvas image and a configured OCR engine
- WHEN the orchestrator initiates OCR in the Web Worker
- THEN the system MUST execute the selected engine inside the worker
- AND the system MUST display a loading indicator with progress

#### Scenario: Y-coordinate line grouping and confidence
- GIVEN raw OCR words with bounding boxes are returned from the worker
- WHEN the scanner groups text blocks sharing overlapping Y-coordinate boundaries
- THEN the system MUST construct single horizontal lines of text
- AND the system MUST display the average confidence percentage in the UI

## REMOVED Requirements

### Requirement: OCRScanner Mock Implementation
OCRScanner.tsx previously returned static mock scan results without executing a real pipeline.
(Reason: Replaced by real pipeline execution via `ocr.worker.ts` with orchestrator.)
(Migration: OCRScanner.tsx now calls the worker via Comlink and receives real pipeline output.)
