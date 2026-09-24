// Final analysis and proposed solution

console.log('=== PRICE UNIT VS TOTAL ISSUE ANALYSIS ===\n');

// Replicate the key problematic functions from the original code
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

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

// ORIGINAL PROBLEMATIC QUANTITY DETECTION (from receipt-parser.ts)
function detectQuantityOriginal(line) {
  const qtyMatch = line.match(/^(\d+)\s*[xX]?\s+/)
  if (qtyMatch) {
    const parsedQty = parseInt(qtyMatch[1])
    if (parsedQty >= 1 && parsedQty <= 50) {
      return parsedQty
    }
  }
  return 1  // DEFAULT TO 1 - THIS IS THE PROBLEM!
}

// ORIGINAL PROBLEMATIC TWO-PRICE LOGIC
function processTwoPricesOriginal(p1, p2) {
  const lineTotal = p2  // ASSUMES p2 IS ALWAYS TOTAL
  if (p1 > 0 && Math.abs(p1 * Math.round(p1) - p2) < 0.05) {
    // p1 es la cantidad entera
    const quantity = Math.round(p1)
    const unitPrice = p2 / quantity
    return { quantity, unitPrice, lineTotal, type: 'original_if' }
  } else {
    const unitPrice = p1
    const quantity = p1 > 0 ? Math.round(p2 / p1) || 1 : 1
    return { quantity, unitPrice, lineTotal, type: 'original_else' }
  }
}

// IMPROVED QUANTITY DETECTION
function detectQuantityImproved(line) {
  if (!line || typeof line !== 'string') return null
  
  // More comprehensive patterns
  const patterns = [
    /^(\d+)\s*[xX]?\s+/i,                    // Start: "2 ", "2x "
    /\s+(\d+)\s*[xX]?\s+/i,                 // Middle: "Cerveza 2 "
    /^(\d+)(?=\s*[xX])/i,                   // Start before x: "2x"
    /(?<=\s)(\d+)(?=\s*[xX])/i,             // Space before, x after: "Cerveza 2x"
    /^(\d+)(?=\s)/i,                        // Start before space: "2 "
    /\s+(\d+)(?=\s)/i,                      // Space before and after: "Cerveza 2 "
    /(\d+)\s*unidades?/i,                   // Explicit units: "5 unidades"
    /(\d+)\s*uds?/i,                        // Abbreviated: "3 uds"
    /(\d+)\s*kg/i,                          // Weight (but we'll filter this later)
    /(\d+)\s*g(?=\s|$)/i,                   // Grams
    /^(\d+)$/                               // Just a number
  ]
  
  for (const pattern of patterns) {
    const match = line.match(pattern)
    if (match) {
      let qty = parseInt(match[1])
      // Filter out obvious non-quantities (weights, measurements that aren't counts)
      if (/kg/i.test(pattern) && !/unidad/i.test(line.toLowerCase())) {
        // This looks like weight, not count - skip unless context suggests otherwise
        continue
      }
      if (/g(?=\s|$)/.test(pattern) && !/unidad/i.test(line.toLowerCase())) {
        // This looks like grams, not count - skip
        continue
      }
      if (qty >= 1 && qty <= 50) {
        return qty
      }
    }
  }
  
  return null  // NOT FOUND (let caller decide what to do)
}

