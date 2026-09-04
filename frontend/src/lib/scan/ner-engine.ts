/**
 * Motor NER (Named Entity Recognition) con lazy loading y modelos
 * diferenciados por temática.
 *
 * Modelos disponibles:
 *   - general: onnx-community/bert-base-multilingual-cased-ner-hrl-ONNX (~110MB)
 *       NER multilingüe general. Detecta ORG, PER, LOC.
 *       Útil para identificar el merchant (ORG) en cualquier ticket.
 *
 *   - receipt: (futuro) modelo fine-tuned con dataset pilarcode/receipt-ocr
 *       Especializado en receipts españoles. Detecta ITEM, PRICE, TAX, etc.
 *       Requiere entrenamiento previo (no se puede on-device).
 *
 * El mini-agente (mini-agent.ts) decide qué modelo cargar según el contexto.
 * Solo un modelo NER puede estar en RAM a la vez (gestionado por modelManager).
 */

import type { ProgressCallback } from './types'
import { modelManager } from './model-manager'

export type NerModelType = 'general' | 'receipt'

export interface NerModelSpec {
  id: string
  type: NerModelType
  modelId: string
  label: string
  description: string
  sizeLabel: string
}

/** Modelos NER disponibles. */
export const NER_MODELS: Record<NerModelType, NerModelSpec> = {
  general: {
    id: 'ner-general',
    type: 'general',
    modelId: 'onnx-community/bert-base-multilingual-cased-ner-hrl-ONNX',
    label: 'NER General (multilingüe)',
    description: 'Detecta organizaciones, personas y lugares. Ideal para identificar el nombre del comercio.',
    sizeLabel: '~110MB',
  },
  receipt: {
    id: 'ner-receipt',
    type: 'receipt',
    modelId: 'onnx-community/bert-base-multilingual-cased-ner-hrl-ONNX', // Mismo modelo por ahora (futuro: fine-tuned)
    label: 'NER Receipts (especializado)',
    description: 'Especializado en tickets españoles. Mejor detección de items y precios. (Próximamente: fine-tuned con pilarcode/receipt-ocr)',
    sizeLabel: '~110MB',
  },
}

let transformersModule: any = null
let nerEnabled = false
let activeNerType: NerModelType | null = null

async function getTransformers() {
  if (!transformersModule) {
    transformersModule = await import('@huggingface/transformers')
  }
  return transformersModule
}

/** Activa el motor NER. */
export function enableNerEngine() {
  nerEnabled = true
}

/** Verifica si NER está activado. */
export function isNerEnabled(): boolean {
  return nerEnabled
}

/** Devuelve el tipo de NER activo. */
export function getActiveNerType(): NerModelType | null {
  return activeNerType
}

export interface NerEntity {
  entity: string
  word: string
  score: number
  start: number
  end: number
}

export interface NerResult {
  entities: NerEntity[]
  modelType: NerModelType
}

/**
 * Carga y ejecuta NER sobre un texto.
 * Usa el modelManager para garantizar lazy loading + dispose.
 */
export async function classifyWithNER(
  text: string,
  modelType: NerModelType = 'general',
  onProgress?: ProgressCallback
): Promise<NerResult> {
  const spec = NER_MODELS[modelType]
  const modelId = `${spec.id}-${spec.modelId}`

  // Cargar modelo vía modelManager (gestiona dispose del anterior)
  await modelManager.load(modelId, async () => {
    const transformers = await getTransformers()
    const { pipeline, env } = transformers
    env.allowLocalModels = false
    env.useBrowserCache = true

    onProgress?.({
      phase: 'loading-model',
      message: `Descargando modelo NER ${spec.label}…`,
      percent: 0,
    })

    const tracker = createProgressTracker(onProgress, spec.label)

    const pipe = await pipeline('token-classification', spec.modelId, {
      dtype: 'q8',
      progress_callback: tracker,
    })

    return {
      dispose: async () => {
        try {
          // Transformers.js no tiene dispose() oficial, pero podemos
          // liberar el pipeline setteándolo a undefined y forzar GC
          if (pipe?.dispose) {
            await pipe.dispose()
          }
        } catch (err) {
          console.warn('[ner] dispose falló:', err)
        }
      },
      sizeBytes: 110 * 1024 * 1024, // ~110MB estimado
    }
  })

  activeNerType = modelType
  nerEnabled = true

  onProgress?.({
    phase: 'parsing',
    message: 'Clasificando entidades con NER…',
  })

  // Ejecutar inferencia
  const output = await (async () => {
    // El pipeline puede haber sido disposeado si se cargó otro modelo
    // entre medias. En ese caso, recargar.
    try {
      return await runInference(text)
    } catch (err) {
      console.warn('[ner] inferencia falló, recargando modelo:', err)
      // Forzar recarga
      await modelManager.unloadCurrent()
      // Reintentar
      await modelManager.load(modelId, async () => {
        const transformers = await getTransformers()
        const { pipeline, env } = transformers
        env.allowLocalModels = false
        env.useBrowserCache = true
        const freshPipe = await pipeline('token-classification', spec.modelId, {
          dtype: 'q8',
        })
        return {
          dispose: async () => {
            if (freshPipe?.dispose) await freshPipe.dispose()
          },
          sizeBytes: 110 * 1024 * 1024,
        }
      })
      return await runInference(text)
    }
  })()

  const entities = Array.isArray(output) ? output : [output]
  return { entities, modelType }
}

// Cache del pipeline para reutilizar sin recargar
let cachedPipeline: any = null
let cachedPipelineId: string | null = null

async function runInference(text: string): Promise<any> {
  // El modelManager guarda la referencia pero necesitamos acceso al pipeline
  // Lo gestionamos con un cache interno sincronizado
  if (!cachedPipeline || cachedPipelineId !== getCurrentPipelineId()) {
    const transformers = await getTransformers()
    const { pipeline, env } = transformers
    env.allowLocalModels = false
    env.useBrowserCache = true
    const spec = NER_MODELS[activeNerType || 'general']
    cachedPipeline = await pipeline('token-classification', spec.modelId, {
      dtype: 'q8',
    })
    cachedPipelineId = `${spec.id}-${spec.modelId}`
  }
  return await cachedPipeline(text)
}

function getCurrentPipelineId(): string | null {
  const current = modelManager.getCurrent()
  return current?.id ?? null
}

/** Resetea el motor NER. */
export function resetNerEngine() {
  nerEnabled = false
  activeNerType = null
  cachedPipeline = null
  cachedPipelineId = null
}

// Tracker simple para progreso de descarga
function createProgressTracker(onProgress: ProgressCallback | undefined, label: string) {
  return (info: any) => {
    if (info.status === 'progress' && info.loaded !== undefined && info.total) {
      const percent = info.total > 0 ? Math.round((info.loaded / info.total) * 100) : 0
      onProgress?.({
        phase: 'loading-model',
        message: `Descargando ${label}… ${info.file ?? ''}`.trim(),
        percent,
      })
    } else if (info.status === 'done') {
      onProgress?.({
        phase: 'loading-model',
        message: `${label} listo`,
        percent: 100,
      })
    }
  }
}
