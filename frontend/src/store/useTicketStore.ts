import { create } from 'zustand';

export type OCRStatus = 'idle' | 'preprocessing' | 'recognizing' | 'success' | 'failed';

export interface RawWord {
  text: string;
  confidence: number;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

export interface TicketStoreState {
  imageSrc: string | null;
  processedImageSrc: string | null;
  ocrStatus: OCRStatus;
  ocrProgress: number;
  rawWords: RawWord[];
  groupedLines: string[];
  finalJson: any | null;
  threshold: number;

  setImageSrc: (src: string | null) => void;
  setProcessedImageSrc: (src: string | null) => void;
  setOcrStatus: (status: OCRStatus) => void;
  setOcrProgress: (progress: number) => void;
  setRawWords: (words: RawWord[]) => void;
  setGroupedLines: (lines: string[]) => void;
  setFinalJson: (json: any | null) => void;
  setThreshold: (threshold: number) => void;
  resetStore: () => void;
}

const initialState = {
  imageSrc: null,
  processedImageSrc: null,
  ocrStatus: 'idle' as OCRStatus,
  ocrProgress: 0,
  rawWords: [],
  groupedLines: [],
  finalJson: null,
  threshold: 128,
};

export const useTicketStore = create<TicketStoreState>((set) => ({
  ...initialState,

  setImageSrc: (imageSrc) => set({ imageSrc }),
  setProcessedImageSrc: (processedImageSrc) => set({ processedImageSrc }),
  setOcrStatus: (ocrStatus) => set({ ocrStatus }),
  setOcrProgress: (ocrProgress) => set({ ocrProgress }),
  setRawWords: (rawWords) => set({ rawWords }),
  setGroupedLines: (groupedLines) => set({ groupedLines }),
  setFinalJson: (finalJson) => set({ finalJson }),
  setThreshold: (threshold) => set({ threshold }),
  resetStore: () => set({ ...initialState }),
}));
