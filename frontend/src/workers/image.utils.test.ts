import { describe, it, expect } from 'vitest';
import {
  convertToGrayscale,
  computeOtsuThreshold,
  binarizeImage,
  solveGaussian,
  isConvexPolygon,
  flattenReceipt
} from './image.utils';

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

describe('perspective-correction utilities', () => {
  describe('solveGaussian', () => {
    it('should solve a simple 2x2 system of equations', () => {
      // 2x + y = 5
      // -x + y = 2
      // Solution: x = 1, y = 3
      const A = [
        [2, 1],
        [-1, 1],
      ];
      const B = [5, 2];
      const x = solveGaussian(A, B);
      expect(x[0]).toBeCloseTo(1);
      expect(x[1]).toBeCloseTo(3);
    });

    it('should solve a 3x3 system of equations', () => {
      // 2x + y - z = 8
      // -3x - y + 2z = -11
      // -2x + y + 2z = -3
      // Solution: x = 2, y = 3, z = -1
      const A = [
        [2, 1, -1],
        [-3, -1, 2],
        [-2, 1, 2],
      ];
      const B = [8, -11, -3];
      const x = solveGaussian(A, B);
      expect(x[0]).toBeCloseTo(2);
      expect(x[1]).toBeCloseTo(3);
      expect(x[2]).toBeCloseTo(-1);
    });

    it('should throw an error for singular matrix', () => {
      const A = [
        [1, 2],
        [2, 4],
      ];
      const B = [3, 6];
      expect(() => solveGaussian(A, B)).toThrow();
    });
  });

  describe('isConvexPolygon', () => {
    it('should return true for a perfect rectangle', () => {
      const rect = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ];
      expect(isConvexPolygon(rect)).toBe(true);
    });

    it('should return true for a convex quad', () => {
      const convex = [
        { x: 0.1, y: 0.15 },
        { x: 0.85, y: 0.05 },
        { x: 0.9, y: 0.85 },
        { x: 0.15, y: 0.95 },
      ];
      expect(isConvexPolygon(convex)).toBe(true);
    });

    it('should return false for a self-intersecting polygon', () => {
      // Hourglass shape (crossed lines)
      const crossed = [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        { x: 10, y: 0 },
        { x: 0, y: 10 },
      ];
      expect(isConvexPolygon(crossed)).toBe(false);
    });

    it('should return false for a non-convex shape (concave vertex)', () => {
      // Dart/chevron shape
      const concave = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 5, y: 5 }, // concave vertex indented inwards
        { x: 0, y: 10 },
      ];
      expect(isConvexPolygon(concave)).toBe(false);
    });
  });

  describe('flattenReceipt', () => {
    it('should calculate correct output dimensions and run dewarping', () => {
      // Mock getContext if it is not supported in jsdom
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type: string) {
        if (type === '2d') {
          return {
            drawImage: () => {},
            getImageData: (x: number, y: number, w: number, h: number) => {
              return {
                data: new Uint8ClampedArray(w * h * 4),
                width: w,
                height: h
              } as any;
            },
            createImageData: (w: number, h: number) => {
              return {
                data: new Uint8ClampedArray(w * h * 4),
                width: w,
                height: h
              } as any;
            },
            putImageData: () => {}
          } as any;
        }
        return null;
      };

      try {
        const srcCanvas = document.createElement('canvas');
        srcCanvas.width = 2;
        srcCanvas.height = 2;

        const corners: [{x: number, y: number}, {x: number, y: number}, {x: number, y: number}, {x: number, y: number}] = [
          { x: 0, y: 0 },
          { x: 2, y: 0 },
          { x: 2, y: 2 },
          { x: 0, y: 2 },
        ];

        const resultCanvas = flattenReceipt(srcCanvas, corners);
        expect(resultCanvas).toBeInstanceOf(HTMLCanvasElement);
        // Width: max(dist(0,0 -> 2,0), dist(0,2 -> 2,2)) = max(2, 2) = 2
        // Height: max(dist(0,0 -> 0,2), dist(2,0 -> 2,2)) = max(2, 2) = 2
        expect(resultCanvas.width).toBe(2);
        expect(resultCanvas.height).toBe(2);
      } finally {
        HTMLCanvasElement.prototype.getContext = originalGetContext;
      }
    });
  });
});

