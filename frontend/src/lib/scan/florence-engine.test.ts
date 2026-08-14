import { describe, it, expect } from 'vitest'
import { reconstructLinesFromRegions } from './florence-engine'

describe('reconstructLinesFromRegions', () => {
  it('ordena líneas por coordenada Y y agrupa por tope', () => {
    // Datos reales del ticket de La Maquinista (del log de OCR_WITH_REGION),
    // con las líneas DESORDENADAS a propósito para validar el sort por Y.
    // quad_box: [x1,y1,x2,y1b,x2b,y2b,x1b,y2]
    const labels = [
      '1 Santa Monica',
      'LA MAGUINISTA',
      'Sub-Total',
      '1 1/2 Star Ribs',
    ]
    const quadBoxes = [
      [153.3, 74.8, 401.7, 71.6, 401.7, 86, 153.3, 89.2], // y~75 LA MAGUINISTA
      [213.3, 5.2, 342.3, 2.8, 342.3, 13.2, 213.3, 15.6], // y~5 header
      [22.5, 301.2, 40.5, 301.2, 40.5, 317.2, 22.5, 317.2], // y~301 Sub-Total
      [87.9, 245.2, 291.9, 242.8, 291.9, 260.4, 87.9, 262.8], // y~245 Star Ribs
    ]

    const result = reconstructLinesFromRegions(labels, quadBoxes)

    expect(result).toBe(
      'LA MAGUINISTA\n1 Santa Monica\n1 1/2 Star Ribs\nSub-Total'
    )
  })

  it('agrupa fragmentos de la misma línea por X', () => {
    // Dos fragmentos de la misma línea (mismo Y) ordenados por X
    const labels = ['TOTAL', '38,85']
    const quadBoxes = [
      [87.9, 301.2, 167.7, 301.2, 167.7, 317.2, 87.9, 317.2], // x~88 TOTAL
      [327.3, 301.2, 461.7, 300.4, 461.7, 318.2, 327.3, 318.2], // x~327 38,85
    ]

    const result = reconstructLinesFromRegions(labels, quadBoxes)
    expect(result).toBe('TOTAL 38,85')
  })

  it('devuelve string vacío sin labels', () => {
    expect(reconstructLinesFromRegions([], [])).toBe('')
  })
})
