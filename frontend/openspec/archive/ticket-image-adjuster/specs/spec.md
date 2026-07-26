# BDD Specification: Ticket Image Adjuster (`ticket-image-adjuster`)

## 1. Executive Summary & Specification Metadata

| Parameter | Value |
|---|---|
| **Change ID** | `ticket-image-adjuster` |
| **Specification Path** | `openspec/changes/ticket-image-adjuster/specs/spec.md` |
| **Status** | Approved for Execution |
| **Target Components** | `TicketImageAdjuster.tsx`, `preprocessor.ts`, `imageQualityAssessor.ts`, `NewTicketCaptureView.tsx`, `ocr.worker.ts`, `receipt-parser.ts`, `types.ts` |
| **Primary Goal** | Insert a dedicated, mandatory image adjustment screen in the scan flow with multi-crop support, automated pixel density preservation, image filters, OCR multi-section merging, and an automated Image Quality / Readability Assessor computing real-time quality metrics (blur, contrast, brightness, character height), displaying adaptive warning badges/banners, with hybrid persistence. |

---

## 2. Business Requirements & Context

1. **Mandatory Dedicated Adjustment Screen**: Right after photo capture or file upload, the scan workflow MUST transition into a dedicated interactive adjustment view (`adjust` phase) prior to OCR execution. Skipping or bypassing this step is prohibited to ensure high OCR precision across varying lighting and physical ticket layouts.
2. **Comprehensive Adjustment Toolkit**:
   - **Crop & Scale**: Interactive single and multi-bounding-box cropping, zoom ($1.0\times - 4.0\times$), pan, and rotation.
   - **Enhancement Filters**: Brightness slider ($-100$ to $+100$), contrast slider ($0.5\times$ to $2.5\times$), grayscale toggle, and binarization/adaptive thresholding toggle.
   - **Multi-Section Subsection Support**: Support creating multiple distinct crop sections (subsections) on long receipts or multi-part ticket photos within the same capture.
   - **OCR Merging Engine**: Each defined crop section is processed individually through OCR, and results are merged into a single consolidated ticket structure (line items, total, tax, and merchant metadata).
3. **Automated Resolution & Pixel Density Detection**:
   - Automatically detect character height and pixel density ($DPI$) of selected crop regions to ensure text detail is preserved before downscaling.
   - Provide manual resolution fallback presets (`1080p`, `1280px`, `1600px`, `2048px`, `Native/Max`) and scale factor sliders.
4. **Automated Image Quality & Readability Assessor (Hybrid Persistence)**:
   - **Real-time Quality Metrics Computation**: Real-time evaluation of preview image canvas buffers to calculate critical OCR legibility factors:
     - *Blur Detection*: Evaluate focus sharpness using Laplacian variance ($\text{Var}(\Delta I)$) and image gradient variance.
     - *Contrast Ratio*: Compute luminance distribution and RMS contrast ($C_{\text{rms}}$).
     - *Brightness Score*: Calculate mean luminance ($\mu_Y$, 0–255 scale) to detect underexposed (< 60) or overexposed (> 220) receipt captures.
     - *Estimated Character Height*: Estimate typography height in pixels ($h_{\text{char\_est}}$) to verify readability threshold ($\ge 32\text{px}$).
   - **Automated Warning Badges & Banners**: Render real-time dynamic visual feedback banners directly on the `TicketImageAdjuster` screen:
     - Warning banner for blur: `⚠️ Imagen borrosa - Te recomendamos repetir la foto`
     - Warning banner for low illumination / low contrast: `⚠️ Imagen muy oscura / bajo contraste - Ajusta el brillo o repite la foto`
     - Optimal quality badge: `✅ Calidad de imagen óptima para OCR`
   - **Recommendation & Quick Action Prompts**: Include contextual quick actions in banners (e.g. "Repetir foto", "Ajustar automáticamente", "Continuar de todos modos").
   - **Hybrid Persistence Model**:
     - *Session / Transient State*: Live calculated metrics and active UI badge states are maintained in reactive UI state / Zustand store during active scanning.
     - *Persistent Ticket Metadata*: Final image quality metrics summary (`QualityAssessmentSummary`) is saved into the draft ticket scan metadata in IndexedDB / local DB for auditability and quality performance analytics.
