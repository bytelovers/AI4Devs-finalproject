/**
 * OCR Pipeline Worker
 *
 * Wraps the scan orchestrator inside a Comlink-exposed worker.
 * All heavy processing (preprocessing, Tesseract/Florence-2/OCR,
 * NER, receipt parsing) runs off the main thread.
 *
 * Usage (main thread):
 *   const worker = Comlink.wrap<OCRWorkerType>(new Worker('./ocr.worker.ts'))
 *   const result = await worker.processImage(dataUrl, { preferredEngine: 'tesseract-ner' })
 */

import * as Comlink from 'comlink'
import { scanTicket, enableFlorenceEngine, enableNerEngine } from '../lib/scan/orchestrator'
import type { ScanProgress, ScanResult } from '../lib/scan/types'

const api = {
  /**
   * Scan a receipt image and return structured ticket data.
   *
   * @param imageSrc - Data URL of the receipt image (jpeg/png)
   * @param options - Engine selection and pipeline options
   * @param onProgress - Optional progress callback (comlink-transferable)
   * @returns Structured scan result with items, merchant, totals
   */
  async processImage(
    imageSrc: string,
    options: {
      preferredEngine: 'tesseract' | 'tesseract-ner' | 'florence2'
      useMiniAgent?: boolean
      verboseLogs?: boolean
    },
    onProgress?: (p: ScanProgress) => void
  ): Promise<ScanResult> {
    // Enable the requested engine(s)
    if (options.preferredEngine === 'florence2') {
      enableFlorenceEngine()
    }
    if (options.preferredEngine !== 'tesseract') {
      enableNerEngine()
    }

    // Map preferredEngine to orchestrator force flags
    const forceTesseract = options.preferredEngine === 'tesseract'
    const forceTesseractNer = options.preferredEngine === 'tesseract-ner'

    if (options.verboseLogs) {
      console.log('[ocr.worker] Starting scan with engine:', options.preferredEngine)
    }

    return await scanTicket(
      { imageDataUrl: imageSrc },
      {
        forceTesseract,
        forceTesseractNer,
        useMiniAgent: options.useMiniAgent ?? false,
        engineTimeoutMs: 120_000,
        onProgress,
      }
    )
  },
}

Comlink.expose(api)
export type OCRWorkerType = typeof api
