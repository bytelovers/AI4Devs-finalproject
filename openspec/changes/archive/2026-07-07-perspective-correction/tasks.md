# Tasks: perspective-correction

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 250-400 lines |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | None (single PR) |
| Delivery strategy | ask-on-risk |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Mathematical foundation, SVG UI interactive editor, and Vitest test coverage | PR 1 | Targets `main`; contains all dewarping logic and components |

## Phase 1: Mathematical Foundation (image.utils.ts)
- [x] 1.1 Implement Gaussian elimination system solver (`solveGaussian`) in `frontend/src/workers/image.utils.ts`.
- [x] 1.2 Implement `flattenReceipt(imageElement, sourcePoints)` doing inverse mapping with bilinear interpolation in `frontend/src/workers/image.utils.ts`.

## Phase 2: UI Overlay & State (DemoOCR.tsx)
- [x] 2.1 Add `corners` and `isAdjustingPerspective` state in `frontend/src/components/DemoOCR.tsx`, initializing to 10% margins.
- [x] 2.2 Implement interactive SVG overlay on top of the preview image with 4 draggable handles and connected lines in `frontend/src/components/DemoOCR.tsx`.
- [x] 2.3 Implement polygon convexity checking using sign consistency of cross products to block invalid configurations during drag in `frontend/src/components/DemoOCR.tsx`.
- [x] 2.4 Add "Editar Perspectiva" / "Aceptar Ajuste" and "Restablecer" buttons in `frontend/src/components/DemoOCR.tsx`.

## Phase 3: Pipeline Integration (DemoOCR.tsx)
- [x] 3.1 Wire "Aplanar Ticket" action to run `flattenReceipt` (scaling coordinates to natural dimensions), draw on canvas, re-run Otsu binarization, and update preview in `frontend/src/components/DemoOCR.tsx`.

## Phase 4: Testing & Verification
- [x] 4.1 Write Vitest tests in `frontend/src/workers/image.utils.test.ts` for matrix solving, convexity check logic, and flattening calculations.
