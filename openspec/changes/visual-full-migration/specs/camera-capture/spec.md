# Spec Delta: camera-capture

## MODIFIED Requirements

### Requirement: Live, native, and upload modes

The CameraCapture MUST support three capture modes: live (webRTC getUserMedia), native (file input capture), and upload (file input without capture).

(Previously: disabled placeholders for all modes)

#### Scenario: Live mode

- **WHEN** running in a browser with webRTC support
- **THEN** the Camera MUST obtain a stream via `navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })`
- **AND** render the stream in a `<video>` element with `autoPlay playsInline`
- **AND** provide a capture button that draws the current frame to a canvas

#### Scenario: Native mode

- **WHEN** running on a mobile device
- **THEN** the Camera MUST use `<input type="file" accept="image/*" capture="environment">`
- **AND** the file MUST be loaded via FileReader

#### Scenario: Upload mode

- **WHEN** the user selects upload
- **THEN** the Camera MUST use `<input type="file" accept="image/*">` (no capture attribute)

### Requirement: Image compression

The CameraCapture MUST compress captured images before emitting them.

#### Scenario: Compression pipeline

- **WHEN** an image is captured or selected
- **THEN** it MUST be drawn to a canvas with maxWidth=1280, maxHeight=1280
- **AND** exported as `image/jpeg` with quality=0.8
- **AND** the compressed blob MUST be emitted via the `onCapture` callback

### Requirement: Preview with retake and confirm

The CameraCapture MUST render a preview after capture with retake and confirm actions.

#### Scenario: Preview state

- **WHEN** an image is captured
- **THEN** the preview MUST show the image
- **AND** render a Retake button (RotateCcw icon) that resets to capture mode
- **AND** render a Confirm button (Check icon) that emits the blob via `onCapture`

### Requirement: Error handling

The CameraCapture MUST handle permission denied, no device, and unsupported errors.

(Previously: no error handling — placeholders only)