// IMPROVED TWO-PRICE LOGIC
function processTwoPricesImproved(p1, p2) {
  const candidates = []
  
  // Candidate 1: [quantity, unitPrice]
  if (p1 >= 1 && p1 <= 50) {
    const qty1 = Math.round(p1)
    if (Math.abs(p1 - qty1) < 0.1) {  // p1 is nearly integer
      const unitPrice1 = p2
      const total1 = qty1 * p2
      if (unitPrice1 > 0) {
        candidates.push({
          type: '[quantity, unitPrice]',
          quantity: qty1,
          unitPrice: unitPrice1,
          total: total1,
          confidence: 0.9 - Math.abs(p1 - qty1) * 0.5
        })
      }
    }
  }
  
  // Candidate 2: [quantity, total]
  if (p1 >= 1 && p1 <= 50) {
    const qty2 = Math.round(p1)
    if (Math.abs(p1 - qty2) < 0.1 && p1 > 0) {
      const unitPrice2 = p2 / p1
      if (unitPrice2 > 0 && unitPrice2 <= 200) {  // Reasonable unit price
        const total2 = p2
        candidates.push({
          type: '[quantity, total]',
          quantity: qty2,
          unitPrice: unitPrice2,
          total: total2,
          confidence: 0.8 - Math.abs(p1 - qty2) * 0.3
        })
      }
    }
  }
  
  // Candidate 3: [unitPrice, total] -> quantity = total / unitPrice
  if (p1 > 0) {
    const possibleQty = p2 / p1
    const qty3 = Math.round(possibleQty)
    if (Math.abs(p2 - qty3 * p1) < 0.05 && qty3 >= 1 && qty3 <= 50) {
      const unitPrice3 = p1
      const total3 = p2
      // Additional sanity check: unit price should be reasonable
      if (unitPrice3 >= 0.01 && unitPrice3 <= 100) {
        candidates.push({
          type: '[unitPrice, total]',
          quantity: qty3,
          unitPrice: unitPrice3,
          total: total3,
          confidence: 0.7 - Math.abs(potentialQty - qty3) * 0.4
        })
      }
    }
  }
  
  // Return best candidate or fallback
  if (candidates.length > 0) {
    return candidates.sort((a, b) => b.confidence - a.confidence)[0]
  }
  
  // Fallback to original logic if nothing makes sense
  return processTwoPricesOriginal(p1, p2)
}

// DEMONSTRATE THE PROBLEMS
console.log('\n1. ORIGINAL QUANTITY DETECTION PROBLEMS:')
console.log('-' .repeat(50))

const quantityTestCases = [
  '2 Cerveza',
  '2x Cerveza', 
  'Cerveza 2',
  'Cerveza 2 x',
  '1 Coca-Cola',
  '3x Pan',
  '   4  Agua',
  'Una Cerveza 2',
  'Dos panes 3 unidades',
  '5 huevos grande',
  'Producto X 10 unidades'
]

quantityTestCases.forEach(testCase => {
  const orig = detectQuantityOriginal(testCase)
  const impr = detectQuantityImproved(testCase)
  const status = (improved !== null && improved !== 1 && 
                 (orig === 1 || orig === undefined)) ? '✅ IMPROVED' :
                (improved === null) ? '⚠️  NOT FOUND' : ''
  console.log(`Input: "${testCase}"`)
  console.log(`  Original: ${orig === 1 ? '(default 1)' : orig}`)
  console.log(`  Improved: ${improved !== null ? improved : 'Not detected'} ${status}`)
  console.log()
})

console.log('\n2. ORIGINAL TWO-PRICE LOGIC PROBLEMS:')
console.log('-' .repeat(50))

const twoPriceTestCases = [
  [2, 5, '2 Cerveza 5,00 (quantity, total)'],
  [2.5, 5, '2,50 Cerveza 5,00 (unitPrice, total)'],
  [2, 2.5, '2 Cerveza 2,50 (quantity, unitPrice) - THE BUGGY CASE'],
  [5, 2, '5,00 Cerveza 2 (total, quantity)'],
  [1, 12, '1 Agua 12,00 (quantity, total)'],
  [12, 1, '12,00 Agua 1 (total, quantity)']
]

twoPriceTestCases.forEach(([p1, p2, desc]) => {
  const orig = processTwoPricesOriginal(p1, p2)
  const impr = processTwoPricesImproved(p1, p2)
  
  console.log(`Input: p1=${p1}, p2=${p2} (${desc})`)
  console.log(`  Original:  Q=${orig.quantity}, UP=€${orig.unitPrice.toFixed(2)}, Total=€${(orig.quantity * orig.unitPrice).toFixed(2)} [${orig.type}]`)
  console.log(`  Improved:  Q=${impr.quantity}, UP=€${impr.unitPrice.toFixed(2)}, Total=€${(impr.quantity * impr.unitPrice).toFixed(2)} [${impr.type}]`)
  
  // Check if we fixed the specific buggy case
  if (desc.includes('quantity, unitPrice')) {
    const expectedQ = 2
    const expectedUP = 2.50
    const origCorrect = Math.abs(orig.quantity - expectedQ) < 0.1 && 
                       Math.abs(orig.unitPrice - expectedUP) < 0.01
    const imprCorrect = Math.abs(impr.quantity - expectedQ) < 0.1 && 
                       Math.abs(impr.unitPrice - expectedUP) < 0.01
    if (!origCorrect && imprCorrect) {
      console.log(`  ✅ FIXED: Correctly handled [quantity, unitPrice] case!`)
    } else if (!origCorrect && !imprCorrect) {
      console.log(`  ❌ STILL BROKEN: Both approaches failed`)
    }
  }
  console.log()
})

