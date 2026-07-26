# Tasks: Ticket Image Adjuster (`ticket-image-adjuster`)

## Workload Forecast & Architecture Metadata

| Parameter | Value |
|---|---|
| **Change ID** | `ticket-image-adjuster` |
| **Tasks Document Path** | `openspec/changes/ticket-image-adjuster/tasks.md` |
| **Specification Ref** | `openspec/changes/ticket-image-adjuster/specs/spec.md` |
| **Design Document Ref** | `openspec/changes/ticket-image-adjuster/design.md` |
| **Proposal Ref** | `openspec/changes/ticket-image-adjuster/proposal.md` |
| **Estimated changed lines** | ~750 - 950 lines across 8 files |
| **400-line budget risk** | **High** |
| **Chained PRs recommended** | **Yes** (PR 1: Models & Assessor Engine, PR 2: Preprocessor & Multi-Section Merger, PR 3: UI Component & Worker/View Integration) |
| **Persistence Strategy** | **Hybrid Persistence**: Live canvas edits & real-time quality metrics held in transient React/Zustand session state; final quality metrics summary (`QualityAssessmentSummary`) & crop adjustments saved into draft ticket scan metadata (`ScanMetadata`) in IndexedDB / local storage. |

---

## Phase 1: Data Models & Interface Extensions (`types.ts`)

### Task 1.1: Define Image Adjuster & Quality Assessor Types (TDD Red-Green)
- **Target Files**: `src/lib/scan/types.ts`, `src/lib/types.ts`
- **Test File**: `src/lib/scan/types.test.ts`
- **TDD Workflow**:
  - 🔴 **Red**: Write type assertion test verifying interfaces `NormalizedCropRect`, `CropSection`, `ResolutionPreset`, `ResolutionConfig`, `ImageQualityMetrics`, `QualityAssessmentSummary`, `ImageAdjustmentOptions`, `PreprocessedSection`, `MultiSectionPreprocessResult`, `SectionOcrPayload`, and `MergedTicketScanResult` compile and satisfy required property types. Run `pnpm test` (fails due to missing types).
  - 🟢 **Green**: Add interface and type definitions in `src/lib/scan/types.ts`. Extend `ScanMetadata` in `src/lib/types.ts` with `qualitySummary?: QualityAssessmentSummary`, `sectionCount?: number`, and `adjustmentsSummary?: Object`. Verify clean compilation with `pnpm test`.
  - 🔵 **Refactor**: Export all new type interfaces from `src/lib/scan/index.ts` barrel file.

- [x] **T1.1**: Define data structures (`NormalizedCropRect`, `CropSection`, `ResolutionConfig`, `ImageQualityMetrics`, `QualityAssessmentSummary`, `ImageAdjustmentOptions`, `PreprocessedSection`, `MultiSectionPreprocessResult`, `MergedTicketScanResult`) in `src/lib/scan/types.ts` and extend `ScanMetadata` in `src/lib/types.ts`.

---

## Phase 2: Image Quality Assessor Engine (`imageQualityAssessor.ts`)

### Task 2.1: Implement Blur Detection via Laplacian Variance (TDD Red-Green)
- **Target File**: `src/lib/scan/imageQualityAssessor.ts`
- **Test File**: `src/lib/scan/imageQualityAssessor.test.ts`
- **TDD Workflow**:
  - 🔴 **Red**: Create `imageQualityAssessor.test.ts`. E.g., test `computeLaplacianVariance` with a high-contrast synthetic edge buffer (returns score $\ge 200.0$) versus a uniform/blurred matrix (returns score $< 50.0$). Run `pnpm test` (fails: module not found).
  - 🟢 **Green**: Implement RGBA to grayscale conversion and discrete 2D Laplacian kernel convolution ($K = [[0,1,0],[1,-4,1],[0,1,0]]$) in `computeLaplacianVariance(gray, width, height)`. Verify tests pass.
  - 🔵 **Refactor**: Optimize loop indexing and memory allocations for pixel array traversal.

