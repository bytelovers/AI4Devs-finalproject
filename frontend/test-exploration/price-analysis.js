// Test script to analyze price detection issues
const { parseReceiptText } = require('../../src/lib/scan/receipt-parser');

// Test cases that might demonstrate the issue
const testCases = [
  // Case 1: Product name followed by price (should be unit price for qty=1)
  { 
    description: "Product with price only (no quantity)",
    text: "Cerveza 2,50",
    expected: { quantity: 1, unitPrice: 2.50, total: 2.50 }
  },
  
  // Case 2: Quantity at start, then product, then price (total)  
  { 
    description: "Quantity, product, total price",
    text: "2 Cerveza 5,00", 
    expected: { quantity: 2, unitPrice: 2.50, total: 5.00 }
  },
  
  // Case 3: Product, quantity, price (total)
  { 
    description: "Product, quantity, total price", 
    text: "Cerveza 2 5,00",
    expected: { quantity: 2, unitPrice: 2.50, total: 5.00 }
  },
  
  // Case 4: Just a number (ambiguous)
  { 
    description: "Just a number - could be unit price or total",
    text: "5,00", 
    expected: { quantity: 1, unitPrice: 5.00, total: 5.00 } // Assuming qty=1 if ambiguous
  },
  
  // Case 5: With "x" notation
  { 
    description: "Quantity with x notation",
    text: "2x Cerveza 5,00",
    expected: { quantity: 2, unitPrice: 2.50, total: 5.00 }
  }
];

console.log("Testing price detection logic...\n");

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.description}`);
  console.log(`Input: "${testCase.text}"`);
  
  try {
    const result = parseReceiptText(testCase.text);
    console.log(`Parsed items:`, JSON.stringify(result.items, null, 2));
    
    if (result.items.length > 0) {
      const item = result.items[0];
      const actualTotal = item.unitPrice * item.quantity;
      
      console.log(`Quantity: ${item.quantity}`);
      console.log(`Unit Price: ${item.unitPrice}`); 
      console.log(`Calculated Total: ${actualTotal}`);
      console.log(`Expected: Qty=${testCase.expected.quantity}, UP=${testCase.expected.unitPrice}, Total=${testCase.expected.total}`);
      
      // Check if unit price was incorrectly set to the total
      const textNumbers = testCase.text.match(/(\d+[.,]\d{2}|\d+[.,]\d{1,2}|\d+)/g) || [];
      const numbers = textNumbers.map(n => parseFloat(n.replace(',', '.')));
      
      if (numbers.length === 1) {
        const detectedNumber = numbers[0];
        if (Math.abs(item.unitPrice - detectedNumber) < 0.01) {
          console.log(`⚠️  WARNING: Unit price (${item.unitPrice}) equals detected number (${detectedNumber}) - may be treating total as unit price!`);
        }
      }
    }
  } catch (error) {
    console.error(`Error parsing:`, error.message);
  }
  
  console.log("\n" + "=".repeat(50) + "\n");
});