5. **UX & Technical Feasibility Evaluation**: Include a detailed UX evaluation analyzing mobile touch ergonomics, canvas rendering overhead, state refactoring requirements, real-time quality indicator UX, and multi-part ticket merge strategies.

---

## 3. BDD Scenarios (Gherkin Syntax)

### Feature: Dedicated Scan Flow Adjustment Screen
```gherkin
Feature: Dedicated Ticket Image Adjuster Step
  As a SplitEat user scanning a restaurant receipt
  I want to preview and adjust the captured receipt image before running OCR
  So that background noise, poor lighting, or bad framing do not corrupt line item extraction

  Background:
    Given the user is on the New Ticket capture screen ("NewTicketCaptureView")
    And a draft ticket has been initialized in the store

  Scenario: Automatic transition to adjustment view upon photo capture
    When the user takes a photo or uploads an image file
    Then the scan workflow transitions state from "capture" to "adjust"
    And the dedicated "TicketImageAdjuster" screen is displayed with the captured image loaded
    And OCR processing is deferred until the user explicitly confirms the adjustments

  Scenario: User confirms image adjustments and initiates OCR processing
    Given the user is on the "TicketImageAdjuster" screen with a captured receipt
    When the user modifies crop bounds and clicks "Confirm & Scan"
    Then the preprocessor applies canvas transformations
    And the workflow transitions from "adjust" to "scanning"
    And the OCR worker receives the enhanced image data URL
```

### Feature: Image Enhancement Filters & Contrast Optimization
```gherkin
Feature: Image Enhancement Filters and Contrast Optimization
  As a user with a low-contrast or poorly lit receipt
  I want to adjust brightness, contrast, grayscale, and binarization
  So that faint thermal print text becomes clearly legible for the OCR engine

  Scenario: Applying binarization to thermal paper receipt with uneven shadows
    Given the user is on the "TicketImageAdjuster" view with a shadowed receipt
    When the user enables the "Binarization" filter toggle
    Then an adaptive thresholding algorithm is applied to the preview canvas
    And shadows are suppressed while character edges remain sharp black on white background
    And the user can view live real-time visual feedback on the preview canvas

  Scenario: Adjusting brightness and contrast sliders
    Given the user is inspecting an underexposed receipt image
    When the user adjusts the brightness slider to "+25" and contrast to "1.5"
    Then the preprocessor engine updates the pixel arrays using linear gain and offset equations
    And text legibility score increases prior to OCR execution

  Scenario: Resetting adjustments to raw captured image
    Given the user has applied custom crop, brightness "+40", contrast "2.0", and binarization
    When the user taps the "Reset Original" action button
    Then all filter sliders reset to neutral defaults (brightness 0, contrast 1.0, grayscale off, binarization off)
    And crop bounds reset to full original image boundaries
```

### Feature: Automated Image Quality & Readability Assessor
```gherkin
Feature: Automated Image Quality Assessment and Readability Banners
  As a user taking photos of receipts in varied lighting and focus conditions
  I want real-time quality metric feedback and recommendations on the adjustment screen
  So that I am warned when an image is blurry or too dark before wasting time running OCR

  Background:
    Given the user is on the "TicketImageAdjuster" view with a newly loaded image canvas

  Scenario: Clear high-quality receipt image detection and optimal badge display
    When the image quality assessor evaluates the preview image canvas
    Then the computed Laplacian variance is above threshold (>= 100.0)
    And the brightness score is within normal range (60 to 220)
    And contrast ratio and estimated character height meet legibility requirements
    And the visual badge "✅ Calidad de imagen óptima para OCR" is displayed on the screen
    And the quality assessment summary is saved to session store state

  Scenario: Blurry image detection and retake recommendation banner
    Given an out-of-focus image with motion blur is loaded into the adjuster
    When the image quality assessor computes metrics on the preview canvas
    Then the Laplacian variance score drops below the blur threshold (< 100.0)
    And a warning banner displaying "⚠️ Imagen borrosa - Te recomendamos repetir la foto" appears on the screen
    And action buttons for "Repetir foto" and "Continuar de todos modos" are presented to the user

  Scenario: Underexposed or dark receipt photo detection
    Given a photo captured in a dim environment with mean brightness score of 35
    When the image quality assessor runs quality checks
    Then the brightness score is flagged as "underexposed" (< 60)
    And a warning banner displaying "⚠️ Imagen muy oscura / bajo contraste - Ajusta el brillo o repite la foto" is displayed
    And clicking "Ajustar automáticamente" boosts brightness slider to +30 and contrast to 1.5

  Scenario: Character height threshold check for small text
    Given a cropped region containing receipt text with estimated character height of 18px
    When the quality assessor evaluates character legibility
    Then a notice banner "ℹ️ Texto pequeño detectado - Se aplicará super-muestreo automático" is shown
    And automatic bicubic upscaling is scheduled for the preprocessor phase

  Scenario: Hybrid persistence of quality assessment metrics
    Given an image has been assessed with quality status "optimal" and Laplacian variance of 145.2
    When the user confirms adjustments and completes the ticket scan
    Then transient metrics remain available in the active store session
    And the final quality metric summary is persisted into the permanent draft ticket scan metadata
```

