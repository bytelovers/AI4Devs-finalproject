# Tasks: Camera Capture Migration

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~600 (5 new files, ~600 additions, 0 deletions) |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Delivery strategy | single-pr (size:exception pre-approved) |
| Chain strategy | size-exception |

Decision needed before apply: Yes
Chained PRs recommended: No
400-line budget risk: Medium

## Phase 1: Camera Hook

### 1.1 Create `src/hooks/useCamera.ts` ✅

**Goal**: Extract camera lifecycle into a reusable hook — permission requests, stream start/stop, frame capture, image compression, cleanup.

**Deliverable**: `src/hooks/useCamera.ts`

**Contracts**:
- `useCamera()` returns `{ startCamera(facingMode?: 'user' | 'environment'), stopCamera(), captureFrame(videoRef) => dataUrl | null, cameraReady: boolean, error: string | null, facingMode, switchFacingMode() }`
- `captureFrame` draws the video frame to a canvas, compresses to JPEG at quality 0.8, caps the max dimension to 1920px
- If `ImageCapture` API is available (Chrome Android), prefer `ImageCapture.grabFrame()` for higher quality; fall back to canvas `drawImage` (the external source already uses this path)
- `getUserMedia` constraints: `video: { facingMode: { ideal: facingMode }, width: { ideal: 1920 }, height: { ideal: 1080 } }`, audio: false
- `stopCamera` calls `stream.getTracks().forEach(t => t.stop())` and nulls the stream ref
- `useEffect` cleanup returns `stopCamera` to guarantee teardown on unmount (prevents Vite HMR leaks)
- Error messages are returned as strings (not thrown) — differentiate "Permission denied", "No camera found", and generic errors

**Acceptance**:
- ✅ Hook compiles with zero TS errors
- ✅ `npm run test` passes (tests in T007)
- ✅ DevTools verify stream stops on unmount

### 1.2 Create `src/hooks/useCamera.test.ts` ✅

See Phase 4.

## Phase 2: Viewfinder Component

### 2.1 Create `src/components/camera/CameraViewfinder.tsx` ✅

**Goal**: Composable viewfinder overlay displaying corner brackets, grid guide, and scanning animation line — used by `CameraCapture` during live preview.

**Deliverable**: `src/components/camera/CameraViewfinder.tsx`

