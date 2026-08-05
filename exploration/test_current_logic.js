// Test the current problematic logic directly
function parseSpanishAmount(s) {
  if (!s) return 0
  let cleaned = s.trim()
  if (cleaned.includes('.') && cleaned.includes(',')) {
    if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.')
    } else {
      cleaned = cleaned.replace(/,/g, '')
    }
  } else if (cleaned.includes(',')) {
    const parts = cleaned.split(',')
    if (parts.length === 2 && parts[1].length === 2) {
      cleaned = cleaned.replace(',', '.')
    } else {
      cleaned = cleaned.replace(/,/g, '')
    }
  } else if (cleaned.includes('.')) {
    const parts = cleaned.split('.')
    if (parts.length === 2 && parts[1].length === 2) {
      // decimal
    } else if (parts.length > 2) {
      cleaned = cleaned.replace(/\./g, '')
    }
    if (parts.length === 2 && parts[1].length === 3) {
      cleaned = cleaned.replace(/\./g, '')
    }
  }
  const result = parseFloat(cleaned)
  return isNaN(result) ? 0 : result
}

function testQuantityDetection(line) {
  // Current regex from the code
  const qtyMatch = line.match(/^(\d+)\s*[xX]?\s+/)
  if (qtyMatch) {
    const parsedQty = parseInt(qtyMatch[1])
    if (parsedQty >= 1 && parsedQty <= 50) {
      return parsedQty
    }
  }
  return 1 // default
}

function testTwoPriceLogic(p1, p2) {
  // Simulate the current two-price logic
  const lineTotal = p2
  if (p1 > 0 && Math.abs(p1 * Math.round(p1) - p2) < 0.05) {
    // p1 es la cantidad entera
    const quantity = Math.round(p1)
    const unitPrice = p2 / quantity
    return { quantity, unitPrice, lineTotal, branch: 'if' }
  } else {
    const unitPrice = p1
    const quantity = p1 > 0 ? Math.round(p2 / p1) || 1 : 1
    return { quantity, unitPrice, lineTotal, branch: 'else' }
  }
}

console.log('=== Testing Quantity Detection ===\n')

const testLines = [
  '2 Cerveza',           // Should detect 2
  '2x Cerveza',          // Should detect 2  
  '2 X Cerveza',         // Should detect 2
  'Cerveza 2',           // Current: fails to detect (returns 1)
  'Cerveza 2 x',         // Current: fails to detect (returns 1)
  '1 Coca-Cola',         // Should detect 1
  '3x Pan',              // Should detect 3
  'Cerveza',             // No number: returns 1
  '',                    // Empty: returns 1
  '   4  Agua',          // Leading spaces: current fails (returns 1)
]

testLines.forEach(line => {
  const detected = testQuantityDetection(line)
  console.log(`Input: "${line}"`)
  console.log(`  Detected quantity: ${detected}`)
  if (detected === 1 && line.match(/^\d+/)) {
    console.log(`  ⚠️  Leading number NOT detected as quantity!`)
  }
  console.log()
})

console.log('=== Testing Two-Price Logic ===\n')

const testCases = [
  // [p1, p2, description, expected interpretation]
  [2, 5.00, '2 Cerveza 5,00 (quantity, total)', {q: 2, up: 2.50}],
  [2.50, 5.00, '2,50 Cerveza 5,00 (unitPrice, total)', {q: 2, up: 2.50}],
  [2, 2.50, '2 Cerveza 2,50 (quantity, unitPrice)', {q: 2, up: 2.50, total: 5.00}],
  [5.00, 2, '5,00 Cerveza 2 (total, quantity)', {q: 2, up: 2.50}],
  [1, 12.00, '1 Agua 12,00 (quantity, total)', {q: 1, up: 12.00}],
  [12.00, 1, '12,00 Agua 1 (total, quantity)', {q: 12, up: 1.00}],
]