### Feature: Automated Pixel Density Detection & Resolution Control
```gherkin
Feature: Automated Resolution Detection and Pixel Density Preservation
  As a mobile user cropping a small subsection of a high-megapixel receipt photo
  I want the app to automatically detect pixel density and preserve typography sharpness
  So that cropped text does not become pixelated or blurry during downscaling

  Scenario: Automated upscaling on small cropped text region
    Given a raw receipt photo captured at 12 Megapixels (4000x3000)
    When the user draws a small crop box around a single line item measuring 400x100 pixels
    Then the automated resolution detector calculates character height (16px)
    And automatically applies a 2.0x bicubic super-sampling multiplier to boost character height to 32px
    And preserves high pixel density (>300 DPI equivalent) for OCR input

  Scenario: Manual resolution preset override
    Given the user is adjusting a multi-page receipt with large typography
    When the user opens resolution settings and selects preset "1600px" instead of "Auto"
    Then the preprocessor engine constrains maximum width/height bounds to 1600px
    And displays calculated output dimensions (e.g., "1200 x 1600 px, ~240 DPI") in the UI indicator
```

### Feature: Multi-Section Crop (Subsections) & Receipt Merging
```gherkin
Feature: Multi-Section Cropping for Long Receipts and Multi-Part Tickets
  As a user dealing with an elongated receipt or separate food/drink tickets
  I want to define multiple crop sections on the same photo or across sequential photos
  So that all items are extracted into a single unified ticket result

  Scenario: Defining multiple crop subsections on a single long receipt
    Given a receipt image containing top items, a middle crease, and bottom totals
    When the user taps "Add Crop Section" on the adjuster interface
    Then a second bounding box ("Section 2") is created on the canvas canvas
    And the user can adjust bounds for Section 1 (Header/Drinks) and Section 2 (Mains/Totals)
    And both sections are displayed with index labels [1] and [2] in the viewport

  Scenario: Sequential OCR processing and item merging
    Given the user has defined Section 1 (Items A, B) and Section 2 (Items C, Total)
    When the user confirms the multi-section crop and taps "Process All Sections"
    Then the system processes Section 1 through OCR to yield items [A, B]
    And processes Section 2 through OCR to yield items [C] and total metadata
    And merges extracted items into a single draft ticket with items [A, B, C]
    And preserves global metadata (merchant name, tax, total amount) from the final total section
```

---

## 4. Data Models & API Contracts

### Data Model Definitions (`src/lib/scan/types.ts`)

