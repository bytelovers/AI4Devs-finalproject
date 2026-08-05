// Batería de casos de uso EDGE que el análisis inicial podría haber omitido.
// Importa el parser REAL para verificar comportamiento actual.
import { parseReceiptText } from '../frontend/src/lib/scan/receipt-parser.ts'

const cases = [
  // --- Casos ya cubiertos en el análisis (baseline) ---
  { id: 'base-1', label: 'BASELINE: 1 precio sin cantidad (Cerveza 5,00)', input: 'Cerveza 5,00' },
  { id: 'base-2', label: 'BASELINE: cantidad al inicio (2 Cerveza 5,00)', input: '2 Cerveza 5,00' },
  { id: 'base-3', label: 'BASELINE: 2 precios [cant,total] (2,00 5,00)', input: '2,00 5,00' },
  { id: 'base-4', label: 'BASELINE: 2 precios [cant,unit] (2,00 2,50)', input: '2,00 2,50' },
  { id: 'base-5', label: 'BASELINE: 3 precios [cant,unit,total]', input: 'ENTRECOTTE 4,00 22,80 45,20' },

  // --- Casos de cantidad que el análisis NO cubrió ---
  { id: 'qty-1', label: 'QTY: cantidad en medio con entero (Cerveza 2 5,00)', input: 'Cerveza 2 5,00' },
  { id: 'qty-2', label: 'QTY: cantidad en medio con decimal (Cerveza 2,00 5,00)', input: 'Cerveza 2,00 5,00' },
  { id: 'qty-3', label: 'QTY: multiplicador unicode × (2×Cerveza 5,00)', input: '2×Cerveza 5,00' },
  { id: 'qty-4', label: 'QTY: multiplicador asterisco (2*Cerveza 5,00)', input: '2*Cerveza 5,00' },
  { id: 'qty-5', label: 'QTY: x separada (2 x Cerveza 5,00)', input: '2 x Cerveza 5,00' },
  { id: 'qty-6', label: 'QTY: unidades abreviadas (Cerveza 2 UDS 5,00)', input: 'Cerveza 2 UDS 5,00' },
  { id: 'qty-7', label: 'QTY: unidades explícitas (Cerveza 2 unidades 5,00)', input: 'Cerveza 2 unidades 5,00' },
  { id: 'qty-8', label: 'QTY: cantidad después del nombre SIN separador claro', input: 'Cerveza 2 5,00' },
  { id: 'qty-9', label: 'QTY: cantidad entera sola como 1er num (4 22,80 45,20)', input: 'ENTRECOTTE 4 22,80 45,20' },

  // --- Casos de precio que el análisis NO cubrió ---
  { id: 'price-1', label: 'PRICE: unitPrice + total (2,50 5,00) sin cantidad', input: '2,50 5,00' },
  { id: 'price-2', label: 'PRICE: precio con un solo decimal (2,5)', input: 'Cerveza 2,5' },
  { id: 'price-3', label: 'PRICE: precio sin decimales (5)', input: 'Cerveza 5' },
  { id: 'price-4', label: 'PRICE: precio /kg (Manzanas 2,49 €/kg)', input: 'Manzanas 2,49 €/kg' },
  { id: 'price-5', label: 'PRICE: peso variable (0,350 kg Manzanas 2,49)', input: '0,350 kg Manzanas 2,49' },
  { id: 'price-6', label: 'PRICE: báscula completo (Manzanas 2,49€/kg 0,350kg 0,87)', input: 'Manzanas 2,49 €/kg 0,350 kg 0,87' },
  { id: 'price-7', label: 'PRICE: precio negativo / devolución (-5,00)', input: 'ANULADO Cerveza -5,00' },
  { id: 'price-8', label: 'PRICE: oferta 3x2 (Brioche 3x2 2,00)', input: 'Brioche 3x2 2,00' },
  { id: 'price-9', label: 'PRICE: descuento en línea (Cerveza DTO -1,00 5,00)', input: 'Cerveza DTO -1,00 5,00' },

  // --- Casos de nombre que el análisis NO cubrió ---
  { id: 'name-1', label: 'NAME: nombre con dígitos (AGUA 33CL 1,20)', input: 'AGUA 33CL 1,20' },
  { id: 'name-2', label: 'NAME: nombre con código EAN + precio (8424536789012 1,20)', input: '8424536789012 Manzana 1,20' },
  { id: 'name-3', label: 'NAME: EAN sin separación + precio', input: '8424536789012 1,20' },
  { id: 'name-4', label: 'NAME: marca/modelo con números (Leche 1L 1,10)', input: 'Leche 1L 1,10' },

  // --- Casos OCR / formato que el análisis NO cubrió ---
  { id: 'ocr-1', label: 'OCR: O por cero (5.OO)', input: 'Cerveza 5.OO' },
  { id: 'ocr-2', label: 'OCR: l por uno (1,2O)', input: 'Cerveza 1,2O' },
  { id: 'ocr-3', label: 'OCR: precio con miles (1.200,00)', input: 'TV 1.200,00' },
  { id: 'ocr-4', label: 'OCR: separador por tabs', input: 'Cerveza\t2\t5,00' },
  { id: 'ocr-5', label: 'OCR: € pegado al precio (5,00€)', input: 'Cerveza 5,00€' },
  { id: 'ocr-6', label: 'OCR: EUR tras precio (5,00 EUR)', input: 'Cerveza 5,00 EUR' },
]

for (const c of cases) {
  try {
    const r = parseReceiptText(c.input)
    const items = r.items.map((i) => `${i.quantity}×${i.name}@${i.unitPrice}`).join(' | ')
    console.log(`\n[${c.id}] ${c.label}`)
    console.log(`  IN : ${JSON.stringify(c.input)}`)
    console.log(`  OUT: ${items || '(sin items)'}`)
    if (r.total !== undefined) console.log(`  TOT: ${r.total} (subtotal ${r.subtotal})`)
  } catch (e) {
    console.log(`\n[${c.id}] ${c.label} → ERROR: ${e.message}`)
  }
}
