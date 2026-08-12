/**
 * Motor de escaneo con Florence-2 vía Transformers.js + WebGPU.
 * Modelo: onnx-community/Florence-2-base (230M params, ~400MB ONNX).
 *
 * Florence-2 se usa con la API de clases (Florence2ForConditionalGeneration + AutoProcessor)
 * en lugar de pipeline genérico, porque la arquitectura requiere preprocesador específico.
 *
 * Task prompts soportados:
 *   <OCR> — extrae todo el texto del documento en orden de lectura
 *   <OCR_WITH_REGION> — texto + bounding boxes
 *
 * Para receipts usamos <OCR> y luego un parser heurístico español.
 */

import type { ScanResult, ProgressCallback } from './types'
import { preprocessReceiptImage } from './preprocessor'
import { DownloadTracker } from './download-tracker'
import { parseReceiptText } from './receipt-parser'

// Lazy-loaded Transformers.js
let transformersModule: any = null
let modelPromise: Promise<{ model: any; processor: any }> | null = null

const MODEL_ID = 'onnx-community/Florence-2-base'

async function getTransformers() {
  if (!transformersModule) {
    transformersModule = await import('@huggingface/transformers')
  }
  return transformersModule
}

/**
 * Carga el modelo y el procesador de Florence-2.
 * Se cachea automáticamente en el navegador tras la primera descarga.
 */
async function getModel(
  onProgress?: ProgressCallback
): Promise<{ model: any; processor: any }> {
  if (modelPromise) return modelPromise

  modelPromise = (async () => {
    const transformers = await getTransformers()
    const { Florence2ForConditionalGeneration, AutoProcessor, env } = transformers

    env.allowLocalModels = false
    env.useBrowserCache = true

    // Detectar WebGPU
    const useWebGPU =
      typeof navigator !== 'undefined' && 'gpu' in navigator && !!navigator.gpu

    onProgress?.({
      phase: 'loading-model',
      message: useWebGPU
        ? 'Descargando modelo Florence-2 (WebGPU activo)…'
        : 'Descargando modelo Florence-2…',
      percent: 0,
    })

    // Tracker para agregar progreso de múltiples archivos
    const tracker = new DownloadTracker()

    const progressCb = (info: any) => {
      const summary = tracker.update(info)
      const shortName = info?.file
        ? info.file.split('/').pop() ?? info.file
        : ''
      let message: string
      if (info?.status === 'initiate') {
        message = `Preparando ${shortName}…`
      } else if (info?.status === 'progress') {
        message = `Descargando ${shortName}`
      } else if (info?.status === 'done') {
        message = `${shortName} listo`
      } else {
        message = 'Descargando modelo…'
      }
      onProgress?.({
        phase: 'loading-model',
        message,
        percent: summary.percent,
        download: summary,
      })
    }

    const [model, processor] = await Promise.all([
      Florence2ForConditionalGeneration.from_pretrained(MODEL_ID, {
        dtype: {
          embed_tokens: useWebGPU ? 'fp32' : 'q4',
          vision_encoder: useWebGPU ? 'fp32' : 'q4',
          decoder_model_merged: useWebGPU ? 'fp32' : 'q4',
        },
        device: useWebGPU ? 'webgpu' : 'wasm',
        progress_callback: progressCb,
      }),
      AutoProcessor.from_pretrained(MODEL_ID, {
        progress_callback: progressCb,
      }),
    ])

    // Notificar fin de descarga
    onProgress?.({
      phase: 'loading-model',
      message: 'Modelo listo',
      percent: 100,
    })

    return { model, processor }
  })()

  return modelPromise
}

/**
 * Ejecuta Florence-2 sobre la imagen y devuelve el texto del ticket.
 */
export async function scanWithFlorence(
  imageDataUrl: string,
  onProgress?: ProgressCallback
): Promise<ScanResult> {
  onProgress?.({
    phase: 'preprocessing',
    message: 'Mejorando imagen del ticket…',
  })

  // 1. Preprocesar imagen con canvas (rápido y sin dependencias)
  // La imagen ya viene preprocesada desde el main thread (CameraScanFlow).
  // Florence-2 es un VLM: re-aplicar equalize/contraste agresivos aquí degrada
  // la imagen y produce texto vacío. Solo reescalar y dejar el resto intacto.
  const preprocessed = await preprocessReceiptImage(imageDataUrl, {
    maxWidth: 1280,
    equalizeHistogram: false,
    contrast: 1.0,
    denoise: false,
  })
  // TODO(diagnostico): temporal — quitar tras confirmar el fix
  console.log('[florence] preprocessed length:', preprocessed.length, 'prefix:', preprocessed.slice(0, 40))

  onProgress?.({
    phase: 'loading-model',
    message: 'Preparando motor de IA…',
  })

  // 2. Cargar modelo
  const { model, processor } = await getModel(onProgress)

  onProgress?.({
    phase: 'running-inference',
    message: 'Leyendo ticket con IA…',
  })

  // 3. Cargar imagen con RawImage.fromDataURL (o equivalente)
  const transformers = await getTransformers()
  const { RawImage } = transformers
  const image = await RawImage.fromURL(preprocessed)
  // TODO(diagnostico): temporal — quitar tras confirmar el fix
  console.log('[florence] image decoded:', image?.width, 'x', image?.height)

  // 4. Preprocesar inputs con el task prompt <OCR>
  const inputs = await processor(image, '<OCR>')

  // 5. Generar output
  const output = await model.generate({
    ...inputs,
    max_new_tokens: 2048,
  })

  // 6. Decodificar
  const decoded = processor.batch_decode(output, {
    skip_special_tokens: true,
  })
  const rawText: string = decoded?.[0] ?? ''
  // TODO(diagnostico): temporal — quitar tras confirmar el fix
  console.log('[florence] rawText:', JSON.stringify(rawText.slice(0, 300)))
  console.log('[florence] decoded length:', decoded?.length, 'output shape:', JSON.stringify(output)?.slice(0, 200))

  onProgress?.({
    phase: 'parsing',
    message: 'Estructurando datos del ticket…',
  })

  // 7. Parsear texto a estructura
  const parsed = parseReceiptText(rawText)

  onProgress?.({
    phase: 'done',
    message: 'Escaneo completado',
  })

  return {
    ...parsed,
    engine: 'florence2',
    preprocessedImageDataUrl: preprocessed,
    rawText,
  }
}

/**
 * Precarga el modelo Florence-2 sin hacer inferencia.
 * Útil para la pantalla de onboarding: permite mostrar progreso de descarga.
 */
export async function prewarmFlorenceModel(
  onProgress?: ProgressCallback
): Promise<void> {
  await getModel(onProgress)
}

/** Resetea el cache del modelo (para tests). */
export function resetFlorenceModel() {
  modelPromise = null
  transformersModule = null
}