```typescript
/** Bounding box in normalized coordinates (0.0 to 1.0) relative to image dimensions */
export interface NormalizedCropRect {
  x: number      // left ratio (0..1)
  y: number      // top ratio (0..1)
  width: number  // width ratio (0..1)
  height: number // height ratio (0..1)
}

/** Individual crop section definition for multi-section receipts */
export interface CropSection {
  id: string
  label: string
  rect: NormalizedCropRect
  order: number
}

/** Preset resolution configurations */
export type ResolutionPreset = '1080p' | '1280px' | '1600px' | '2048px' | 'native' | 'auto'

/** Detailed resolution configuration options */
export interface ResolutionConfig {
  preset: ResolutionPreset
  customScale?: number // Manual multiplier (1.0 to 4.0)
  targetDpi?: number   // Target DPI override (default 300)
  minCharHeightPx?: number // Minimum font size in canvas pixels (default 32)
}

/** Detailed metric breakdown computed by the Image Quality Assessor */
export interface ImageQualityMetrics {
  laplacianVariance: number        // Blur metric: Higher means sharper (>= 100 sharp, < 100 blurry)
  gradientVariance: number         // Edge gradient sharpness score
  contrastRatio: number            // RMS contrast score (0 to 100)
  brightnessScore: number          // Average luminance score (0 to 255)
  estimatedCharHeightPx: number    // Estimated typography character height in pixels
  status: 'optimal' | 'warning_blur' | 'warning_dark' | 'warning_low_contrast' | 'critical'
  badgeText: string                // e.g. "✅ Calidad de imagen óptima para OCR"
  warningMessage?: string          // e.g. "⚠️ Imagen borrosa - Te recomendamos repetir la foto"
  recommendations: Array<'retake' | 'auto_adjust' | 'upscale' | 'proceed'>
  assessedAt: string
}

/** Persistent quality metadata summary stored inside draft ticket metadata (Hybrid Persistence) */
export interface QualityAssessmentSummary {
  laplacianVariance: number
  brightnessScore: number
  contrastRatio: number
  status: ImageQualityMetrics['status']
  userActionTaken?: 'accepted_optimal' | 'overridden_warning' | 'auto_fixed' | 'retaken'
}

/** Comprehensive image adjustment state */
export interface ImageAdjustmentOptions {
  sections: CropSection[]
  brightness: number       // -100 to +100 (default 0)
  contrast: number         // 0.5 to 2.5 (default 1.0)
  grayscale: boolean       // default false
  binarization: boolean    // default false
  binarizationThreshold?: number // 0 to 255 (adaptive auto if undefined)
  zoom: number             // 1.0 to 4.0
  rotation: number         // 0, 90, 180, 270 degrees
  resolution: ResolutionConfig
  qualityMetrics?: ImageQualityMetrics // Real-time quality evaluation result (transient session state)
}

/** Output resulting from processing a single crop section */
export interface PreprocessedSection {
  sectionId: string
  order: number
  dataUrl: string
  width: number
  height: number
  calculatedDpi: number
}

/** Output payload after running preprocessor pipeline */
export interface MultiSectionPreprocessResult {
  sections: PreprocessedSection[]
  originalWidth: number
  originalHeight: number
  processedAt: string
  qualitySummary?: QualityAssessmentSummary
}
```

### Image Quality Assessor API (`src/lib/scan/imageQualityAssessor.ts`)

```typescript
export interface QualityAssessorConfig {
  blurThreshold?: number          // Default: 100.0 (Laplacian variance)
  minBrightness?: number         // Default: 60.0 (0-255 scale)
  maxBrightness?: number         // Default: 220.0 (0-255 scale)
  minContrast?: number           // Default: 25.0 (RMS contrast)
  minCharHeightPx?: number       // Default: 32.0 (pixels)
}

/**
 * Calculates real-time image quality metrics (blur, gradient variance, contrast, brightness, character height)
 * and generates appropriate warning badges and recommendation actions.
 */
export function assessImageQuality(
  imageData: ImageData,
  config?: QualityAssessorConfig
): ImageQualityMetrics;

/**
 * Computes Laplacian variance for a single-channel grayscale buffer.
 */
export function computeLaplacianVariance(
  gray: Uint8ClampedArray,
  width: number,
  height: number
): number;

/**
 * Computes RMS contrast ratio for a single-channel grayscale buffer.
 */
export function computeRmsContrast(
  gray: Uint8ClampedArray,
  meanLuminance: number
): number;
```

### Canvas Preprocessor API Expansion (`src/lib/scan/preprocessor.ts`)

```typescript
/**
 * Processes captured receipt image through multi-section crop, pixel density optimization,
 * brightness/contrast transforms, binarization filters, and max resolution bounds.
 */
export async function preprocessMultiSectionReceipt(
  imageDataUrl: string,
  adjustments: ImageAdjustmentOptions
): Promise<MultiSectionPreprocessResult>;

/**
 * Calculates effective pixel density (DPI equivalent) for a target crop rect.
 * Determines required super-sampling scale factor to ensure min character height.
 */
export function calculateOptimalCropScale(
  sourceWidth: number,
  sourceHeight: number,
  cropRect: NormalizedCropRect,
  config: ResolutionConfig
): { scaleFactor: number; effectiveDpi: number; outputWidth: number; outputHeight: number };
```

### Multi-Section OCR Merging Engine API (`src/lib/scan/multiSectionMerger.ts`)

