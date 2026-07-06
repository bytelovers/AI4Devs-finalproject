import { describe, it, expect, vi } from 'vitest';
import { convertToGrayscale, computeOtsuThreshold, binarizeImage } from './image.utils';

// Mock Dexie DB to prevent errors in Node environment
vi.mock('../db/localDB', () => {
  return {
    db: {
      tickets: {
        add: vi.fn().mockResolvedValue(1),
        toArray: vi.fn().mockResolvedValue([]),
      },
      items: {
        add: vi.fn().mockResolvedValue(1),
      },
    },
  };
});

// Mock Workers Comlink proxies
const mockOcrWorker = {
  processImage: vi.fn().mockResolvedValue({
    text: 'Restaurante El Molino\n2 Hamburguesa 20.00\nTotal 20.00',
    confidence: 92,
    lines: ['Restaurante El Molino', '2 Hamburguesa 20.00', 'Total 20.00'],
    words: []
  }),
};

const mockLlmWorker = {
  parseReceiptText: vi.fn().mockResolvedValue({
    establishmentName: 'Restaurante El Molino',
    date: '06/07/2026',
    time: '19:30',
    table: '4',
    diners: 2,
    subtotal: 18.18,
    taxes: 1.82,
    discounts: 0,
    items: [{ name: 'Hamburguesa', price: 10.00, quantity: 2, total: 20.00 }],
    totalAmount: 20.00,
    paymentMethod: 'Tarjeta',
    metadata: {
      reprinted: false,
      ocrConfidence: 92,
      processingTimeMs: 150,
    }
  }),
};

describe('OCR Pipeline Integration Flow', () => {
  it('should preprocess image, run mock OCR, and parse via mock LLM worker', async () => {
    // 1. Preprocess: Simulate image input (10x10 dummy pixel data)
    const data = new Uint8ClampedArray(400);
    const mockImageData = {
      data,
      width: 10,
      height: 10,
    } as ImageData;

    const grayscale = convertToGrayscale(mockImageData);
    const threshold = computeOtsuThreshold(grayscale);
    expect(threshold).toBe(128); // Flat black image yields default threshold

    const binarized = binarizeImage(mockImageData, threshold);
    expect(binarized).toBeDefined();

    // 2. Call OCR worker mock
    const ocrResult = await mockOcrWorker.processImage(binarized);
    expect(ocrResult.text).toContain('Restaurante El Molino');
    expect(ocrResult.confidence).toBe(92);

    // 3. Call LLM worker mock
    const parsedJson = await mockLlmWorker.parseReceiptText(ocrResult.text, ocrResult.confidence);
    expect(parsedJson.establishmentName).toBe('Restaurante El Molino');
    expect(parsedJson.totalAmount).toBe(20.00);
    expect(parsedJson.items).toHaveLength(1);
    expect(parsedJson.items[0].name).toBe('Hamburguesa');
  });
});
