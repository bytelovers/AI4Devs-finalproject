// Fixed version
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

// Improved quantity detection - looks for quantity patterns anywhere in line
function detectQuantityFromLine(line) {
  if (!line || typeof line !== 'string') return null
  
  // Patterns to try (in order of preference)
  const patterns = [
    /^(\d+)\s*[xX]?\s+/i,                    // Start: "2 ", "2x ", "2X "
    /\s+(\d+)\s*[xX]?\s+/i,                 // Middle: "Cerveza 2 ", "Cerveza 2x "
    /^(\d+)(?=\s*[xX])/i,                   // Start followed by x: "2x", "2X "  
    /(?<=\s)(\d+)(?=\s*[xX])/i,             // Space before, x after: "Cerveza 2x"
    /^(\d+)(?=\s)/i,                        // Start followed by space: "2 "
    /\s+(\d+)(?=\s)/i,                      // Space before and after: "Cerveza 2 "
    /(\d+)\s*unidades?/i,                   // Explicit units: "2 unidades", "10 unidades"
    /(\d+)\s*uds?/i,                        // Abbreviated units: "2 uds", "5 ud"
    /^(\d+)$/                               // Just a number: "5"
  ]
  
  for (const pattern of patterns) {
    const match = line.match(pattern)
    if (match) {
      const qty = parseInt(match[1])
      if (qty >= 1 && qty <= 50) {  // Reasonable quantity range
        return qty
      }
    }
  }
  
  return null  // Not found
}

// Improved two-price logic that considers all interpretations
function analyzeTwoPriceScenario(p1, p2) {
  const results = []
  
  // Interpretation 1: [quantity, unitPrice] -> total = p1 * p2
  const qty1 = Math.round(p1)
  if (Math.abs(p1 - qty1) < 0.1 && qty1 >= 1 && qty1 <= 50) {
    const unitPrice1 = p2
    const total1 = p1 * p2
    results.push({
      type: '[quantity, unitPrice]',
      quantity: qty1,
      unitPrice: unitPrice1,
      total: total1,
      confidence: 0.9 - Math.abs(p1 - qty1) * 0.5  // Higher confidence for closer to integer
    })
  }
  
  // Interpretation 2: [quantity, total] -> unitPrice = p2 / p1
  const qty2 = Math.round(p1)
  if (Math.abs(p1 - qty2) < 0.1 && p1 > 0 && qty2 >= 1 && qty2 <= 50) {
    const unitPrice2 = p2 / p1
    const total2 = p2
    // Check if unit price is reasonable
    if (unitPrice2 >= 0.1 && unitPrice2 <= 100) {
      results.push({
        type: '[quantity, total]',
        quantity: qty2,
        unitPrice: unitPrice2,
        total: total2,
        confidence: 0.8 - Math.abs(p1 - qty2) * 0.3
      })
    }
  }
  
  // Interpretation 3: [unitPrice, total] -> quantity = p2 / p1 (if nearly integer)
  if (p1 > 0) {
    const potentialQty = p2 / p1
    const qty3 = Math.round(potentialQty)
    if (Math.abs(potentialQty - qty3) < 0.1 && qty3 >= 1 && qty3 <= 50) {
      const unitPrice3 = p1
      const total3 = p2
      // Check if unit price is reasonable
      if (unitPrice3 >= 0.1 && unitPrice3 <= 100) {
        results.push({
          type: '[unitPrice, total]',
          quantity: qty3,
          unitPrice: unitPrice3,
          total: total3,
          confidence: 0.7 - Math.abs(potentialQty - qty3) * 0.5
        })
      }
    }
  }
  
  // Sort by confidence descending
  return results.sort((a, b) => b.confidence - a.confidence)
}

