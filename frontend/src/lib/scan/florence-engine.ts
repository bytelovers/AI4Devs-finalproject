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
  onProgress?: ProgressCallback,
  verboseLogs = false
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

  // 4. Preprocesar inputs con el task prompt.
  //    <OCR> devuelve texto pegado sin saltos (imposible de parsear bien).
  //    <OCR_WITH_REGION> + post_process_generation devuelve labels + quad_boxes
  //    (texto + coordenadas), permitiendo reconstruir líneas por coordenada Y.
  const inputs = await processor(image, '<OCR_WITH_REGION>')

  // 5. Generar output
  const output = await model.generate({
    ...inputs,
    max_new_tokens: 2048,
  })

  // 6. Decodificar. IMPORTANTE: con OCR_WITH_REGION debemos conservar los
  //    tokens <loc_...> (coordenadas). skip_special_tokens: true los elimina
  //    y post_process_generation no podría reconstruir las regiones.
  const decoded = processor.batch_decode(output, {
    skip_special_tokens: false,
  })
  const rawText: string = decoded?.[0] ?? ''

  // 7. Post-procesar con regiones: labels + quad_boxes -> líneas ordenadas por Y.
  let ocrText = rawText
  try {
    const regionResult = processor.post_process_generation(
      rawText,
      '<OCR_WITH_REGION>',
      [image.width, image.height]
    )
    const regions = regionResult?.['<OCR_WITH_REGION>']
    if (regions?.labels && regions?.quad_boxes) {
      ocrText = reconstructLinesFromRegions(regions.labels, regions.quad_boxes)
    }
  } catch (e) {
    console.warn('[florence] post_process_generation falló, usando texto crudo:', e)
  }

  if (verboseLogs) {
    console.log('[florence] OCR texto reconstruido:\n', ocrText)
  }

  onProgress?.({
    phase: 'parsing',
    message: 'Estructurando datos del ticket…',
  })

  // 8. Parsear texto a estructura (multi-línea reconstruida)
  const parsed = parseReceiptText(ocrText)

  onProgress?.({
    phase: 'done',
    message: 'Escaneo completado',
  })

  return {
    ...parsed,
    engine: 'florence2',
    preprocessedImageDataUrl: preprocessed,
    rawText: ocrText,
  }
}

/**
 * Reconstruye el texto multi-línea de un ticket desde las regiones detectadas
 * por Florence-2 (<OCR_WITH_REGION>). Cada quad_box es [x1,y1,x2,y1b,x2b,y2b,x1b,y2]
 * donde (y1, y1b) son los Y del tope de la línea. Ordenamos por Y (agrupando
 * líneas con el mismo tope aproximado) y luego por X, devolviendo el texto con
 * saltos de línea reales que parseReceiptText puede procesar.
 */
export function reconstructLinesFromRegions(
  labels: string[],
  quadBoxes: number[][]
): string {
  if (!labels || !quadBoxes || labels.length === 0) return ''

  const LINE_Y_TOLERANCE = 6

  // Ordenar por Y del tope (índices 1 y 3 son los Y superiores del quad)
  const entries = labels
    .map((label, i) => ({
      label,
      box: quadBoxes[i] ?? [0, 0, 0, 0, 0, 0, 0, 0],
    }))
    .filter((e) => e.label && e.label.trim().length > 0)
    .sort((a, b) => {
      const yA = Math.min(a.box[1], a.box[3])
      const yB = Math.min(b.box[1], b.box[3])
      return yA - yB
    })

  // Agrupar en líneas: mismo tope Y dentro de la tolerancia
  const lines: Array<Array<{ text: string; x: number }>> = []
  let currentLineY: number | null = null
  for (const entry of entries) {
    const yTop = Math.min(entry.box[1], entry.box[3])
    const xLeft = Math.min(entry.box[0], entry.box[6])
    if (
      currentLineY === null ||
      Math.abs(yTop - currentLineY) > LINE_Y_TOLERANCE
    ) {
      lines.push([{ text: entry.label, x: xLeft }])
      currentLineY = yTop
    } else {
      lines[lines.length - 1].push({ text: entry.label, x: xLeft })
    }
  }

  // Dentro de cada línea, ordenar por X y unir con espacio
  return lines
    .map((line) =>
      line
        .sort((a, b) => a.x - b.x)
        .map((c) => c.text.trim())
        .join(' ')
        .trim()
    )
    .filter((l) => l.length > 0)
    .join('\n')
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
