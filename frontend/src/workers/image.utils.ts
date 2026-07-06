/**
 * Converts ImageData to a grayscale channel array.
 * Uses the standard luminance formula: 0.299*R + 0.587*G + 0.114*B
 */
export function convertToGrayscale(imageData: ImageData): Uint8ClampedArray {
  const { data, width, height } = imageData;
  const grayscale = new Uint8ClampedArray(width * height);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    grayscale[i / 4] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }
  return grayscale;
}

/**
 * Computes the optimal threshold using Otsu's method from a grayscale array.
 */
export function computeOtsuThreshold(grayscale: Uint8ClampedArray): number {
  const total = grayscale.length;
  if (total === 0) return 128;

  const histogram = new Uint32Array(256);
  for (let i = 0; i < total; i++) {
    histogram[grayscale[i]]++;
  }

  let sum = 0;
  for (let i = 0; i < 256; i++) {
    sum += i * histogram[i];
  }

  let sumB = 0;
  let wB = 0;
  let wF = 0;
  let varMax = 0;
  let thresholds: number[] = [];

  for (let t = 0; t < 256; t++) {
    wB += histogram[t];
    if (wB === 0) continue;

    wF = total - wB;
    if (wF === 0) break;

    sumB += t * histogram[t];

    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;

    // Calculate Between Class Variance
    const varBetween = wB * wF * (mB - mF) * (mB - mF);

    if (varBetween > varMax) {
      varMax = varBetween;
      thresholds = [t];
    } else if (varBetween === varMax && varMax > 0) {
      thresholds.push(t);
    }
  }

  if (thresholds.length === 0) return 128;
  const sumThresholds = thresholds.reduce((s, val) => s + val, 0);
  return Math.floor(sumThresholds / thresholds.length);
}

/**
 * Binarizes an ImageData using the specified threshold.
 * Returns a new ImageData containing the black-and-white pixel values.
 */
export function binarizeImage(imageData: ImageData, threshold: number): ImageData {
  const { width, height } = imageData;
  const newImageData = new ImageData(width, height);
  const srcData = imageData.data;
  const destData = newImageData.data;

  for (let i = 0; i < srcData.length; i += 4) {
    const r = srcData[i];
    const g = srcData[i + 1];
    const b = srcData[i + 2];
    const a = srcData[i + 3];

    // Compute luminance
    const v = 0.299 * r + 0.587 * g + 0.114 * b;
    const binaryColor = v >= threshold ? 255 : 0;

    destData[i] = binaryColor;     // R
    destData[i + 1] = binaryColor; // G
    destData[i + 2] = binaryColor; // B
    destData[i + 3] = a;           // A (preserve original alpha channel)
  }

  return newImageData;
}

export interface Point {
  x: number;
  y: number;
}

/**
 * Solves a system of linear equations A * x = B using Gaussian elimination with partial pivoting.
 */
export function solveGaussian(A: number[][], B: number[]): number[] {
  const n = B.length;
  const M = A.map((row, i) => [...row, B[i]]);

  for (let i = 0; i < n; i++) {
    // Partial pivoting
    let maxEl = Math.abs(M[i][i]);
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(M[k][i]) > maxEl) {
        maxEl = Math.abs(M[k][i]);
        maxRow = k;
      }
    }

    const temp = M[maxRow];
    M[maxRow] = M[i];
    M[i] = temp;

    const pivot = M[i][i];
    if (Math.abs(pivot) < 1e-12) {
      throw new Error("Matrix is singular or nearly singular.");
    }

    for (let k = i + 1; k < n; k++) {
      const c = -M[k][i] / pivot;
      for (let j = i; j <= n; j++) {
        if (i === j) {
          M[k][j] = 0;
        } else {
          M[k][j] += c * M[i][j];
        }
      }
    }
  }

  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = M[i][n];
    for (let j = i + 1; j < n; j++) {
      sum -= M[i][j] * x[j];
    }
    x[i] = sum / M[i][i];
  }
  return x;
}

/**
 * Check if the 4 points form a convex, non-self-intersecting polygon.
 */
export function isConvexPolygon(points: Point[]): boolean {
  if (points.length !== 4) return false;
  const crossProducts: number[] = [];
  for (let i = 0; i < 4; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % 4];
    const p3 = points[(i + 2) % 4];

    const dx1 = p2.x - p1.x;
    const dy1 = p2.y - p1.y;
    const dx2 = p3.x - p2.x;
    const dy2 = p3.y - p2.y;

    const cross = dx1 * dy2 - dy1 * dx2;
    crossProducts.push(cross);
  }

  const allPositive = crossProducts.every(cp => cp > 0);
  const allNegative = crossProducts.every(cp => cp < 0);

  return allPositive || allNegative;
}

/**
 * Performs client-side perspective correction on an HTMLImageElement or HTMLCanvasElement.
 * @param imageElement Source image or canvas.
 * @param sourcePoints 4 source corner points in absolute image coordinates [TL, TR, BR, BL].
 */