- [x] **T2.1**: Implement `computeLaplacianVariance` in `src/lib/scan/imageQualityAssessor.ts` with unit tests for sharp vs. blurry matrices in `src/lib/scan/imageQualityAssessor.test.ts`.

### Task 2.2: Implement Contrast, Brightness, and Character Height Metrics (TDD Red-Green)
- **Target File**: `src/lib/scan/imageQualityAssessor.ts`
- **Test File**: `src/lib/scan/imageQualityAssessor.test.ts`
- **TDD Workflow**:
  - 🔴 **Red**: Add unit tests for `computeRmsContrast(gray, meanLuminance)` measuring RMS luminance contrast ratio, mean luminance brightness score $\mu_Y$, and `estimateCharacterHeight(gray, width, height)`. Run `pnpm test` (fails: functions undefined).
  - 🟢 **Green**: Implement `computeRmsContrast` ($C_{\text{rms}} = \sqrt{\frac{1}{N} \sum (Y_i - \mu_Y)^2}$) and vertical luminance profile analyzer for text character height estimation. Verify tests pass.
  - 🔵 **Refactor**: Extract mean luminance helper to reduce duplicated pixel iterations.

- [x] **T2.2**: Implement `computeRmsContrast` and character height estimation algorithms in `src/lib/scan/imageQualityAssessor.ts`.

### Task 2.3: Implement High-Level `assessImageQuality` Engine (TDD Red-Green)
- **Target File**: `src/lib/scan/imageQualityAssessor.ts`
- **Test File**: `src/lib/scan/imageQualityAssessor.test.ts`
- **TDD Workflow**:
  - 🔴 **Red**: Add test cases for `assessImageQuality`:
    - Optimal clear image returns status `'optimal'` and badge `"✅ Calidad de imagen óptima para OCR"`.
    - Blurry image ($\text{Var}(L) < 100.0$) returns status `'warning_blur'` and warning `"⚠️ Imagen borrosa - Te recomendamos repetir la foto"`.
    - Dark image ($\mu_Y < 60$) returns status `'warning_dark'` and warning `"⚠️ Imagen muy oscura / bajo contraste - Ajusta el brillo o repite la foto"`.
    - Low contrast image ($C_{\text{rms}} < 25.0$) returns status `'warning_low_contrast'`.
  - 🟢 **Green**: Implement `assessImageQuality(imageData, config)` returning `ImageQualityMetrics`. Verify all status flags and Spanish UI message banners match specifications.
  - 🔵 **Refactor**: Ensure configurable thresholds (`QualityAssessorConfig`) default gracefully.

- [x] **T2.3**: Implement `assessImageQuality` and status/banner decision matrix in `src/lib/scan/imageQualityAssessor.ts`.

---

## Phase 3: Canvas Preprocessor Engine Expansion (`preprocessor.ts`)

### Task 3.1: Implement Adaptive Integral Image Binarization (TDD Red-Green)
- **Target File**: `src/lib/scan/preprocessor.ts`
- **Test File**: `src/lib/scan/preprocessor.test.ts`
- **TDD Workflow**:
  - 🔴 **Red**: Add unit tests for `applyAdaptiveThreshold` processing a grayscale buffer with background shadows and local text contrasts. Verify output buffer contains binary pixels ($0$ or $255$). Run `pnpm test` (fails: function missing).
  - 🟢 **Green**: Implement Bradley-Roth adaptive binarization using integral image prefix sums ($O(N)$ running time) to compute local neighborhood means. Verify test assertions pass.
  - 🔵 **Refactor**: Reuse typed array buffers (`Uint32Array` integral image) to eliminate GC overhead.

- [x] **T3.1**: Implement `applyAdaptiveThreshold` in `src/lib/scan/preprocessor.ts` with unit tests for shadow suppression in `src/lib/scan/preprocessor.test.ts`.

