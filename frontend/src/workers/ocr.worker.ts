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
import type { ScanProgress, ScanResult, PreprocessedSection, SectionOcrPayload } from '../lib/scan/types'

export interface ProcessSectionsOptions {
  preferredEngine: 'tesseract' | 'tesseract-ner' | 'florence2' | 'server'
  useMiniAgent?: boolean
  verboseLogs?: boolean
}

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
      preferredEngine: 'tesseract' | 'tesseract-ner' | 'florence2' | 'server'
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
        // TODO(experimento florence): OCR_WITH_REGION genera más tokens (loc_),
        // en WASM puede superar 120s. Subido temporalmente para el experimento.
        engineTimeoutMs: 300_000,
        verboseLogs: options.verboseLogs ?? false,
        onProgress,
      }
    )
  },

  /**
   * Batch process multiple receipt crop sections.
   */
  async processSections(
    sections: PreprocessedSection[],
    options: ProcessSectionsOptions,
    onProgress?: (p: ScanProgress & { sectionId?: string }) => void
  ): Promise<SectionOcrPayload[]> {
    if (options.preferredEngine === 'florence2') {
      enableFlorenceEngine()
    }
    if (options.preferredEngine !== 'tesseract') {
      enableNerEngine()
    }

    const forceTesseract = options.preferredEngine === 'tesseract'
    const forceTesseractNer = options.preferredEngine === 'tesseract-ner'

    const results: SectionOcrPayload[] = []
    const totalSections = sections.length

    for (let i = 0; i < totalSections; i++) {
      const sec = sections[i]
      if (typeof onProgress === 'function') {
        try {
          await onProgress({
            phase: 'running-inference',
            message: `Escaneando sección ${i + 1} de ${totalSections}…`,
            percent: Math.round(((i + 0.5) / totalSections) * 100),
            sectionId: sec.sectionId,
          })
        } catch {
          // Callback Proxy unmounted or detached
        }
      }

      const scanRes = await scanTicket(
        { imageDataUrl: sec.dataUrl },
        {
          forceTesseract,
          forceTesseractNer,
          useMiniAgent: options.useMiniAgent ?? false,
          // TODO(experimento florence): OCR_WITH_REGION genera más tokens (loc_),
          // en WASM puede superar 120s. Subido temporalmente para el experimento.
          engineTimeoutMs: 300_000,
          verboseLogs: options.verboseLogs ?? false,
          onProgress: typeof onProgress === 'function' ? (p) => {
            try {
              onProgress(p)
            } catch {
              // ignore proxy detachment
            }
          } : undefined,
        }
      )

      results.push({
        sectionId: sec.sectionId,
        order: sec.order,
        scanResult: scanRes,
      })
    }

    return results
  },
}

Comlink.expose(api)
export type OCRWorkerType = typeof api
