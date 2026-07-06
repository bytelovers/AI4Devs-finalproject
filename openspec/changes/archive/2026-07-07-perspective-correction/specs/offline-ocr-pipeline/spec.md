# Delta: offline-ocr-pipeline

## MODIFIED Requirements

### Image Loading and Binarization
The system MUST support canvas-based image loading, dewarping, and binarization. The dewarping process MUST happen before automatic or manual binarization thresholding is applied to the image.
(Previously: Supported canvas-based image loading and binarization thresholding without dewarping.)

#### Scenario: Image loading and automatic dewarping handle initialization
Given a user uploads a receipt image
When the image is loaded into the canvas
Then the system MUST render interactive corner handles at 10% margins.

#### Scenario: Adjusting perspective before automatic binarization
Given the interactive handles are rendered
When the user applies perspective correction
Then the system MUST calculate the automatic binarization threshold on the dewarped canvas
And the system MUST draw the thresholded black-and-white preview of the dewarped image on the canvas.

#### Scenario: Adjusting manual binarization threshold on dewarped canvas
Given the dewarped and binarized canvas is rendered in the UI
When the user adjusts the manual binarization threshold slider
Then the system MUST immediately update the binarization threshold
And the system MUST redraw the updated black-and-white preview of the dewarped image on the canvas.

### Offline OCR Text Extraction and Grouping
OCR text extraction MUST execute offline via Web Workers and group text by lines. The source image MUST be the dewarped, binarized canvas.
(Previously: OCR text extraction executed on standard binarized canvas.)

#### Scenario: Tesseract.js Web Worker execution
Given a dewarped and binarized canvas image
When the user initiates the OCR scanning process
Then the system MUST execute Tesseract.js text extraction inside a background Web Worker
And the system MUST display a loading indicator with progress.

#### Scenario: Y-coordinate line grouping and confidence
Given raw OCR words with bounding boxes are returned from the worker
When the scanner groups text blocks sharing overlapping Y-coordinate boundaries
Then the system MUST construct single horizontal lines of text
And the system MUST display the average confidence percentage in the UI.