testCases.forEach(([p1, p2, desc, expected]) => {
  const result = testTwoPriceLogic(p1, p2)
  console.log(`Input: p1=${p1}, p2=${p2} (${desc})`)
  console.log(`  Branch taken: ${result.branch}`)
  console.log(`  Quantity: ${result.quantity}`)
  console.log(`  Unit Price: €${result.unitPrice.toFixed(2)}`)
  console.log(`  Line Total (calculated): €${(result.quantity * result.unitPrice).toFixed(2)}`)
  
  if (expected) {
    const expectedTotal = expected.q * expected.up
    const actualTotal = result.quantity * result.unitPrice
    console.log(`  Expected: Q=${expected.q}, UP=€${expected.up.toFixed(2)}, Total=€${expectedTotal.toFixed(2)}`)
    
    const quantityMatch = Math.abs(result.quantity - expected.q) < 0.5
    const priceMatch = Math.abs(result.unitPrice - expected.up) < 0.01
    
    if (quantityMatch && priceMatch) {
      console.log(`  ✅ CORRECT`)
    } else {
      console.log(`  ❌ INCORRECT`)
      if (!quantityMatch) console.log(`     Quantity wrong: got ${result.quantity}, expected ${expected.q}`)
      if (!priceMatch) console.log(`     Unit price wrong: got €${result.unitPrice.toFixed(2)}, expected €${expected.up.toFixed(2)}`)
    }
  }
  console.log()
})

console.log('=== Demonstrating the User-Reported Issue ===\n')
console.log('Scenario: OCR partially fails, only detects the total amount\n')

const scenarios = [
  {
    description: 'Should be "2 Cerveza 2,50" each (total 5,00) but OCR only sees "5,00"',
    ocrText: '5,00',
    intendedQuantity: 2,
    intendedUnitPrice: 2.50,
    intendedTotal: 5.00
  },
  {
    description: 'Should be "3 Agua 1,80" each (total 5,40) but OCR only sees "5,40"',  
    ocrText: '5,40',
    intendedQuantity: 3,
    intendedUnitPrice: 1.80,
    intendedTotal: 5.40
  }
]

scenarios.forEach(scenario => {
  console.log(`Scenario: ${scenario.description}`)
  console.log(`OCR detected: "${scenario.ocrText}"`)
  
  // Simulate single price processing
  const lineTotal = parseSpanishAmount(scenario.ocrText)
  const qtyMatch = scenario.ocrText.match(/^(\d+)\s*[xX]?\s+/)
  let quantity = 1
  if (qtyMatch) {
    const parsedQty = parseInt(qtyMatch[1])
    if (parsedQty >= 1 && parsedQty <= 50) {
      quantity = parsedQty
    }
  }
  const unitPrice = lineTotal / quantity
  
  console.log(`  Parsed line total: €${lineTotal.toFixed(2)}`)
  console.log(`  Detected quantity: ${quantity}`)
  console.log(`  Calculated unit price: €${unitPrice.toFixed(2)}`)
  console.log(`  Implied total: €${(quantity * unitPrice).toFixed(2)}`)
  
  console.log(`  Expected: Q=${scenario.intendedQuantity}, UP=€${scenario.intendedUnitPrice.toFixed(2)}, Total=€${scenario.intendedTotal.toFixed(2)}`)
  
  const isMisleading = Math.abs(unitPrice - scenario.ocrText.replace(',', '.')) < 0.01
  if (isMisleading) {
    console.log(`  ⚠️  ISSUE: Unit price (€${unitPrice.toFixed(2)}) equals OCR value (${scenario.ocrText})`)
    console.log(`         This makes it appear as if the TOTAL is being used as unit price!`)
  }
  console.log()
})

console.log('=== Summary ===')
console.log('The issue occurs when:')
console.log('1. OCR fails to detect quantity indicators (especially non-prefix quantities)')
console.log('2. Only the total amount is clearly visible in OCR output')  
console.log('3. System defaults to quantity=1 and sets unitPrice = detectedTotal')
console.log('4. Result: Displayed unit price equals the actual total amount')
console.log('')
console.log('This matches user reports of "the total value being used as the unit value"')