```typescript
export interface SectionOcrPayload {
  sectionId: string
  order: number
  scanResult: ScanResult
}

export interface MergedTicketScanResult {
  merchant?: string
  date?: string
  items: Array<{ name: string; quantity: number; unitPrice: number }>
  subtotal?: number
  taxRate?: number
  taxAmount?: number
  total?: number
  rawTextCombined: string
  confidence: number
  sectionCount: number
  qualitySummary?: QualityAssessmentSummary
}

/**
 * Merges OCR outputs from multiple crop sections into a unified ticket.
 * Performs line item ordering, header isolation, and duplicate item reconciliation.
 */
export function mergeMultiSectionOcrResults(
  payloads: SectionOcrPayload[],
  qualitySummary?: QualityAssessmentSummary
): MergedTicketScanResult;
```

---

## 5. System Architecture & Processing Pipeline

```mermaid
flowchart TD
    A[NewTicketCaptureView: Camera/Upload] -->|Image Captured| B[State: adjust]
    B --> C[TicketImageAdjuster Screen]
    
    subgraph UI Adjuster Screen
        C --> C1[Crop Handles / Multi-Section Manager]
        C --> C2[Brightness / Contrast Sliders]
        C --> C3[Binarization / Grayscale Toggles]
        C --> C4[Resolution & DPI Controls]
        C --> C5[Image Quality Assessor Banner / Badges]
    end

    C -->|Canvas ImageData| Q[imageQualityAssessor.ts]
    Q -->|ImageQualityMetrics| C5
    C5 -->|Warning: Blur / Dark / Low Contrast| C2
    C5 -->|Retake Action| A
    
    C1 & C2 & C3 & C4 & C5 -->|Adjustments + Session Metrics| D[User Clicks 'Confirm & Scan']
    D -->|Image + ImageAdjustmentOptions| E[preprocessor.ts: Canvas Pipeline]
    
    subgraph Preprocessor Pipeline
        E --> E1[Resolution Auto-Detector & DPI Scaler]
        E --> E2[Canvas Slice & Sub-Region Crop]
        E --> E3[Color Matrix: Brightness/Contrast/Grayscale]
        E --> E4[Adaptive Otsu Binarization Filter]
    end
    
    E4 -->|MultiSectionPreprocessResult| F[OCR Comlink Worker Pool]
    
    subgraph OCR Execution
        F --> F1[Worker Pass: Section 1]
        F --> F2[Worker Pass: Section 2]
        F --> F3[Worker Pass: Section N]
    end
    
    F1 & F2 & F3 -->|SectionOcrPayload[]| G[multiSectionMerger.ts Engine]
    G -->|MergedTicketScanResult + QualitySummary| H[Update Zustand Store & Recalc Draft]
    H -->|Hybrid Persistence: Session Store + IndexedDB| DB[(Local Storage / IndexedDB Drafts)]
    H --> I[State: complete -> Navigate to OCR Review]
```

---

## 6. Algorithmic Specifications

### 6.1 Automated Pixel Density Detection & DPI Normalization

1. **Source DPI Estimate**: Assume standard capture sensor baseline $DPI_{\text{base}} = 300 \text{ DPI}$ at standard frame scale ($1920\times 1080$).
2. **Crop Dimension Calculation**:
   $$\text{cropW} = \text{sourceW} \times \text{rect.width}, \quad \text{cropH} = \text{sourceH} \times \text{rect.height}$$
3. **Character Height Estimation**:
   For typical English/Spanish receipt formatting, standard font height occupies approximately $1.5\%$ of document height ($h_{\text{text\_raw}} = \text{cropH} \times 0.015$).
4. **Target Scaling Factor**:
   To prevent OCR degradation from downsampling small text regions below the minimum OCR threshold ($32\text{px}$ character height):
   $$S_{\text{auto}} = \max\left(1.0, \frac{32}{h_{\text{text\_raw}}}\right)$$
5. **Preset Clipping**:
   Apply cap according to `ResolutionPreset`:
   - `1080p`: $\max(\text{outputW}, \text{outputH}) \le 1080$
   - `1280px`: $\max(\text{outputW}, \text{outputH}) \le 1280$
   - `1600px`: $\max(\text{outputW}, \text{outputH}) \le 1600$
   - `2048px`: $\max(\text{outputW}, \text{outputH}) \le 2048$
   - `native`: Unconstrained ($S = 1.0$)

### 6.2 Binarization Algorithm (Adaptive Thresholding)

