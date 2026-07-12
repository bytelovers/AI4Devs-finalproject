/**
 * Preprocesador de imagen para mejorar la precisión del OCR/VLM.
 * Implementado 100% con Canvas API (sin OpenCV.js ni dependencias externas).
 *
 * Pipeline:
 * 1. Reescalado a resolución óptima para el modelo (preservando aspect ratio)
 * 2. Conversión a escala de grises (luminancia ponderada)
 * 3. Equalización de histograma (similar a CLAHE pero más simple y rápido)
 * 4. Aumento de contraste adaptativo
 * 5. Filtro de mediana para reducir ruido (opcional, solo si la imagen es ruidosa)
 *
 * Todo se ejecuta en el main thread pero con imágenes ya reescaladas el coste
 * es <200ms en móvil. No hay downloads externos, no hay WASM que inicializar.
 */

interface PreprocessOptions {
  /** Ancho máximo de salida. Default 1280. */
  maxWidth?: number
  /** Si aplicar equalización de histograma. Default true. */
  equalizeHistogram?: boolean
  /** Factor de contraste adicional (1.0 = sin cambio). Default 1.2. */
  contrast?: number
  /** Si aplicar filtro de mediana 3x3. Default false (es caro). */
  denoise?: boolean
}

/**
 * Preprocesa una imagen de ticket para mejorar el OCR.
 * Devuelve data URL JPEG de la imagen procesada.
 */
export async function preprocessReceiptImage(
  imageDataUrl: string,
  options: PreprocessOptions = {}
): Promise<string> {
  const {
    maxWidth = 1280,
    equalizeHistogram = true,
    contrast = 1.2,
    denoise = false,
  } = options

  try {
    const img = await loadImageElement(imageDataUrl)

    // 1. Reescalar manteniendo aspect ratio
    const scale = Math.min(1, maxWidth / img.width)
    const targetW = Math.round(img.width * scale)
    const targetH = Math.round(img.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = targetW
    canvas.height = targetH
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) {
      // Sin contexto 2D, devolver original
      return imageDataUrl
    }

    // Usar imageSmoothingQuality alta para el reescalado
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, 0, 0, targetW, targetH)

    const imageData = ctx.getImageData(0, 0, targetW, targetH)
    const data = imageData.data

    // 2. Escala de grises (luminancia ponderada BT.601)
    const gray = new Uint8ClampedArray(targetW * targetH)
    for (let i = 0, j = 0; i < data.length; i += 4, j++) {
      gray[j] = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) | 0
    }

    // 3. Equalización de histograma (estira el rango dinámico)
    let working = gray
    if (equalizeHistogram) {
      working = equalizeHistogramFn(gray)
    }

    // 4. Aumento de contraste lineal
    if (contrast !== 1.0) {
      const intercept = 128 * (1 - contrast)
      for (let i = 0; i < working.length; i++) {
        working[i] = Math.max(0, Math.min(255, contrast * working[i] + intercept))
      }
    }

    // 5. Filtro de mediana 3x3 (opcional, reduce ruido sal/pimienta)
    if (denoise) {
      working = medianFilter3x3(working, targetW, targetH)
    }

    // 6. Escribir de vuelta al ImageData como grayscale RGB
    for (let i = 0, j = 0; i < data.length; i += 4, j++) {
      const v = working[j]
      data[i] = v
      data[i + 1] = v
      data[i + 2] = v
      data[i + 3] = 255
    }

    ctx.putImageData(imageData, 0, 0)
    return canvas.toDataURL('image/jpeg', 0.92)
  } catch (err) {
    console.warn('[preprocess] error, devolviendo original:', err)
    return imageDataUrl
  }
}

/**
 * Equalización de histograma simple.
 * Calcula el histograma de la imagen, la CDF y mapea cada pixel
 * al valor equalizado. Mejora el contraste en imágenes con iluminación irregular.
 */
export function equalizeHistogramFn(
  gray: Uint8ClampedArray
): Uint8ClampedArray {
  const hist = new Uint32Array(256)
  for (let i = 0; i < gray.length; i++) {
    hist[gray[i]]++
  }

  // CDF (cumulative distribution function)
  const cdf = new Uint32Array(256)
  let sum = 0
  for (let i = 0; i < 256; i++) {
    sum += hist[i]
    cdf[i] = sum
  }

  // Encontrar cdf min no-cero
  let cdfMin = 0
  for (let i = 0; i < 256; i++) {
    if (cdf[i] > 0) {
      cdfMin = cdf[i]
      break
    }
  }

  const total = gray.length
  const lut = new Uint8ClampedArray(256)
  const denom = total - cdfMin
  if (denom <= 0) {
    // Imagen uniforme, no equalizar
    return gray
  }
  for (let i = 0; i < 256; i++) {
    lut[i] = Math.round(((cdf[i] - cdfMin) / denom) * 255)
  }

  const result = new Uint8ClampedArray(gray.length)
  for (let i = 0; i < gray.length; i++) {
    result[i] = lut[gray[i]]
  }
  return result
}

/**
 * Filtro de mediana 3x3 para reducir ruido sal/pimienta.
 * Más lento que un promedio pero preserva bordes.
 */
export function medianFilter3x3(
  src: Uint8ClampedArray,
  width: number,
  height: number
): Uint8ClampedArray {
  const dst = new Uint8ClampedArray(src.length)
  const window = new Uint8ClampedArray(9)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let k = 0
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const sx = Math.min(width - 1, Math.max(0, x + dx))
          const sy = Math.min(height - 1, Math.max(0, y + dy))
          window[k++] = src[sy * width + sx]
        }
      }
      // Insertion sort (solo 9 elementos)
      for (let i = 1; i < 9; i++) {
        const v = window[i]
        let j = i - 1
        while (j >= 0 && window[j] > v) {
          window[j + 1] = window[j]
          j--
        }
        window[j + 1] = v
      }
      dst[y * width + x] = window[4] // mediana
    }
  }
  return dst
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = (e) => reject(new Error('No se pudo cargar la imagen'))
    img.src = src
  })
}
