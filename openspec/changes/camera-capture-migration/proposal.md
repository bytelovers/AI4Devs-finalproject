# Proposal: Camera Capture Migration

## Intent

Migrate the camera capture component from the external Cuadra project into the SplitEat Vite PWA. This provides native camera integration via MediaDevices API with image compression and direct feed into the existing OCR pipeline — completing the capture → process → extract flow for receipt scanning.

## Scope

### In Scope
- `CameraCapture.tsx` — adapted from Next.js to Vite SPA: live camera viewfinder, frame capture via canvas, image compression, confirmation/re-take flow
- `useCamera.ts` hook — extracted camera lifecycle: permission requests, stream management (`getUserMedia`), facing mode toggle, frame capture, cleanup on unmount
- `CameraViewfinder.tsx` — composable overlay: corner brackets, grid guide, scan line animation, loading/error states
- Integration: `CameraCapture` `onCapture(dataUrl)` → preprocessor → `ocr.worker` → `ScanResult` → `useAppStore` ticket update

### Out of Scope
- File upload fallback (deferred to later phase)
- Video recording
- Server-side image processing
- Barcode/QR scanning

## Capabilities

### New Capabilities
- `camera-capture`: Native camera capture UI with live viewfinder, image compression (canvas resize, JPEG quality control), and viewfinder overlay. Feeds captured images as data URLs into the existing OCR pipeline.

### Modified Capabilities
- `offline-ocr-pipeline`: Camera input joins file upload as a supported image source. The pipeline already accepts `imageDataUrl: string` (spec: "valid image source"), so no spec-level delta — implementation-only.

## Approach

1. Copy `camera-capture.tsx` → `src/components/camera/CameraCapture.tsx`, adapt imports (shadcn `Button`, `cn`, `lucide-react`)
2. Extract camera lifecycle into `src/hooks/useCamera.ts`: `startCamera(facingMode)`, `stopCamera()`, `captureFrame(videoRef)` → data URL
3. Create `src/components/camera/CameraViewfinder.tsx` with corner brackets, grid overlay, scan line animation
4. Wire: `CameraCapture` `onCapture(dataUrl)` → consumer passes to `OCRScanner` or directly to `ocr.worker` → result → `useAppStore.addTicket()`

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/components/camera/CameraCapture.tsx` | New | Main camera component with viewfinder + capture |
| `src/components/camera/CameraViewfinder.tsx` | New | Viewfinder overlay (corners, grid, scan line) |
| `src/hooks/useCamera.ts` | New | Camera lifecycle hook |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| getUserMedia fails on iOS without HTTPS | Medium | Hook surfaces error text; file upload fallback as future path |
| MediaStream not cleaned up on unmount | Low | `useCamera` cleanup in `useEffect` return stops all tracks |
| Vite HMR re-creates component without stream teardown | Low | `useCamera` uses ref for stream, cleans on unmount and re-render |
| iOS <16.4 no ImageCapture API | Low | Fall back to canvas `drawImage` — Cuadra source already uses this path |

## Rollback Plan

`git revert` the commit. Existing `OCRScanner.tsx` remains unchanged — it still accepts `imageDataUrl` input with no dependency on new camera components.

## Dependencies

- `lucide-react` (already in `package.json`) — icons: Camera, X, RefreshCw, SwitchCamera
- No new npm dependencies

## Success Criteria

- [ ] `CameraCapture` renders live camera feed with viewfinder overlay
- [ ] Capture produces a JPEG data URL ≤ 1600px max dimension
- [ ] Captured image routes through OCR pipeline and produces valid `ScanResult`
- [ ] `npm run build` succeeds with zero TS errors
- [ ] Camera stream stops on unmount (verified via DevTools)