### Task 3.2: Implement Resolution Auto-Detection & Scale Calculation (TDD Red-Green)
- **Target File**: `src/lib/scan/preprocessor.ts`
- **Test File**: `src/lib/scan/preprocessor.test.ts`
- **TDD Workflow**:
  - 🔴 **Red**: Add unit tests for `calculateOptimalCropScale`:
    - Sub-100px crop region automatically calculates super-sampling multiplier ($S_{\text{auto}} \ge 1.5\times$) to preserve minimum $32\text{px}$ font height.
    - Presets (`1080p`, `1280px`, `1600px`, `2048px`, `native`) clamp maximum output dimensions.
    - Effective DPI calculation returns target estimate ($\sim 300 \text{ DPI}$).
  - 🟢 **Green**: Implement `calculateOptimalCropScale(sourceWidth, sourceHeight, cropRect, config)`. Verify scale factor and output bounds logic.
  - 🔵 **Refactor**: Clean up scaling boundary calculations and edge-case handling for tiny crop rectangles.

- [x] **T3.2**: Implement `calculateOptimalCropScale` in `src/lib/scan/preprocessor.ts`.

### Task 3.3: Implement Multi-Section Preprocess Pipeline `preprocessMultiSectionReceipt` (TDD Red-Green)
- **Target File**: `src/lib/scan/preprocessor.ts`
- **Test File**: `src/lib/scan/preprocessor.test.ts`
- **TDD Workflow**:
  - 🔴 **Red**: Add tests for `preprocessMultiSectionReceipt(imageDataUrl, adjustments)` verifying:
    - Multiple section crop bounding boxes produce distinct data URLs in `MultiSectionPreprocessResult.sections`.
    - Brightness gain/offset, contrast adjustments, grayscale, and adaptive binarization are applied in sequence.
  - 🟢 **Green**: Implement HTML5 Canvas pipeline handling crop slicing, color transformation, adaptive binarization, and scaling. Verify preprocessor unit test suite.
  - 🔵 **Refactor**: Standardize Canvas context lifecycle cleanup to prevent memory leaks during high-res operations.

- [x] **T3.3**: Implement `preprocessMultiSectionReceipt` in `src/lib/scan/preprocessor.ts`.

---

## Phase 4: Multi-Section OCR Merger Engine (`multiSectionMerger.ts`)

### Task 4.1: Implement Payload Synthesis, Ordering & Header/Total Isolation (TDD Red-Green)
- **Target File**: `src/lib/scan/multiSectionMerger.ts`
- **Test File**: `src/lib/scan/multiSectionMerger.test.ts`
- **TDD Workflow**:
  - 🔴 **Red**: Create `multiSectionMerger.test.ts`. Add test cases for `mergeMultiSectionOcrResults`:
    - Sorts line items sequentially by section `order` field.
    - Isolates merchant header and date from Section 1 (order 1).
    - Isolates subtotal, tax rate, tax amount, and total from trailing Section N.
  - 🟢 **Green**: Implement `mergeMultiSectionOcrResults(payloads, qualitySummary)`. Verify order sorting and metadata extraction logic.
  - 🔵 **Refactor**: Separate section metadata parsing from line item extraction.

- [x] **T4.1**: Implement `mergeMultiSectionOcrResults` section ordering and header/total extraction in `src/lib/scan/multiSectionMerger.ts`.

### Task 4.2: Implement Overlapping Duplicate Item Deduplication & Quality Log (TDD Red-Green)
- **Target File**: `src/lib/scan/multiSectionMerger.ts`
- **Test File**: `src/lib/scan/multiSectionMerger.test.ts`
- **TDD Workflow**:
  - 🔴 **Red**: Add test cases for duplicate items detected across overlapping crop section boundaries (combines quantities based on normalized item key match) and verification that `qualitySummary` is attached to `MergedTicketScanResult`.
  - 🟢 **Green**: Implement item deduplication Map logic (`${name.toLowerCase()}_${unitPrice}`) and confidence averaging. Verify test suite pass.
  - 🔵 **Refactor**: Export merger helper functions for isolated testing.

- [x] **T4.2**: Implement duplicate item deduplication and quality summary logging in `src/lib/scan/multiSectionMerger.ts`.

---

## Phase 5: TicketImageAdjuster UI Component (`TicketImageAdjuster.tsx`)

