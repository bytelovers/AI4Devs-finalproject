import * as Comlink from 'comlink';
import { createWorker } from 'tesseract.js';

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

export interface OCRResult {
  text: string;
  confidence: number;
  lines: string[];
  words: RawWord[];
}

let workerInstance: any = null;

function groupWordsIntoLines(words: RawWord[], tolerance = 15): string[] {
  if (words.length === 0) return [];

  interface LineGroup {
    words: RawWord[];
    yCenter: number;
  }

  const lines: LineGroup[] = [];

  for (const word of words) {
    const wYCenter = (word.bbox.y0 + word.bbox.y1) / 2;
    let placed = false;

    // Find if there is an existing line that has yCenter close to this word's center
    for (const line of lines) {
      if (Math.abs(line.yCenter - wYCenter) <= tolerance) {
        line.words.push(word);
        // Update average yCenter of the line
        const totalY = line.words.reduce((sum, w) => sum + (w.bbox.y0 + w.bbox.y1) / 2, 0);
        line.yCenter = totalY / line.words.length;
        placed = true;
        break;
      }
    }

    if (!placed) {
      lines.push({
        words: [word],
        yCenter: wYCenter,
      });
    }
  }

  // Sort the line groups vertically from top to bottom
  lines.sort((a, b) => a.yCenter - b.yCenter);

  // For each line group, sort its words horizontally from left to right, then join them
  return lines.map(line => {
    const sortedLineWords = [...line.words].sort((a, b) => a.bbox.x0 - b.bbox.x0);
    return sortedLineWords.map(w => w.text).join(' ');
  });
}

const api = {
  async processImage(
    imageSrc: string,
    onProgress: (progress: number) => void
  ): Promise<OCRResult> {
    try {
      if (!workerInstance) {
        // Initialize Tesseract worker with Spanish and English
        workerInstance = await createWorker('spa+eng', 1, {
          workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/worker.min.js',
          corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.0/tesseract-core.wasm.js',
          langPath: 'https://tessdata.projectnaptha.com/4.0.0',
          logger: (m) => {
            if (m.status === 'recognizing') {
              // Comlink can pass function proxies to workers
              onProgress(m.progress);
            }
          },
        });
      }

      // Perform OCR
      const { data } = await workerInstance.recognize(imageSrc);

      // Extract raw words
      const rawWords: RawWord[] = (data.words || []).map((w: any) => ({
        text: w.text,
        confidence: w.confidence,
        bbox: {
          x0: w.bbox.x0,
          y0: w.bbox.y0,
          x1: w.bbox.x1,
          y1: w.bbox.y1,
        },
      }));

      // Group words into lines
      const lines = groupWordsIntoLines(rawWords, 15);

      return {
        text: data.text,
        confidence: data.confidence,
        lines,
        words: rawWords,
      };
    } catch (error) {
      console.error('OCR Worker Error:', error);
      throw error;
    }
  },

  async terminate() {
    if (workerInstance) {
      await workerInstance.terminate();
      workerInstance = null;
    }
  }
};

Comlink.expose(api);
export type OCRWorkerType = typeof api;