```typescript
/**
 * Applies Adaptive Integral Image Binarization (Bradley-Roth algorithm).
 * Outperforms global Otsu thresholding on receipts with shadows or gradient backlights.
 */
export function applyAdaptiveThreshold(
  gray: Uint8ClampedArray,
  width: number,
  height: number,
  windowSizeRatio = 0.12,
  contrastThreshold = 0.15
): Uint8ClampedArray {
  const S = Math.round(width * windowSizeRatio)
  const s2 = Math.floor(S / 2)
  const integral = new Uint32Array(width * height)
  
  // 1. Compute integral image
  for (let y = 0; y < height; y++) {
    let sum = 0
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      sum += gray[idx]
      if (y === 0) {
        integral[idx] = sum
      } else {
        integral[idx] = integral[(y - 1) * width + x] + sum
      }
    }
  }

  // 2. Perform thresholding using integral image local mean
  const out = new Uint8ClampedArray(gray.length)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      const x1 = Math.max(x - s2, 0)
      const x2 = Math.min(x + s2, width - 1)
      const y1 = Math.max(y - s2, 0)
      const y2 = Math.min(y + s2, height - 1)

      const count = (x2 - x1 + 1) * (y2 - y1 + 1)
      const sum = integral[y2 * width + x2] - 
                  (y1 > 0 ? integral[(y1 - 1) * width + x2] : 0) - 
                  (x1 > 0 ? integral[y2 * width + (x1 - 1)] : 0) + 
                  (y1 > 0 && x1 > 0 ? integral[(y1 - 1) * width + (x1 - 1)] : 0)

      if (gray[idx] * count < sum * (1.0 - contrastThreshold)) {
        out[idx] = 0   // Black text
      } else {
        out[idx] = 255 // White background
      }
    }
  }
  return out
}
```

### 6.3 Automated Image Quality Assessment Algorithms

1. **Blur Detection via Laplacian Variance**:
   - Convert RGBA pixel buffer to single-channel luminance $Y(x, y) = 0.299 R + 0.587 G + 0.114 B$.
   - Convolve grayscale image with 2D discrete Laplacian kernel:
     $$K = \begin{bmatrix} 0 & 1 & 0 \\ 1 & -4 & 1 \\ 0 & 1 & 0 \end{bmatrix}$$
   - Compute mean response $\bar{L} = \frac{1}{N}\sum_{x,y} L(x,y)$ and Laplacian Variance:
     $$\text{Var}(L) = \frac{1}{N}\sum_{x,y} (L(x,y) - \bar{L})^2$$
   - Decision rule: If $\text{Var}(L) < 100.0 \implies \text{Blur Warning}$ (`⚠️ Imagen borrosa - Te recomendamos repetir la foto`).

2. **Contrast Ratio (RMS Contrast)**:
   - Compute Root Mean Square (RMS) luminance contrast across image pixels:
     $$C_{\text{rms}} = \sqrt{\frac{1}{N} \sum_{i=1}^N (Y_i - \bar{Y})^2}$$
   - Decision rule: If $C_{\text{rms}} < 25.0 \implies \text{Low Contrast Warning}$.

3. **Brightness Score Calculation**:
   - Calculate mean pixel luminance $\mu_Y = \frac{1}{N} \sum_{i=1}^N Y_i$.
   - Underexposed condition ($\mu_Y < 60$): Trigger dark image warning (`⚠️ Imagen muy oscura / bajo contraste - Ajusta el brillo o repite la foto`).
   - Overexposed condition ($\mu_Y > 220$): Trigger glare / overexposure warning.

4. **Estimated Text Character Height**:
   - Compute vertical luminance gradient transitions across horizontal sample rows to detect character bounding boxes.
   - Estimate median height $h_{\text{char\_est}}$ in pixels. If $h_{\text{char\_est}} < 32\text{px}$, flag text size notice and schedule super-sampling.

---

## 7. UX Evaluation: Multi-Section Crop & Quality Assessor

### 7.1 UX Analysis & Ergonomics on Mobile