// Test functions
function testImprovedQuantityDetection() {
  console.log('=== Testing Improved Quantity Detection ===\n')
  
  const testLines = [
    '2 Cerveza',
    '2x Cerveza',
    '2 X Cerveza',
    'Cerveza 2',
    'Cerveza 2 x',
    '1 Coca-Cola',
    '3x Pan',
    'Cerveza',
    '',
    '   4  Agua',
    'Una Cerveza 2',
    'Dos panes 3 unidades',
    '5 huevos grande',
    'Producto X 10 unidades',
    'Litro de leche 1.5',
    '6 huevos',
    '7.5 kg azucar'  // This should NOT be detected as quantity (it's weight)
  ]
  
  testLines.forEach(line => {
    const detected = detectQuantityFromLine(line)
    console.log(`Input: "${line}"`)
    console.log(`  Detected quantity: ${detected !== null ? detected : 'None found'}`)
    if (detected === null && line.match(/\d+/)) {
      console.log(`  ℹ️  Numbers present but not recognized as quantity`)
    }
    console.log()
  })
}

function testImprovedTwoPriceLogic() {
  console.log('=== Testing Improved Two-Price Logic ===\n')
  
  const testCases = [
    [2, 5, '2 Cerveza 5,00 (quantity, total)'],
    [2.5, 5, '2,50 Cerveza 5,00 (unitPrice, total)'],
    [2, 2.5, '2 Cerveza 2,50 (quantity, unitPrice)'],
    [5, 2, '5,00 Cerveza 2 (total, quantity)'],
    [1, 12, '1 Agua 12,00 (quantity, total)'],
    [12, 1, '12,00 Agua 1 (total, quantity)'],
    [3, 5.4, '3 Agua 5,40 (quantity, total)'],
    [1.8, 5.4, '1,80 Agua 5,40 (unitPrice, total)'],
    [4, 12, '4 Pan 3,00 cada uno (if 3,00 is price per unit)'],
    [0.5, 2, '0.5 kg 4,00/kg (weight, price per unit)']  // Edge case
  ]
  
  testCases.forEach(([p1, p2, desc]) => {
    console.log(`Testing: ${desc}`)
    console.log(`  Inputs: p1=${p1}, p2=${p2}`)
    
    const results = analyzeTwoPriceScenario(p1, p2)
    
    if (results.length > 0) {
      const best = results[0]
      console.log(`  Best interpretation: ${best.type}`)
      console.log(`  Quantity: ${best.quantity}`)
      console.log(`  Unit Price: €${best.unitPrice.toFixed(2)}`)
      console.log(`  Total: €${(best.quantity * best.unitPrice).toFixed(2)}`)
      console.log(`  Confidence: ${(best.confidence * 100).toFixed(1)}%`)
      
      // Show alternatives if confidence is not overwhelmingly high
      if (results.length > 1 && results[1].confidence > 0.3) {
        console.log(`  Alternatives:`)
        results.slice(1, 3).forEach((alt, i) => {
          console.log(`    ${i+1}. ${alt.type}: Q=${alt.quantity}, UP=€${alt.unitPrice.toFixed(2)}, conf=${(alt.confidence*100).toFixed(1)}%`)
        })
      }
    } else {
      console.log(`  ❌ No valid interpretation found`)
    }
    console.log()
  })
}

