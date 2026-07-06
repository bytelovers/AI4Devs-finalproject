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