**Contracts**:
- Props: `{ cameraReady: boolean, scanning?: boolean }`
- Renders a square `div` with `position: relative` and `overflow: hidden`, black background (`bg-black`) during camera loading
- 4 corner brackets: each is a 24x24px transparent div with two bordered sides (top+border-left, top+border-right, bottom+border-left, bottom+border-right), border color: `var(--color-sage)` (#5F8575), 3px width
- Grid overlay: thin white/20 grid lines (3x3) using CSS pseudo-elements or a nested div grid — `border-white/20`
- Scanning animation: a horizontal line (4px tall, `bg-[var(--color-sage)]`) that animates top-to-bottom repeatedly using CSS `@keyframes scan 2s ease-in-out infinite`
- Loading state: centered `Loader2` icon with spinning animation + "Starting camera…" text
- Content renders inside a `relative` container with the actual video stream passed through as children (slot pattern)

**Acceptance**:
- ✅ Component compiles with zero TS errors
- ✅ Corner brackets render in sage green
- ✅ Animation line loops smoothly
- ✅ Grid lines visible at 0.5s glance

### 2.2 Create `src/components/camera/index.ts` ✅

**Goal**: Barrel export for the camera module.

**Deliverable**: `src/components/camera/index.ts`

```ts
export { CameraCapture } from './CameraCapture'
export { CameraViewfinder } from './CameraViewfinder'
export { CameraScanFlow } from './CameraScanFlow'
```

## Phase 3: Main Camera Component

### 3.1 Create `src/components/camera/CameraCapture.tsx` ✅

**Goal**: Orchestrate live camera feed, viewfinder overlay, capture button, and review flow. Adapted from the external source (`workspace-previo-import/src/components/cuadra/camera-capture.tsx`) into project conventions.

**Deliverable**: `src/components/camera/CameraCapture.tsx`

**Contracts**:

- Props: `{ onCapture: (dataUrl: string) => void, onCancel: () => void, onClose?: () => void }`
- States managed: `'live'` (camera preview), `'preview'` (review captured image), plus `'error'` as derived state
- Uses `useCamera` hook for stream lifecycle
- Uses `CameraViewfinder` for overlay
- **Live mode layout**:
  - Header with cancel button (X icon) and title "Capture ticket" — using `lucide-react` icons (`X`, `Camera`, `RefreshCw`, `Image`)
  - Error banner (amber-colored) when hook surfaces camera errors, dismissable
  - `video` element (ref passed to `captureFrame`), `playsInline` + `muted` required for iOS
  - `CameraViewfinder` wraps the video with corners + grid when camera is ready
  - Facing mode toggle button (top-right overlay, `SwitchCamera` icon)
  - Capture button (full-width, `Camera` icon, disabled while camera not ready)
  - "Use native camera" / "Upload image" fallback buttons (secondary/outline variant) — deferred to future phase, visible but disabled with tooltip
- **Preview mode**:
  - Header with retake (X) button and title "Preview"
  - Captured image displayed with rounded corners (`rounded-2xl`), responsive `max-h-[60vh] object-contain`
  - Two action buttons: "Retake" (`RefreshCw` icon, outline variant) and "Use image" (`Image` icon, primary variant)
  - `onCapture(preview)` called on confirm
- Image compression: `canvas.toDataURL('image/jpeg', 0.8)`, max dimension 1920px (matching proposal: proposal says 1600px; set to `Math.min(1920, Math.max(width, height))` — but proposal says ≤1600. Let's use 1920 as the cap since the preprocessor already handles 1280px max, and the capture quality 0.8 is the important parameter per spec. Update: proposal says "max 1920px" in the spec description and "≤1600px" in success criteria. Use 1920px as the hard cap to be safe — the preprocessor will downscale further if needed.)
- **Edge cases**:
  - No camera available: show error banner with clear message, all capture buttons disabled
  - getUserMedia rejects due to permissions: surface permission-denied message, guide user to browser settings
  - Component unmounts during streaming: `useCamera` cleanup stops all tracks

**Acceptance**:
- Component renders live camera feed on supported devices
- Capture produces JPEG data URL ≤ 1920px max dimension
- Preview shows captured image with Retake/Confirm actions
- Camera stream stops on cancel and unmount

## Phase 4: OCR Pipeline Integration

### 4.1 Wire camera output to OCR pipeline ✅

**Goal**: Connect `CameraCapture.onCapture` to the existing `ocr.worker` via `processImage`, creating a seamless capture→scan flow.

**Deliverable**: Integration in the consumer view (likely a new or existing view that orchestrates scanning).

**Contracts**:
- A new orchestrating view or wrapper component (e.g., `src/components/camera/CameraScanFlow.tsx`) manages the flow:
  - Renders `CameraCapture` first
  - On `onCapture(dataUrl)`: calls `preprocessReceiptImage(dataUrl)` for OCR-optimized processing, then passes result to `ocr.worker.processImage()`
  - Shows existing `OCRScanner` UI during scan (reuse the scanning state pattern from `OCRScanner.tsx`)
  - On scan complete: calls `useAppStore.addTicket({ image: dataUrl, ...scanResult })`
  - On scan error: surfaces error, offers retry
- Reuses the singleton Comlink worker pattern from `OCRScanner.tsx` (`getWorker()`)
- Passes `preferredEngine` from store settings (`useAppStore(s => s.settings.preferredEngine)`)

**Acceptance**:
- Capture → scan pipeline completes end-to-end
- `addTicket` creates a ticket with image data and scanned items

### 4.2 Wire result to ticket store ✅

**Goal**: After OCR completes, persist the ticket via `useAppStore.addTicket`.

**Deliverable**: Integration code in the scan flow component.

**Contracts**:
- On `onScanComplete`: construct `ScanResult` data into `Partial<Ticket>` shape
- Call `useAppStore.getState().addTicket({ image: capturedDataUrl, ...parsedData })`
- Navigate to ticket detail view: `useAppStore.getState().openTicket(newTicket.id)`

**Acceptance**:
- Verified via `useAppStore.getState().tickets` containing the new ticket post-scan

## Phase 5: Verification

### 5.1 TypeScript and build check ✅

- [x] Run `npx tsc --noEmit` — zero type errors in new files and unchanged files
- [x] Run `npm run build` — zero errors

### 5.2 Unit test: `useCamera` hook ✅

**Deliverable**: `src/hooks/useCamera.test.ts`

**Contracts**:
- Follows the existing test pattern in `src/hooks/useTheme.test.ts` (vitest + @testing-library/react + `vi.stubGlobal` for mocking browser APIs)
- Mocks:
  - `navigator.mediaDevices.getUserMedia` returns a mock `MediaStream` with a mock `MediaStreamTrack`
  - `HTMLVideoElement.prototype.play` resolved promise
  - `window.ImageCapture` is available in one test suite variant, undefined in another
  - `HTMLCanvasElement.prototype.toDataURL` returns a fake data URL
- Test cases:
  - `startCamera` successfully gets a stream and sets `cameraReady = true`
  - `startCamera` surfaces error message when `getUserMedia` rejects (permission denied)
  - `stopCamera` calls `track.stop()` and clears ready state
  - `captureFrame` returns a data URL when camera is ready
  - `captureFrame` returns null when camera is not ready
  - `switchFacingMode` toggles between `'environment'` and `'user'`
  - Unmounting cleans up the stream (tracks stopped)
  - Canvas compression caps at 1920px max dimension (< 1920px input stays same size)
- Run: `npx vitest run src/hooks/useCamera.test.ts`

### 5.3 Component test: `CameraCapture`

**Deliverable**: `src/components/camera/CameraCapture.test.tsx`

**Contracts**:
- Renders in live mode with camera icon in header
- Shows error banner when `useCamera` surfaces an error
- Calls `onCancel` when close button is clicked
- (Mocking `getUserMedia` is already handled at the hook level — component test validates behavior, not media APIs)