| Challenge | Impact | UX Design Solution |
|---|---|---|
| **Small Touch Targets** | High risk of frustrating mis-touches when dragging crop corners on 6-inch mobile screens. | Touch handles styled with 44x44px hitboxes, visual corner anchors, pinch-to-zoom on canvas viewport, and magnifier callout on drag. |
| **Multi-Section Order Ambiguity** | Users may crop bottom items before top items, breaking sequential order. | Numbered badges (`[1]`, `[2]`, `[3]`) rendered on top-left of each crop box. Tap-to-reorder drawer or drag handle list. |
| **Visual Overcrowding** | Multiple bounding boxes clutter small receipt preview. | Color-coded active vs inactive section borders (Active: Primary Accent; Inactive: Muted semi-transparent outline). |
| **Feedback Latency** | Running OCR sequentially on 3+ crop sections can take 4-8 seconds. | Sectioned progress bar (`Processing Section 1 of 3...`), preview thumbnails, and cancellable worker queue. |
| **Blurry/Dark Capture Frustration** | Users process illegible receipts through OCR and get corrupt line items. | Real-time warning banners at top of `TicketImageAdjuster` (`⚠️ Imagen borrosa...` / `✅ Calidad óptima...`) with non-blocking "Retake photo" and "Auto-adjust" shortcuts. |

### 7.2 Technical Feasibility vs Refactoring Requirements

#### Feasibility Matrix

```
+-------------------------------------------------------------------------+
| Dynamic Canvas Memory Management & Quality Assessor                     |
| - Real-time throttled (100ms) Quality Assessor on Preview Canvas        |
| - OffscreenCanvas / Downscaled Preview Canvas for 60fps UI feedback    |
| - High-res preprocessor canvas created only during "Confirm & Scan"     |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
| Refactoring Impact & Hybrid Persistence                                 |
| 1. NewTicketCaptureView.tsx: State machine expanded ('adjust' state)    |
| 2. scan/types.ts: Added ImageQualityMetrics & QualityAssessmentSummary |
| 3. scan/imageQualityAssessor.ts: Laplacian variance & metrics module    |
| 4. scan/preprocessor.ts: Canvas multi-crop & binarization algorithms     |
| 5. scan/multiSectionMerger.ts: Merging engine with quality summary log   |
+-------------------------------------------------------------------------+
```

#### Refactoring Requirements Breakdown

1. **State Machine Refactoring in `NewTicketCaptureView.tsx`**:
   - Current Flow: `capture` $\rightarrow$ `scanning` $\rightarrow$ `complete` / `error`.
   - Target Flow: `capture` $\rightarrow$ `adjust` $\rightarrow$ `scanning` $\rightarrow$ `complete` / `error`.
   - Modularity: Extract camera capture and adjuster into distinct step sub-components to prevent state bloat.

2. **Zustand Store Refactoring (`src/lib/store.ts`)**:
   - `ScanMetadata` interface updated to store `adjustments?: ImageAdjustmentOptions`, `sectionCount?: number`, and `qualitySummary?: QualityAssessmentSummary`.
   - Enables hybrid persistence: active session stores transient metrics; draft ticket persists final quality summary.

3. **OCR Engine / Worker Refactoring (`src/workers/ocr.worker.ts`)**:
   - Support array batch processing `processSections(sections: PreprocessedSection[])`.
   - Emits progress events tagged per section ID (`{ sectionId: 'sec_1', percent: 45, message: 'Scanning Section 1...' }`).

---

## 8. Suite of Tests & TDD Criteria (Vitest + RTL)

### Unit & Integration Test Specifications

1. `src/lib/scan/imageQualityAssessor.test.ts`:
   - `[Unit]` `computeLaplacianVariance` correctly returns high value (> 200) for sharp high-contrast test image and low value (< 50) for synthetic blurred matrix.
   - `[Unit]` `assessImageQuality` generates `warning_blur` status and message `"⚠️ Imagen borrosa - Te recomendamos repetir la foto"` when Laplacian variance is below threshold.
   - `[Unit]` `assessImageQuality` generates `warning_dark` status and message `"⚠️ Imagen muy oscura / bajo contraste - Ajusta el brillo o repite la foto"` when mean luminance < 60.
   - `[Unit]` `assessImageQuality` returns status `'optimal'` and badge `"✅ Calidad de imagen óptima para OCR"` when image meets all criteria.

2. `src/lib/scan/preprocessor.test.ts`:
   - `[Unit]` Binarization filter turns gray image with gradient shadow into crisp bi-level black/white buffer.
   - `[Unit]` `calculateOptimalCropScale` correctly upscales sub-100px crops to meet minimum char height ($32\text{px}$).
   - `[Unit]` Crop transformation extracts exact bounding box slice without coordinate offset skew.