### Task 5.1: Build Base Layout, Preview Viewport & Adjustment Controls (TDD Red-Green)
- **Target File**: `src/components/camera/TicketImageAdjuster.tsx`
- **Test File**: `src/components/camera/TicketImageAdjuster.test.tsx`
- **TDD Workflow**:
  - 🔴 **Red**: Create `TicketImageAdjuster.test.tsx` using React Testing Library (RTL). Test that rendering component displays preview canvas, brightness slider, contrast slider, grayscale toggle, binarization toggle, and resolution preset selector. Run `pnpm test` (fails: component missing).
  - 🟢 **Green**: Build `TicketImageAdjuster` component structure with responsive mobile control toolbar and preview canvas viewport. Verify RTL query assertions.
  - 🔵 **Refactor**: Ensure touch controls use touch-friendly $44\times 44\text{px}$ hitboxes per mobile ergonomic specs.

- [x] **T5.1**: Build `TicketImageAdjuster` base UI component layout and filter controls in `src/components/camera/TicketImageAdjuster.tsx`.

### Task 5.2: Integrate Interactive Multi-Section Crop Viewport & Reset Action (TDD Red-Green)
- **Target File**: `src/components/camera/TicketImageAdjuster.tsx`
- **Test File**: `src/components/camera/TicketImageAdjuster.test.tsx`
- **TDD Workflow**:
  - 🔴 **Red**: Add RTL tests:
    - Tapping "Agregar Sección" creates a second crop bounding box with index badge `[2]`.
    - Active crop section renders primary border styling; inactive sections render muted outlines.
    - Tapping "Restablecer" resets brightness to 0, contrast to 1.0, toggles to false, and crop box to 100% full image.
  - 🟢 **Green**: Implement crop handle touch interaction handlers, section manager state (`sections: CropSection[]`), and single-tap reset action. Verify tests pass.
  - 🔵 **Refactor**: Extract CropBoundingBox overlay into internal helper sub-component.

- [x] **T5.2**: Implement interactive multi-section crop handles and reset functionality in `TicketImageAdjuster.tsx`.

### Task 5.3: Integrate Real-Time Quality Assessor & Warning Banners (TDD Red-Green)
- **Target File**: `src/components/camera/TicketImageAdjuster.tsx`
- **Test File**: `src/components/camera/TicketImageAdjuster.test.tsx`
- **TDD Workflow**:
  - 🔴 **Red**: Add RTL tests for quality feedback banners:
    - Clear image displays optimal quality badge `"✅ Calidad de imagen óptima para OCR"`.
    - Blurry image displays warning banner `"⚠️ Imagen borrosa - Te recomendamos repetir la foto"` with "Repetir foto" action button.
    - Dark image displays warning banner `"⚠️ Imagen muy oscura / bajo contraste - Ajusta el brillo o repite la foto"` with "Auto-Ajustar" action button.
    - Tapping "Auto-Ajustar" automatically sets brightness +25, contrast 1.4, and binarization on.
    - Clicking "Confirmar" invokes `onConfirm(dataUrl, options)` with full `ImageAdjustmentOptions` payload including transient `qualityMetrics`.
  - 🟢 **Green**: Implement throttled (100ms) canvas evaluation call to `assessImageQuality` and dynamic UI warning banners. Verify all RTL component assertions.
  - 🔵 **Refactor**: Export `TicketImageAdjuster` from `src/components/camera/index.ts`.

- [x] **T5.3**: Integrate real-time quality assessor evaluation, dynamic warning banners, and confirmation handler in `TicketImageAdjuster.tsx`.

---

## Phase 6: OCR Worker & Store Integration

### Task 6.1: Extend Comlink Worker for Batch Section Processing (TDD Red-Green)
- **Target File**: `src/workers/ocr.worker.ts`
- **Test File**: `src/workers/ocr.worker.test.ts` (or mock worker test)
- **TDD Workflow**:
  - 🔴 **Red**: Add worker test for `processSections(sections, options, onProgress)` expecting array of `SectionOcrPayload` and section-tagged progress callbacks (`{ sectionId: 'sec_1', percent: 45, message: 'Escaneando sección 1...' }`).
  - 🟢 **Green**: Update `src/workers/ocr.worker.ts` API to export `processSections` alongside existing `processImage`.
  - 🔵 **Refactor**: Keep backwards compatibility for legacy single-image OCR calls.