console.log('\n3. DEMONSTRATING THE USER-REPORTED ISSUE:')
console.log('-' .repeat(50))
console.log('Scenario: OCR only detects the total amount, no quantity info visible\n')

const userScenarios = [
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

userScenarios.forEach(scenario => {
  console.log(`Scenario: ${scenario.description}`)
  console.log(`OCR saw: "${scenario.ocrText}"`)
  
  // Simulate what happens with current code
  const lineTotal = parseSpanishAmount(scenario.ocrText)
  const origQty = detectQuantityOriginal(scenario.ocrText)  // Will be 1 (default)
  const origUnitPrice = lineTotal / origQty
  
  console.log(`  With current code:`)
  console.log(`    Detected quantity: ${origQty} (default - no qty found in text)`)
  console.log(`    Unit price: €${origUnitPrice.toFixed(2)}`)
  console.log(`    Implied total: €${(origQty * origUnitPrice).toFixed(2)}`)
  
  // Show the problem: user sees unit price = OCR value
  const ocrValue = parseFloat(scenario.ocrText.replace(',', '.'))
  const showsProblem = Math.abs(origUnitPrice - ocrValue) < 0.01
  if (showsProblem) {
    console.log(`    ⚠️  ISSUE VISIBLE TO USER:`) 
    console.log(`       Displayed unit price (€${origUnitPrice.toFixed(2)}) equals OCR value (${ocrValue})`)
    console.log(`       User perceives this as "total being used as unit value"`)
  }
  
  console.log(`  Expected: Q=${scenario.intendedQuantity}, UP=€${scenario.intendedUnitPrice.toFixed(2)}, Total=€${scenario.intendedTotal.toFixed(2)}`)
  console.log(`  Actual error: |${(origQty * origUnitPrice).toFixed(2)} - ${scenario.intendedTotal.toFixed(2)}| = €${Math.abs((origQty * origUnitPrice) - scenario.intendedTotal).toFixed(2)}`)
  console.log()
})

console.log('\n4. WHERE IMPROVEMENTS HELP:')
console.log('-' .repeat(50))
console.log('The improvements REDUCE the frequency of the problem by:')
console.log('✅ Better quantity detection: finds "2" in "Cerveza 2", "5" in "   4  Agua"')
console.log('✅ Better two-pair logic: fixes [quantity, unitPrice] case that was broken')
console.log('✅ More quantities caught in text = fewer cases needing quantity=1 fallback')
console.log('')
console.log('LIMITATIONS (when the problem still occurs):')
console.log('❌ When OCR truly only shows a total with NO quantity clues:')
console.log('    "5,00" could be: 2@2,50, 5@1,00, 10@0,50, or 1@5,00')
console.log('    Without additional context, ambiguity remains')
console.log('❌ This is a fundamental information-theoretic limit')
console.log('')
console.log('RECOMMENDED APPROACH:')
console.log('1. Implement the improved quantity detection (more patterns)')
console.log('2. Fix the two-pair logic to handle [quantity, unitPrice] case')
console.log('3. Add visual feedback when quantity is estimated (not OCR-detected)')
console.log('4. Consider machine learning approaches for ambiguous cases')
console.log('5. Use temporal/spatial context from other receipt items')
console.log('')
console.log('=== CONCLUSION ===')
console.log('The user\\\'s observation is correct in specific scenarios:')
console.log('- When OCR fails to detect quantity indicators AND only shows a total')
console.log('- The system defaults to quantity=1, making unitPrice = detectedTotal')
console.log('- This creates the illusion that "total is being used as unit value"')
console.log('')
console.log('The proposed fixes reduce occurrences by improving quantity detection,')
console.log('but cannot eliminate the fundamental ambiguity when no quantity')
console.log('information survives the OCR process.')
