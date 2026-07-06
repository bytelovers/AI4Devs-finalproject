# Technical Design: Perspective Correction

This document outlines the technical design for client-side perspective correction (dewarping) of receipts using a custom 3x3 homography matrix solver, bilinear interpolation, and a real-time convex geometric validator.

## 1. Architectural Decisions

| Decision | Selected Option | Rationale |
| :--- | :--- | :--- |
| **Solver Algorithm** | Gaussian Elimination with partial pivoting | Solves the 8x8 system of equations to compute the 3x3 homography matrix without OpenCV.js or heavy external libraries. |
| **Pixel Reconstruction** | Inverse mapping with Bilinear Interpolation | Maps destination coordinates back to source fractional pixels, interpolating R, G, B, and A channels for high-quality text OCR. |
| **Interactive Overlay** | SVG with Normalized Corners `[0, 1]` | Storing corners in normalized coordinate space ensures resizing adaptability across viewport and device changes. |
| **Geometric Validation** | Real-time cross-product sign consistency check | Ensures the 4 corners form a convex, non-self-intersecting quad. Drag is blocked if any vertex violates convexity. |

## 2. Data Flow

```text
  [Original Image]
         |
         v (Rendered in UI)
  [SVG Overlay] <--- (Draggable handles in normalized [0, 1] coordinates)
         |
         v ("Aplanar Ticket" triggers scaling to naturalWidth/Height)
  [flattenReceipt] ---> (Solves homography A * h = B via Gaussian elimination)
         |
         v (Inverse maps & Bilinear Interpolates pixels)
  [Dewarped Canvas]
         |
         v (Otsu threshold computation & Binarization)
  [Binarized Canvas] -> [OCR Pipeline]
```

## 3. Interfaces & Data Types

In `frontend/src/workers/image.utils.ts`:

```typescript
export interface Point {
  x: number; // Normalized [0, 1] or absolute pixel coordinate
  y: number; // Normalized [0, 1] or absolute pixel coordinate
}

/**
 * Performs client-side perspective correction on an HTMLImageElement or HTMLCanvasElement.
 * @param imageElement Source image or canvas.
 * @param sourcePoints 4 source corner points in absolute image coordinates [TL, TR, BR, BL].
 */
export function flattenReceipt(
  imageElement: HTMLImageElement | HTMLCanvasElement,
  sourcePoints: [Point, Point, Point, Point]
): HTMLCanvasElement;
```

In `frontend/src/components/DemoOCR.tsx` state:
- `corners`: `Point[]` representing `[TL, TR, BR, BL]` in normalized coordinate space `[0, 1]`. Default margins at 10%:
  - TL: `{ x: 0.1, y: 0.1 }`
  - TR: `{ x: 0.9, y: 0.1 }`
  - BR: `{ x: 0.9, y: 0.9 }`
  - BL: `{ x: 0.1, y: 0.9 }`

## 4. Component & Logic Details

### 4.1. Homography Solver & Bilinear Interpolation
- **Dimension Calculation**: Output width and height are calculated as:
  $$ W = \max(dist(TL, TR), dist(BL, BR)) $$
  $$ H = \max(dist(TL, BL), dist(TR, BR)) $$
- **Gaussian Elimination**: Computes the vector $h$ of the homography projection $H$ (with $h_{22}=1$) mapping destination $(x_d, y_d)$ back to source $(x_s, y_s)$ coordinates.
- **Bilinear Interpolation**: For each destination pixel $(x_d, y_d)$, the source pixel $(x_s, y_s)$ is fetched using weighted averages of its four nearest neighbors.

### 4.2. SVG Drag & Convexity Validator
- An SVG element overlay is rendered exactly on top of the preview image wrapper.
- The 4 handles are rendered as `<circle>` elements and connected via SVG `<polygon>` or `<line>` elements with semi-transparent fills.
- **Convexity Check**: A quad is convex if the cross products of consecutive edges all have the same sign:
  $$ c_i = (P_{i+1}.x - P_i.x)(P_{i+2}.y - P_{i+1}.y) - (P_{i+1}.y - P_i.y)(P_{i+2}.x - P_{i+1}.x) $$
  If $c_0, c_1, c_2, c_3$ are not all $> 0$ or all $< 0$, the drag event is blocked.

## 5. File Changes

### `frontend/src/workers/image.utils.ts`
- Add internal helper `solveGaussian(A: number[][], B: number[]): number[]`.
- Implement `flattenReceipt(imageElement, sourcePoints)`.

### `frontend/src/components/DemoOCR.tsx`
- Add `corners` state initialized to 10% margins.
- Add toggle state `isAdjustingPerspective` (default `false`).
- Render absolute-positioned SVG overlay when `isAdjustingPerspective` is active.
- Implement draggable handlers for corner dots.
- Implement "Restablecer" and "Aplanar Ticket" buttons.
- Modify the processing chain: when "Aplanar Ticket" is clicked, it transforms the source image using `flattenReceipt`, binarizes the dewarped canvas, and saves it as the active image source for Tesseract OCR.

## 6. Testing Strategy
- **Unit Tests**:
  - Verify `solveGaussian` returns correct coefficients for known homography transformations.
  - Verify dimension calculation logic matches standard constraints (e.g. TL(10,10), TR(190,20), BR(200,110), BL(20,100) maps to 181x91px).
  - Verify `isConvex` returns `true` for a convex rectangle and `false` when handles overlap or self-intersect.
- **E2E / Integration Tests**:
  - Test that dragging corners in the UI updates the state and updates the SVG polygon.
  - Test that trying to make the quad non-convex blocks updates.
  - Test that "Restablecer" restores corners to original 10% positions.
