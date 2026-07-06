import { describe, it, expect } from 'vitest';
import { convertToGrayscale, computeOtsuThreshold, binarizeImage } from './image.utils';

describe('image.utils binarization algorithms', () => {
  it('should convert RGB pixels to grayscale correctly', () => {
    // 2x2 image, RGBA channels
    const data = new Uint8ClampedArray([
      255, 0, 0, 255,      // Red
      0, 255, 0, 255,      // Green
      0, 0, 255, 255,      // Blue
      255, 255, 255, 255,  // White
    ]);
    const mockImageData = {
      data,
      width: 2,
      height: 2,
    } as ImageData;

    const grayscale = convertToGrayscale(mockImageData);
    expect(grayscale).toBeInstanceOf(Uint8ClampedArray);
    expect(grayscale.length).toBe(4);

    // Expected luminance values using 0.299 * r + 0.587 * g + 0.114 * b:
    // Red: 0.299 * 255 = 76
    // Green: 0.587 * 255 = 150
    // Blue: 0.114 * 255 = 29
    // White: 0.299*255 + 0.587*255 + 0.114*255 = 255
    expect(grayscale[0]).toBe(76);
    expect(grayscale[1]).toBe(150);
    expect(grayscale[2]).toBe(29);
    expect(grayscale[3]).toBe(255);
  });

  it('should compute Otsu threshold correctly for bimodal distribution', () => {
    // Construct a bimodal distribution:
    // 50 pixels at intensity 50, 50 pixels at intensity 200
    const grayscale = new Uint8ClampedArray(100);
    for (let i = 0; i < 50; i++) grayscale[i] = 50;
    for (let i = 50; i < 100; i++) grayscale[i] = 200;

    const threshold = computeOtsuThreshold(grayscale);
    // The threshold should fall between 50 and 200 (optimally around 124)
    expect(threshold).toBeGreaterThan(50);
    expect(threshold).toBeLessThan(200);
    expect(threshold).toBe(124);
  });

  it('should binarize image using threshold', () => {
    // 2x2 image, RGBA channels
    const data = new Uint8ClampedArray([
      100, 100, 100, 255, // Luminance: ~100
      200, 200, 200, 255, // Luminance: ~200
      50, 50, 50, 255,    // Luminance: ~50
      150, 150, 150, 255, // Luminance: ~150
    ]);
    const mockImageData = {
      data,
      width: 2,
      height: 2,
    } as ImageData;

    // Run with threshold 120
    const result = binarizeImage(mockImageData, 120);
    expect(result.width).toBe(2);
    expect(result.height).toBe(2);

    // Pixel 1: Luminance 100 < 120 -> 0 (Black)
    expect(result.data[0]).toBe(0);
    expect(result.data[3]).toBe(255); // Alpha preserved

    // Pixel 2: Luminance 200 >= 120 -> 255 (White)
    expect(result.data[4]).toBe(255);

    // Pixel 3: Luminance 50 < 120 -> 0 (Black)
    expect(result.data[8]).toBe(0);

    // Pixel 4: Luminance 150 >= 120 -> 255 (White)
    expect(result.data[12]).toBe(255);
  });
});
