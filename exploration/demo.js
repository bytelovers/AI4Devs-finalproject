// Simple demonstration of the issue and solution

console.log('=== DEMONSTRATING THE CORE ISSUE ===\n');

console.log('PROBLEM: When OCR misses quantity info, system assumes quantity=1');
console.log('This makes it APPEAR as if the total is being used as unit price\n');

// Simulate the original problematic quantity detection
function detectQuantityOriginal(text) {
  // Original regex: only matches at START of line
  const match = text.match(/^(\d+)\s*[xX]?\s+/);
  if (match) {
    const qty = parseInt(match[1]);
    return (qty >= 1 && qty <= 50) ? qty : 1;
  }
  return 1; // PROBLEM: Defaults to 1 when no match
}

// Simulate the improved quantity detection
function detectQuantityImproved(text) {
  if (!text) return null;
  
  // More comprehensive patterns
  const patterns = [
    /^(\d+)\s*[xX]?\s+/i,              // Start: "2 ", "2x "
    /\s+(\d+)\s*[xX]?\s+/i,            // Middle: "cerveza 2 "
    /(\d+)\s*unidades?/i,              // Explicit: "2 unidades"
    /(\d+)\s*uds?/i,                   // Abbreviated: "5 uds"
    /^(\d+)$/                          // Just number: "3"
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const qty = parseInt(match[1]);
      if (qty >= 1 && qty <= 50) return qty;
    }
  }
  return null; // Not found
}

// Test cases showing where the problem occurs
const testScenarios = [
  {
    description: 'OCR successfully sees quantity prefix',
    ocrText: '2 Cerveza 5,00',
    actualQuantity: 2,
    actualUnitPrice: 2.50,
    note: 'Quantity detected correctly'
  },
  {
    description: 'OCR misses quantity prefix (common failure)',
    ocrText: 'Cerveza 5,00',  // Should be "2 Cerveza 5,00" but "2 " was lost
    actualQuantity: 2,
    actualUnitPrice: 2.50,
    note: 'Quantity lost in OCR - PROBLEM OCCURS HERE'
  },
  {
    description: 'OCR sees quantity in middle (missed by original)',
    ocrText: 'Una Cerveza 2 5,00', // Note: typo in "Una" to show partial OCR
    actualQuantity: 2,
    actualUnitPrice: 2.50,
    note: 'Quantity in middle - original regex misses this'
  },
  {
    description: 'OCR sees quantity with units (missed by original)',
    ocrText: 'Cerveza 2 unidades 5,00',
    actualQuantity: 2,
    actualUnitPrice: 2.50,
    note: 'Explicit units - original regex misses this'
  }
];

testScenarios.forEach((scenario, index) => {
  console.log(`${index + 1}. ${scenario.description}`);
  console.log(`   OCR Text: "${scenario.ocrText}"`);
  console.log(`   Actual: ${scenario.actualQuantity} items @ €${scenario.actualUnitPrice.toFixed(2)} each`);
  
  // Test original detection
  const origQty = detectQuantityOriginal(scenario.ocrText);
  const origUnitPrice = (origQty === 1) ? 
    parseFloat(scenario.ocrText.replace(/[^\d,]/g, '').replace(',', '.')) : 
    (parseFloat(scenario.ocrText.replace(/[^\d,]/g, '').replace(',', '.')) / origQty);
  
  // Test improved detection
  const imprQty = detectQuantityImproved(scenario.ocrText);
  const imprUnitPrice = (imprQty === null) ? 
    parseFloat(scenario.ocrText.replace(/[^\d,]/g, '').replace(',', '.')) : 
    (parseFloat(scenario.ocrText.replace(/[^\d,]/g, '').replace(',', '.')) / imprQty);
  
  console.log(`   Original code:`);
  console.log(`     Detected quantity: ${origQty}`);
  console.log(`     Unit price: €${origUnitPrice.toFixed(2)}`);
  if (origQty === 1 && ocrHasNumberButNotAtStart(scenario.ocrText)) {
    console.log(`     ⚠️  ISSUE: Defaulted to quantity=1, used total as unit price!`);
  }
  
  console.log(`   Improved code:`);
  console.log(`     Detected quantity: ${imprQty !== null ? imprQty : 'Not found (would use context/default)'}`);
  if (imprQty !== null) {
    console.log(`     Unit price: €${imprUnitPrice.toFixed(2)}`);
    if (Math.abs(imprUnitPrice - scenario.actualUnitPrice) < 0.01) {
      console.log(`     ✅ CORRECT: Matches expected unit price`);
    } else {
      console.log(`     ⚠️  Still inaccurate`);
    }
  } else {
    console.log(`     Would need to use contextual clues or default to 1`);
  }
  
  console.log();
});

// Helper function
function ocrHasNumberButNotAtStart(text) {
  return /\d/.test(text) && !/^\s*\d/.test(text);
}

console.log('=== KEY INSIGHT ===\n');
console.log('The user\\\'s observation \"the total value is used as the unit value\"');
console.log('happens when:');
console.log('1. OCR fails to detect quantity indicators (especially non-prefix positions)');
console.log('2. Only a total amount is clearly visible in the OCR output');
console.log('3. The system defaults to quantity = 1');
console.log('4. Unit price = totalAmount / 1 = totalAmount');
console.log('5. User sees: displayed unit price = OCR-detected total');
console.log('');
console.log('=== SOLUTION EFFECTIVENESS ===\n');
console.log('Improved quantity detection helps by:');
console.log('✅ Finding quantities in MORE positions:');
console.log('   - Middle of line: \"Cerveza 2 5,00\"');
console.log('   - With explicit units: \"2 unidades\"');
console.log('   - After whitespace: \"   4  Agua\"');
console.log('✅ Reducing frequency of \"quantity not found\" cases');
console.log('✅ Lowering occurrences of the false \"total as unit\" appearance');
console.log('');
console.log('LIMITATIONS:');
console.log('❌ When TRULY no quantity info survives OCR (e.g., just \"5,00\" visible):');
console.log('    Fundamental ambiguity remains - cannot distinguish:');
console.log('    2×2,50 vs 5×1,00 vs 10×0,50 vs 1×5,00');
console.log('    All produce identical OCR: \"5,00\"');
console.log('❌ Requires additional context or heuristics to resolve');
console.log('');
console.log('=== RECOMMENDATION ===\n');
console.log('1. Replace the restrictive regex with more comprehensive patterns');
console.log('2. Add visual feedback when quantity is estimated vs OCR-detected');
console.log('3. Consider temporal context (quantities of similar items on same receipt)');
console.log('4. Accept that some ambiguity is unavoidable when information is lost');
console.log('');
console.log('This reduces but does not eliminate the user\\\'s reported issue.');