- [x] **T6.1**: Extend Comlink worker in `src/workers/ocr.worker.ts` with `processSections` batch execution.

### Task 6.2: Update Zustand Store for Hybrid Persistence (TDD Red-Green)
- **Target File**: `src/lib/store.ts`
- **Test File**: `src/lib/store.test.ts`
- **TDD Workflow**:
  - 🔴 **Red**: Add store unit tests verifying that draft ticket creation preserves transient quality metrics during scan and persists `qualitySummary` & `adjustmentsSummary` into `Ticket.scan` (`ScanMetadata`) upon ticket save.
  - 🟢 **Green**: Update `useAppStore` draft ticket update logic in `src/lib/store.ts`.
  - 🔵 **Refactor**: Verify local storage / IndexedDB draft persistence compatibility.

- [x] **T6.2**: Update `useAppStore` in `src/lib/store.ts` to support hybrid persistence of `QualityAssessmentSummary`.

---

## Phase 7: Wizard State Machine Integration in `NewTicketCaptureView.tsx`

### Task 7.1: Add Dedicated `adjust` State & Mount Adjuster Screen (TDD Red-Green)
- **Target File**: `src/views/NewTicketCaptureView.tsx`
- **Test File**: `src/views/NewTicketCaptureView.test.tsx`
- **TDD Workflow**:
  - 🔴 **Red**: Add integration tests in `NewTicketCaptureView.test.tsx`:
    - Capturing a photo or uploading a file transitions phase state from `'capture'` to `'adjust'`.
    - `TicketImageAdjuster` screen mounts with captured image data.
    - Tapping "Retake Photo" returns phase state to `'capture'`.
  - 🟢 **Green**: Expand `CapturePhase` union type (`'capture' | 'adjust' | 'scanning' | 'complete' | 'error'`) and render `<TicketImageAdjuster>` step in `NewTicketCaptureView.tsx`.
  - 🔵 **Refactor**: Modularize view phase rendering functions.

- [x] **T7.1**: Integrate `'adjust'` state in `NewTicketCaptureView.tsx` state machine and mount `TicketImageAdjuster`.

### Task 7.2: Wire Preprocessor, Worker Batch Execution, Merger Engine & Store (TDD Red-Green)
- **Target File**: `src/views/NewTicketCaptureView.tsx`
- **Test File**: `src/views/NewTicketCaptureView.test.tsx`
- **TDD Workflow**:
  - 🔴 **Red**: Add end-to-end integration test:
    - User confirms image adjustments in `TicketImageAdjuster`.
    - View calls `preprocessMultiSectionReceipt`, passes output to `ocrWorker.processSections`, synthesizes result with `mergeMultiSectionOcrResults`, persists ticket with `qualitySummary` in `useAppStore`, and transitions to `'complete'` / `'ocr-review'`.
  - 🟢 **Green**: Connect full execution sequence in `NewTicketCaptureView.tsx`. Verify end-to-end scan wizard test suite.
  - 🔵 **Refactor**: Add error boundaries and fallback handling for worker failures.

- [x] **T7.2**: Connect preprocessor pipeline, worker batch execution, merger engine, and hybrid persistence in `NewTicketCaptureView.tsx`.

---

## Phase 8: Final Verification & Quality Gate

### Task 8.1: Complete Suite Verification & Build Check
- **Commands**:
  - `pnpm test`
  - `pnpm build`
- **Verification Criteria**:
  - [x] All unit and RTL integration tests pass across `imageQualityAssessor.test.ts`, `preprocessor.test.ts`, `multiSectionMerger.test.ts`, `TicketImageAdjuster.test.tsx`, and `NewTicketCaptureView.test.tsx`.
  - [x] TypeScript compilation (`pnpm build`) succeeds without any type errors or warnings.
  - [x] No regression on existing single-crop scan wizard tests.

- [x] **T8.1**: Run `pnpm test` and `pnpm build` to confirm 100% green test suite and clean production build.