export function flattenReceipt(
  imageElement: HTMLImageElement | HTMLCanvasElement,
  sourcePoints: [Point, Point, Point, Point]
): HTMLCanvasElement {
  const [TL, TR, BR, BL] = sourcePoints;

  // Output width and height:
  // W = max(dist(TL, TR), dist(BL, BR))
  // H = max(dist(TL, BL), dist(TR, BR))
  const w = Math.round(Math.max(
    Math.hypot(TL.x - TR.x, TL.y - TR.y),
    Math.hypot(BL.x - BR.x, BL.y - BR.y)
  ));
  const h = Math.round(Math.max(
    Math.hypot(TL.x - BL.x, TL.y - BL.y),
    Math.hypot(TR.x - BR.x, TR.y - BR.y)
  ));

  const width = Math.max(1, w);
  const height = Math.max(1, h);

  // Source dimensions
  let srcW = 0;
  let srcH = 0;
  if (imageElement instanceof HTMLImageElement) {
    srcW = imageElement.naturalWidth;
    srcH = imageElement.naturalHeight;
  } else {
    srcW = imageElement.width;
    srcH = imageElement.height;
  }

  // Draw source image to offscreen canvas to get ImageData
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = srcW;
  srcCanvas.height = srcH;
  const srcCtx = srcCanvas.getContext('2d');
  if (!srcCtx) {
    throw new Error('Failed to get 2D context for offscreen source canvas');
  }
  srcCtx.drawImage(imageElement, 0, 0);
  const srcImageData = srcCtx.getImageData(0, 0, srcW, srcH);
  const srcData = srcImageData.data;

  // We set up target points matching destination canvas coordinates
  const destPoints = [
    { x: 0, y: 0 },         // TL
    { x: width, y: 0 },     // TR
    { x: width, y: height },// BR
    { x: 0, y: height }     // BL
  ];

  // Solve target-to-source system: A * h = B
  const A: number[][] = [];
  const B: number[] = [];

  for (let i = 0; i < 4; i++) {
    const xd = destPoints[i].x;
    const yd = destPoints[i].y;
    const xs = sourcePoints[i].x;
    const ys = sourcePoints[i].y;

    A.push([xd, yd, 1, 0, 0, 0, -xd * xs, -yd * xs]);
    B.push(xs);
    A.push([0, 0, 0, xd, yd, 1, -xd * ys, -yd * ys]);
    B.push(ys);
  }

  const hCoeffs = solveGaussian(A, B);
  const h00 = hCoeffs[0], h01 = hCoeffs[1], h02 = hCoeffs[2];
  const h10 = hCoeffs[3], h11 = hCoeffs[4], h12 = hCoeffs[5];
  const h20 = hCoeffs[6], h21 = hCoeffs[7];

  // Destination canvas
  const destCanvas = document.createElement('canvas');
  destCanvas.width = width;
  destCanvas.height = height;
  const destCtx = destCanvas.getContext('2d');
  if (!destCtx) {
    throw new Error('Failed to get 2D context for destination canvas');
  }

  const destImageData = destCtx.createImageData(width, height);
  const destData = destImageData.data;

  // Inverse mapping + bilinear interpolation
  for (let yd = 0; yd < height; yd++) {
    for (let xd = 0; xd < width; xd++) {
      const denom = h20 * xd + h21 * yd + 1.0;
      let xs = 0;
      let ys = 0;
      if (Math.abs(denom) > 1e-12) {
        xs = (h00 * xd + h01 * yd + h02) / denom;
        ys = (h10 * xd + h11 * yd + h12) / denom;
      }

      // Clamp coordinates to source boundaries
      const xsClamped = Math.max(0, Math.min(srcW - 1, xs));
      const ysClamped = Math.max(0, Math.min(srcH - 1, ys));

      const x0 = Math.floor(xsClamped);
      const y0 = Math.floor(ysClamped);
      const x1 = Math.min(srcW - 1, x0 + 1);
      const y1 = Math.min(srcH - 1, y0 + 1);

      const dx = xsClamped - x0;
      const dy = ysClamped - y0;

      const idx00 = (y0 * srcW + x0) * 4;
      const idx10 = (y0 * srcW + x1) * 4;
      const idx01 = (y1 * srcW + x0) * 4;
      const idx11 = (y1 * srcW + x1) * 4;

      const r00 = srcData[idx00], g00 = srcData[idx00 + 1], b00 = srcData[idx00 + 2], a00 = srcData[idx00 + 3];
      const r10 = srcData[idx10], g10 = srcData[idx10 + 1], b10 = srcData[idx10 + 2], a10 = srcData[idx10 + 3];
      const r01 = srcData[idx01], g01 = srcData[idx01 + 1], b01 = srcData[idx01 + 2], a01 = srcData[idx01 + 3];
      const r11 = srcData[idx11], g11 = srcData[idx11 + 1], b11 = srcData[idx11 + 2], a11 = srcData[idx11 + 3];

      const w00 = (1 - dx) * (1 - dy);
      const w10 = dx * (1 - dy);
      const w01 = (1 - dx) * dy;
      const w11 = dx * dy;

      const r = w00 * r00 + w10 * r10 + w01 * r01 + w11 * r11;
      const g = w00 * g00 + w10 * g10 + w01 * g01 + w11 * g11;
      const b = w00 * b00 + w10 * b10 + w01 * b01 + w11 * b11;
      const a = w00 * a00 + w10 * a10 + w01 * a01 + w11 * a11;

      const destIdx = (yd * width + xd) * 4;
      destData[destIdx] = Math.round(r);
      destData[destIdx + 1] = Math.round(g);
      destData[destIdx + 2] = Math.round(b);
      destData[destIdx + 3] = Math.round(a);
    }
  }

  destCtx.putImageData(destImageData, 0, 0);
  return destCanvas;
}
