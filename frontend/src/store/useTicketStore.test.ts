import { describe, it, expect, beforeEach } from 'vitest';
import { useTicketStore } from './useTicketStore';

describe('useTicketStore Zustand Store', () => {
  beforeEach(() => {
    useTicketStore.getState().resetStore();
  });

  it('should initialize with correct default state', () => {
    const state = useTicketStore.getState();
    expect(state.imageSrc).toBeNull();
    expect(state.processedImageSrc).toBeNull();
    expect(state.ocrStatus).toBe('idle');
    expect(state.ocrProgress).toBe(0);
    expect(state.rawWords).toEqual([]);
    expect(state.groupedLines).toEqual([]);
    expect(state.finalJson).toBeNull();
    expect(state.threshold).toBe(128);
  });

  it('should update image sources', () => {
    const store = useTicketStore.getState();

    store.setImageSrc('data:image/png;base64,123');
    store.setProcessedImageSrc('data:image/png;base64,456');

    const updatedState = useTicketStore.getState();
    expect(updatedState.imageSrc).toBe('data:image/png;base64,123');
    expect(updatedState.processedImageSrc).toBe('data:image/png;base64,456');
  });

  it('should update OCR status and progress', () => {
    const store = useTicketStore.getState();

    store.setOcrStatus('recognizing');
    store.setOcrProgress(45);

    const updatedState = useTicketStore.getState();
    expect(updatedState.ocrStatus).toBe('recognizing');
    expect(updatedState.ocrProgress).toBe(45);
  });

  it('should update threshold values', () => {
    const store = useTicketStore.getState();

    store.setThreshold(180);
    expect(useTicketStore.getState().threshold).toBe(180);
  });

  it('should update raw words, grouped lines and final JSON', () => {
    const store = useTicketStore.getState();

    const mockWords = [
      { text: 'Hola', confidence: 99, bbox: { x0: 0, y0: 0, x1: 10, y1: 10 } }
    ];
    const mockLines = ['Hola'];
    const mockJson = { totalAmount: 10 };

    store.setRawWords(mockWords);
    store.setGroupedLines(mockLines);
    store.setFinalJson(mockJson);

    const updatedState = useTicketStore.getState();
    expect(updatedState.rawWords).toEqual(mockWords);
    expect(updatedState.groupedLines).toEqual(mockLines);
    expect(updatedState.finalJson).toEqual(mockJson);
  });

  it('should reset store back to initial values', () => {
    const store = useTicketStore.getState();

    store.setImageSrc('something');
    store.setThreshold(200);
    store.resetStore();

    const resetState = useTicketStore.getState();
    expect(resetState.imageSrc).toBeNull();
    expect(resetState.threshold).toBe(128);
  });
});
