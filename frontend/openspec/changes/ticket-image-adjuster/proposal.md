# Proposal: Ticket Image Adjuster

## Intent

Introduce a dedicated interactive image adjustment step in the ticket scan wizard between initial image capture/upload and OCR execution. This empowers users to crop receipt boundaries, adjust zoom/scale, modify brightness and contrast, apply binarization/grayscale filters, and configure maximum resolution settings before sending the photo to the OCR engine. These adjustments directly mitigate common OCR extraction failures caused by background clutter, low contrast, uneven lighting, high-megapixel memory overheads, or small receipt typography.

## Scope

### In Scope
- **Dedicated Adjustment Step UI Component (`TicketImageAdjuster`)**: Insert an interactive image adjustment screen in the scan flow right after capturing/uploading an image and before triggering OCR processing.
- **Interactive Cropping & Zooming/Scaling**: Visual crop box and scaling controls to isolate receipt text and eliminate background noise.
- **Image Enhancement & Filter Controls**:
  - Brightness slider controls
  - Contrast enhancement sliders
  - Grayscale conversion toggle/filter
  - Binarization / Adaptive thresholding filter to sharpen low-contrast text against thermal paper backgrounds
- **Max Resolution Settings**: Configurable maximum resolution preset selector (e.g., 1080p, 1280px, 1600px, 2048px, or Max) to balance OCR detail for small text with memory/performance for high-megapixel mobile photos.
- **Preprocessor Engine Expansion**: Extend `src/lib/scan/preprocessor.ts` canvas pipeline to handle crop coordinates, zoom/scale transforms, brightness/contrast adjustments, binarization algorithms, and dynamic max resolution settings.
- **Workflow State Management**: Support live filter previews, quick reset to original capture, saving adjusted image into ticket state, and passing optimized image data to OCR worker.

### Out of Scope
- Server-side image processing backend (all processing remains 100% client-side via HTML5 Canvas API).
- AI automatic perspective warp matrix correction (manual crop handles and standard canvas transformations focus).
- Post-creation image manipulation after ticket item extraction is complete.

## Capabilities

### New Capabilities
- `ticket-image-adjuster`: Interactive image editing component enabling crop, zoom, brightness, contrast, grayscale, binarization, and max-resolution configuration prior to OCR execution.

### Modified Capabilities
- `ticket-scan-wizard`: Update `NewTicketCaptureView` to introduce an `adjust` step in the wizard state machine between camera/upload capture and scanning.
- `image-preprocessor`: Extend `preprocessReceiptImage` API in `src/lib/scan/preprocessor.ts` to accept fine-grained crop rects, scale factor, brightness, contrast, grayscale, binarization threshold, and max-resolution caps.

## Approach

1. **Extend Preprocessor Engine (`src/lib/scan/preprocessor.ts`)**:
   - Enhance `PreprocessOptions` interface to include `cropRect`, `zoom`, `brightness`, `contrast`, `grayscale`, `binarization`, and `maxResolution`.
   - Implement Canvas-based image transformation pipeline applying cropping/scaling, resizing based on `maxResolution`, pixel brightness/contrast manipulation, grayscale conversion, and binarization thresholding.
2. **Develop `TicketImageAdjuster` UI Component (`src/components/camera/TicketImageAdjuster.tsx`)**:
   - Build a mobile-first preview canvas with interactive crop handles and viewport controls.
   - Add intuitive controls for brightness, contrast, grayscale/binarization toggles, zoom levels, and max resolution presets.
   - Include live preview comparison toggle and single-tap reset action.
3. **Integrate into Scan Flow (`src/views/NewTicketCaptureView.tsx`)**:
   - Update `CapturePhase` state machine: `capture` -> `adjust` -> `scanning` -> `complete` / `error`.
   - Upon photo capture or file upload, move to `adjust` phase allowing user review and fine-tuning before executing OCR.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/scan/preprocessor.ts` | Modified | Add crop, scale, brightness, contrast, grayscale, binarization, and max-resolution options to Canvas processing pipeline |
| `src/lib/scan/types.ts` | Modified | Add type definitions for `ImageAdjustmentOptions` and enhanced preprocessing options |
| `src/components/camera/TicketImageAdjuster.tsx` | New | Interactive adjustment component with crop handles, filter sliders, zoom controls, resolution selector, and preview canvas |
| `src/views/NewTicketCaptureView.tsx` | Modified | Integrate `adjust` state in wizard flow between capture/upload and OCR execution |
| `src/lib/scan/preprocessor.test.ts` | Modified | Add unit tests for crop, binarization, brightness, contrast, scaling, and resolution bounds |
| `src/components/camera/TicketImageAdjuster.test.tsx` | New | Unit tests for adjustment UI interactions, reset functionality, and callback handlers |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| High-resolution image canvas operations causing UI lag on mobile devices | Medium | Render downscaled preview canvas for live control feedback; execute full resolution preprocessing step asynchronously prior to OCR |
| Aggressive binarization eroding faint text | Medium | Provide balanced default filter parameters, live visual preview, and easy "Reset" button |
| Complex touch gestures difficult on small screens | Low | Use clear slider controls and touch-friendly bounding box handles with full-image fallback |

## Rollback Plan

```bash
git checkout HEAD -- src/lib/scan/ src/views/NewTicketCaptureView.tsx
rm -f src/components/camera/TicketImageAdjuster.tsx src/components/camera/TicketImageAdjuster.test.tsx
```

## Dependencies

- React 18, HTML5 Canvas API (no external heavy image editing libraries required).

## Success Criteria

- [ ] Users can adjust crop bounds, zoom level, brightness, contrast, grayscale/binarization filters, and maximum resolution settings in a dedicated wizard step before OCR execution.
- [ ] `preprocessReceiptImage` correctly executes fine-grained image adjustments without memory leaks or main-thread freezing.
- [ ] OCR extraction accuracy on small text and high-megapixel photos is improved via targeted crop isolation and contrast enhancement.
- [ ] All unit and integration tests pass (`pnpm test`), and project builds cleanly (`pnpm build`).