3. `src/lib/scan/multiSectionMerger.test.ts`:
   - `[Unit]` Correctly concatenates items from Section 1 and Section 2 in sequential order.
   - `[Unit]` Extracts merchant name from header section (Section 1) and totals from trailing section (Section N).
   - `[Unit]` Deduplicates item names if bounding box regions slightly overlap.
   - `[Unit]` Attaches `qualitySummary` to merged result.

4. `src/components/camera/TicketImageAdjuster.test.tsx`:
   - `[RTL]` Renders image preview, brightness slider, contrast slider, grayscale toggle, and binarization toggle.
   - `[RTL]` Renders visual badge `"✅ Calidad de imagen óptima para OCR"` when image quality is clear.
   - `[RTL]` Renders warning banner `"⚠️ Imagen borrosa - Te recomendamos repetir la foto"` when image quality assessor detects blur.
   - `[RTL]` Tapping "Add Crop Section" creates a second crop box with label "[2]".
   - `[RTL]` Reset button restores default sliders and single full-image crop section.
   - `[RTL]` Confirming adjustments invokes `onConfirm` callback with `ImageAdjustmentOptions` payload including transient `qualityMetrics`.

5. `src/views/NewTicketCaptureView.test.tsx`:
   - `[Integration]` Capturing a photo transitions view state to `adjust` phase.
   - `[Integration]` Clicking "Confirm & Scan" transitions to `scanning` phase, triggers OCR worker, and persists `QualityAssessmentSummary` into draft ticket metadata.

---

## 9. Acceptance Criteria (AC) Traceability Matrix

| AC ID | Requirement Description | Verification Method | Pass Criteria |
|---|---|---|---|
| **AC-01** | Dedicated Adjuster Screen always active post-capture | `NewTicketCaptureView.test.tsx` | Capture triggers `adjust` phase; adjuster view mounts immediately. |
| **AC-02** | Full adjustment suite controls (crop, zoom, brightness, contrast, grayscale, binarization) | `TicketImageAdjuster.test.tsx` | All sliders and toggles update canvas preview in real time. |
| **AC-03** | Multi-section subsection crop creation on long/multi-part receipts | `TicketImageAdjuster.test.tsx` | Multiple sections can be added, adjusted, ordered, and deleted. |
| **AC-04** | Auto resolution detection with pixel density preservation & manual fallback | `preprocessor.test.ts` | Small text crops auto-scale factor $\ge 1.5\times$; manual preset overrides max bounds. |
| **AC-05** | Multi-crop OCR processing and item merging | `multiSectionMerger.test.ts` | Multi-section payloads synthesize into single consolidated `Ticket` structure. |
| **AC-06** | UX evaluation section analyzing feasibility & refactoring | `spec.md` Section 7 | Comprehensive UX analysis included covering mobile ergonomics, store changes, and quality banners. |
| **AC-07** | Automated Image Quality Assessor metrics computation (blur Laplacian variance, brightness score, contrast ratio, char height) | `imageQualityAssessor.test.ts` | Sharp images pass threshold; blurry (< 100 Laplacian var) or dark (< 60 brightness) images trigger exact metric flags. |
| **AC-08** | Dynamic warning badges/banners (`⚠️ Imagen borrosa...`, `✅ Calidad óptima...`) and hybrid persistence | `TicketImageAdjuster.test.tsx`, `NewTicketCaptureView.test.tsx` | Warning/optimal UI banners render dynamically; metrics held transiently in session and persisted in draft ticket metadata. |

---

## 10. Change History

- **v1.0 (2026-07-26)**: Initial BDD specification drafting for `ticket-image-adjuster` incorporating dedicated adjustment step, image preprocessor enhancements, multi-section crop merging, automated pixel density scaling, and UX feasibility analysis.
- **v1.1 (2026-07-26)**: Extended specification to incorporate an automated Image Quality / Readability Assessor capability. Added real-time blur detection via Laplacian variance, gradient variance, contrast ratio, brightness score, and estimated text character height algorithms. Defined dynamic UI warning badges (`⚠️ Imagen borrosa - Te recomendamos repetir la foto`, `✅ Calidad de imagen óptima para OCR`), BDD scenarios, data models (`ImageQualityMetrics`, `QualityAssessmentSummary`), image quality pipeline architecture, unit/RTL test suites, and hybrid persistence strategy.
