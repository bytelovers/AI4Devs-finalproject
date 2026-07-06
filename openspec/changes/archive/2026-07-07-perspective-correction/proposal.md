# Proposal: perspective-correction

## Intent
Integrate client-side perspective correction (dewarping) of receipts using a custom 3x3 homography matrix solver and bilinear interpolation. This allows users to manually adjust the four corners of a ticket before performing OCR and binarization, completely avoiding OpenCV.js.

## Scope

### In Scope
- **Interactive UI Overlay**: Draggable handles for the 4 corners of the ticket with a toggle button ("Ajustar Esquinas" / "Editar Perspectiva") and a "Restablecer" button (defaults to 10% margins).
- **Dynamic Geometric Validation**: Live UI validation blocking non-convex or self-intersecting polygon configurations during handle dragging.
- **Dynamic Scaling**: Output canvas size determined by the maximum of parallel edge lengths: $\max(dist(TL, TR), dist(BL, BR))$ for width, and $\max(dist(TL, BL), dist(TR, BR))$ for height.
- **Pure Math Solver**: 3x3 homography projection using Gaussian elimination and bilinear interpolation.

### Out of Scope
- Automatic edge or corner detection (ML/computer vision).
- Any OpenCV.js dependency.

## Capabilities

### New Capabilities
- `perspective-dewarping`: Performs client-side perspective correction on HTML Canvas.
  - **Interface**:
    ```typescript
    type Point = { x: number; y: number };
    function flattenReceipt(
      imageElement: HTMLImageElement | HTMLCanvasElement,
      sourcePoints: [Point, Point, Point, Point] // [Top-Left, Top-Right, Bottom-Right, Bottom-Left]
    ): HTMLCanvasElement;
    ```

### Modified Capabilities
- `offline-ocr-pipeline`: Integrated to pass the flattened, perspective-corrected canvas to the binarization and OCR steps.

## Approach
1. **Math Utilities**: Implement Gaussian elimination solver to calculate the 3x3 homography matrix projection mapping destination coordinates to source pixels.
2. **Bilinear Interpolation**: Implement pixel mapping in `image.utils.ts` for clean scaling.
3. **Corner Editor Component**: Build an interactive overlay on top of the receipt preview image.
4. **Collision/Crossing Check**: Implement cross-product checks on drag events to dynamically prevent non-convex handle positions.
5. **Pipeline Integration**: Modify the scan UI to feed the corrected canvas into the binarization slider and Tesseract OCR worker.

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `frontend/src/workers/image.utils.ts` | Modified | Add `flattenReceipt` and matrix math solver. |
| `frontend/src/components/DemoOCR.tsx` | Modified | Integrate toggleable editor, corner handles overlay, and reset logic. |

## Risks & Mitigation
- **Performance Lag**: High-resolution receipts may slow down bilinear interpolation. *Mitigation*: Perform dewarping on a downscaled preview canvas or optimize loops.

## Rollback Plan
Run `git checkout` to revert changes in `image.utils.ts` and `DemoOCR.tsx`.

## Success Criteria
- [ ] Correctly dewarps skewed receipts.
- [ ] Blocking logic prevents self-intersecting selections.
- [ ] Correctly calculates dimensions using parallel edge maximums.