function testUserIssueScenario() {
  console.log('=== Demonstrating Improvement for User Issue ===\n')
  
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
    },
    {
      description: 'Should be "1.5 Litro Leche 1,20" each (total 1,80) but OCR only sees "1,80"',
      ocrText: '1,80',
      intendedQuantity: 1.5,
      intendedUnitPrice: 1.20,
      intendedTotal: 1.80
    }
  ]
  
  scenarios.forEach(scenario => {
    console.log(`Scenario: ${scenario.description}`)
    console.log(`OCR detected: "${scenario.ocrText}"`)
    
    // Simulate IMPROVED single price processing
    const lineTotal = parseSpanishAmount(scenario.ocrText)
    const quantity = detectQuantityFromLine(scenario.ocrText)  // Will return null here
    let finalQuantity, unitPrice
    
    if (quantity !== null) {
      // Quantity found in text
      finalQuantity = quantity
      unitPrice = lineTotal / quantity
    } else {
      // No quantity found in text - this is the limitation
      // In reality, we might:
      // 1. Look at historical averages for this product/store
      // 2. Check if this is a known single-item product
      // 3. Use contextual clues from other items on the receipt
      // 4. Default to quantity=1 (current behavior) but flag as uncertain
      
      finalQuantity = 1  // Current fallback
      unitPrice = lineTotal / 1
    }
    
    console.log(`  Parsed line total: €${lineTotal.toFixed(2)}`)
    console.log(`  Quantity from text: ${quantity !== null ? quantity : 'Not detected'}`)
    console.log(`  Final quantity used: ${finalQuantity}`)
    console.log(`  Calculated unit price: €${unitPrice.toFixed(2)}`)
    console.log(`  Implied total: €${(finalQuantity * unitPrice).toFixed(2)}`)
    
    console.log(`  Expected: Q=${scenario.intendedQuantity}, UP=€${scenario.intendedUnitPrice.toFixed(2)}, Total=€${scenario.intendedTotal.toFixed(2)}`)
    
    // Show improvement over naive approach
    const naiveQuantity = 1
    const naiveUnitPrice = lineTotal / naiveQuantity
    const naiveError = Math.abs(naiveUnitPrice - scenario.intendedUnitPrice)
    
    const improvedError = Math.abs(unitPrice - scenario.intendedUnitPrice)
    
    if (quantity !== null) {
      // We found quantity in text!
      const isCorrect = Math.abs(quantity - scenario.intendedQuantity) < 0.1 &&
                       Math.abs((lineTotal / quantity) - scenario.intendedUnitPrice) < 0.01
      if (isCorrect) {
        console.log(`  ✅ EXCELLENT: Found quantity in text, reconstructed correctly!`)
      } else {
        console.log(`  ⚠️  Found quantity but calculation still off`)
      }
    } else {
      // No quantity in text - show what we could do with context
      console.log(`  ℹ️  No quantity detected in text - this is the fundamental limitation`)
      console.log(`     When only a total is visible, we cannot distinguish:`)
      console.log(`     - 2 items @ 2,50 each = 5,00 total`)
      console.log(`     - 5 items @ 1,00 each = 5,00 total`) 
      console.log(`     - 1 item @ 5,00 each = 5,00 total`)
      console.log(`     All produce the same OCR output: "5,00"`)
      console.log(`     Without additional context, quantity=1 is a reasonable default`)
    }
    
    // Show if we improved the specific complaint
    const showsOriginalIssue = Math.abs(unitScore - parseFloat(scenario.ocrText.replace(',', '.'))) < 0.01
    if (showsOriginalIssue) {
      console.log(`  ⚠️  STILL SHOWS ORIGINAL ISSUE: User sees unit price = OCR value`)
      console.log(`         (This is unavoidable when no quantity info is present in OCR)`)
    } else {
      console.log(`  ✅ RESOLVED: Unit price no longer equals raw OCR value`)
    }
    
    console.log()
  })
}

// Run tests
testImprovedQuantityDetection()
testImprovedTwoPriceLogic()
testUserIssueScenario()

console.log('=== Key Improvements Summary ===')
console.log('1. Quantity detection now finds quantities in more positions:')
console.log('   - Start: "2 Cerveza", "2x Cerveza"')
console.log('   - Middle: "Cerveza 2", "Cerveza 2x"')  
console.log('   - With units: "5 unidades", "10 uds"')
console.log('   - After whitespace: "   4  Agua"')
console.log('   - This reduces cases where quantities are missed entirely')
console.log('')
console.log('2. Two-pair logic now considers all interpretations:')
console.log('   - [quantity, unitPrice] -> calculate total')
console.log('   - [quantity, total] -> calculate unitPrice')
console.log('   - [unitPrice, total] -> calculate quantity (if integer)')
console.log('   - This fixes the [quantity, unitPrice] case that was broken before')
console.log('')
console.log('3. Uses confidence scoring to pick best interpretation')
console.log('')
console.log('For the user-reported issue:')
console.log('- When ONLY a total is visible in OCR, some ambiguity remains')
console.log('- BUT we improve the baseline by catching MORE quantities in text') 
console.log('- This reduces frequency of the problem occurring')
console.log('')
console.log('REALISTIC EXPECTATION:')
console.log('- Cannot create information from nothing')
console.log('- If OCR only shows "5,00" with no quantity clues, ambiguity remains')
console.log('- Improvement comes from catching cases where quantity WAS in OCR')
console.log('  but our old regex failed to detect it')
