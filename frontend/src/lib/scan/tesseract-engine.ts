/**
 * Motor de escaneo con Tesseract.js (OCR clásico en WASM).
 * Funciona en cualquier navegador, sin WebGPU.
 * Precisión media para receipts; el preprocesamiento ayuda bastante.
 */

import type { ScanResult, ProgressCallback } from './types'
import { parseReceiptText } from './receipt-parser'

let tesseractWorkerPromise: Promise<any> | null = null

async function getWorker(onProgress?: ProgressCallback) {
  if (tesseractWorkerPromise) return tesseractWorkerPromise

  tesseractWorkerPromise = (async () => {
    const Tesseract = await import('tesseract.js')
    const worker = await Tesseract.createWorker('spa', 1, {
      logger: (m: any) => {
        if (m.status === 'recognizing text') {
          onProgress?.({
            phase: 'running-inference',
            message: 'Leyendo texto del ticket…',
            percent: Math.round(m.progress * 100),
          })
        } else if (m.status === 'loading language traineddata') {
          onProgress?.({
            phase: 'loading-model',
            message: 'Cargando datos de idioma español…',
            percent: Math.round((m.progress || 0) * 100),
          })
        } else if (m.status === 'initializing api') {
          onProgress?.({
            phase: 'loading-model',
            message: 'Inicializando OCR…',
          })
        }
      },
      // Configurar para que use caché del navegador cuando esté disponible.
      // Tesseract.js descarga los datos de idioma desde un CDN por defecto.
      // Si no hay conexión y no están cacheados, fallará con error de red.
      errorHandler: (err: any) => {
        console.warn('[tesseract] worker error:', err)
      },
    })
    return worker
  })()

  return tesseractWorkerPromise
}

/**
 * Ejecuta Tesseract.js sobre la imagen y devuelve el texto del ticket.
 */
export async function scanWithTesseract(
  imageDataUrl: string,
  onProgress?: ProgressCallback
): Promise<ScanResult> {
  onProgress?.({
    phase: 'preprocessing',
    message: 'Mejorando imagen del ticket…',
  })

  // 1. Preprocesar: solo reescalado + contraste suave, SIN escala de grises
  // Tesseract funciona mejor con imágenes en color que con escala de grises forzada.
  let preprocessed = imageDataUrl
  try {
    preprocessed = await resizeAndEnhance(imageDataUrl, 1600)
  } catch (err) {
    console.warn('[tesseract] preprocesamiento falló, usando original:', err)
  }

  onProgress?.({
    phase: 'loading-model',
    message: 'Cargando OCR…',
  })

  // 2. Cargar worker
  const worker = await getWorker(onProgress)

  // 3. Reconocimiento
  const result = await worker.recognize(preprocessed)
  const rawText: string = result?.data?.text ?? ''

  // Log del texto crudo para debug
  console.log('[tesseract] OCR raw output:\n', rawText)

  onProgress?.({
    phase: 'parsing',
    message: 'Estructurando datos del ticket…',
  })

  // 4. Parsear
  const parsed = parseReceiptText(rawText)
  console.log('[tesseract] Parsed result:', {
    items: parsed.items,
    discounts: parsed.discounts,
    merchant: parsed.merchant,
    total: parsed.total,
  })

  onProgress?.({
    phase: 'done',
    message: 'Escaneo completado',
  })

  return {
    ...parsed,
    engine: 'tesseract',
    preprocessedImageDataUrl: preprocessed,
    rawText,
  }
}

/** Resetea el worker cacheado. */
export function resetTesseractWorker() {
  tesseractWorkerPromise = null
}

/**
 * Reescala la imagen y aplica un aumento de contraste suave (sin convertir a gris).
 * Tesseract funciona mejor con imágenes en color que con escala de grises forzada.
 */
async function resizeAndEnhance(
  imageDataUrl: string,
  maxWidth: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width)
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) {
        resolve(imageDataUrl)
        return
      }
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, w, h)

      // Aumento de contraste suave (1.1x) preservando color
      const imageData = ctx.getImageData(0, 0, w, h)
      const data = imageData.data
      const contrast = 1.1
      const intercept = 128 * (1 - contrast)
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.max(0, Math.min(255, contrast * data[i] + intercept))
        data[i + 1] = Math.max(0, Math.min(255, contrast * data[i + 1] + intercept))
        data[i + 2] = Math.max(0, Math.min(255, contrast * data[i + 2] + intercept))
      }
      ctx.putImageData(imageData, 0, 0)
      resolve(canvas.toDataURL('image/jpeg', 0.92))
    }
    img.onerror = () => reject(new Error('No se pudo cargar la imagen'))
    img.src = imageDataUrl
  })
}
