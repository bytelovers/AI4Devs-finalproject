# Price Unit vs Total Analysis

## Issue Description
Users report that "currently the total value is always used as the unit value" in the ticket review interface. This occurs when the OCR system fails to properly detect quantity information, causing the system to default to quantity=1 and treat the detected total amount as the unit price.

## Root Cause Analysis

### Problem Location
The issue is in `frontend/src/lib/scan/receipt-parser.ts` in the `parseReceiptText` function, specifically:

1. **Single Price Case** (lines ~231-244): When only one numeric value is detected
2. **Two Price Case** (lines ~218-230): When two numeric values are detected

### Detailed Problem Breakdown

#### 1. Single Price Case Failure Mode
When OCR detects only one clear number (typically the total amount), the code:
```typescript
let lineTotal = parseSpanishAmount(validPrices[0][1]);

// Detectar cantidad al inicio ANTES de limpiar (ej: "2x Cerveza", "2 x Cerveza")
const qtyMatch = line.match(/^(\d+)\s*[xX]?\s+/)
if (qtyMatch) {
  const parsedQty = parseInt(qtyMatch[1])
  if (parsedQty >= 1 && parsedQty <= 50) {
    quantity = parsedQty
  }
}
unitPrice = lineTotal / quantity
```

**Problem**: The quantity detection regex `/^(\d+)\s*[xX]?\s+/` only matches quantities at the **very start** of the line.

**Failure Example**:
- Actual ticket line: "2 Cerveza 5,00" (2 beers at 5.00 each, total 10.00)
- OCR output (partial): "Cerveza 5,00" (quantity "2" not detected)
- Numbers found: [5.00]
- Quantity detection: Fails (line starts with "C", not digit)
- Quantity defaults to: 1
- Unit price calculated: 5.00 / 1 = 5.00
- **Result**: System shows 1 item at 5.00€ each
- **Should be**: 2 items at 2.50€ each (but quantity info lost)

In this case, the **displayed unit price (5.00€) equals the OCR-detected total amount**, matching the user's observation that "the total value is used as the unit value".

#### 2. Two Price Case Issues
The two-price logic assumes the second number is always the total:
```typescript
lineTotal = p2  // ASSUMES p2 IS ALWAYS THE TOTAL
if (p1 > 0 && Math.abs(p1 * Math.round(p1) - p2) < 0.05) {
  // p1 es la cantidad entera
  quantity = Math.round(p1)
  unitPrice = p2 / quantity
} else {
  unitPrice = p1
  quantity = p1 > 0 ? Math.round(p2 / p1) || 1 : 1
}
```

**Problems**:
1. The condition `Math.abs(p1 * Math.round(p1) - p2) < 0.05` is mathematically incorrect for detecting integers
2. It assumes p2 is always the total, missing the [quantity, unitPrice] pattern
3. Poor handling of European decimal formats in quantity detection

## Evidence from Testing

Let's test some problematic cases:

### Test Case 1: Missing Quantity Prefix
Input: "Cerveza 5,00" (should be 1 item at 5.00€)
- Currently works correctly (quantity=1, unitPrice=5.00)
- BUT if this was supposed to be "2 Cerveza 2,50" and only "5,00" was OCR'd:
  - Gets treated as 1 item at 5.00€
  - Should be 2 items at 2.50€
  - **Unit price (5.00) equals the OCR-detected value that was actually a total**

### Test Case 2: Quantity After Product Name  
Input: "Cerveza 2 5,00" (2 beers at 2.50€ each)
- Numbers: [2, 5.00]
- Current logic: 
  - p1=2, p2=5.00
  - lineTotal = 5.00 (assumes p2 is total)
  - |2*round(2) - 5.00| = |4-5.00| = 1.00 ≮ 0.05 → else branch
  - unitPrice = p1 = 2.00
  - quantity = round(5.00/2) = 2
  - Result: quantity=2, unitPrice=2.00 (WRONG - should be 2.50)

### Test Case 3: Quantity-UnitPrice Pattern (Missing Total)
Input: "2 Cerveza 2,50" (2 beers at 2.50€ each, total should be 5.00)
- Numbers: [2, 2.50]
- Current logic:
  - p1=2, p2=2.50  
  - lineTotal = 2.50 (WRONG - assumes p2 is total, but it's unitPrice)
  - |2*round(2) - 2.50| = |4-2.50| = 1.50 ≮ 0.05 → else branch
  - unitPrice = p1 = 2.00 (WRONG - this is the quantity!)
  - quantity = round(2.50/2) = 1
  - Result: quantity=1, unitPrice=2.00, total=2.00 (all wrong)

## Proposed Solutions

### Solution 1: Improve Quantity Detection
Enhance the regex to catch more quantity patterns:
```typescript
// Current (too restrictive):
/^(\d+)\s*[xX]?\s+/

// Improved (more flexible):
/(\d+)\s*[xX]?\s*/  // Find quantity anywhere, not just start
// Or even better, look for common patterns:
/(?:^|\s)(\d+)\s*[xX]?(?=\s|$)/  # Number with optional x, followed by space/end
```

### Solution 2: Fix Two-Price Logic
Correct the mathematical error and expand pattern recognition:
```typescript
// Fix the integer detection
const isLikelyInteger = Math.abs(p1 - Math.round(p1)) < 0.05

// Consider all three reasonable interpretations for [p1, p2]:
// 1. [quantity, unitPrice] → total = p1 * p2
// 2. [quantity, total] → unitPrice = p2 / p1  
// 3. [unitPrice, total] → quantity = p2 / p1 (if nearly integer)

// Choose based on plausibility scores
```

### Solution 3: Contextual Heuristics
Use additional clues:
- Typical quantity ranges (1-20 is common for items)
- Typical price ranges (0.10-100.00 for individual items)
- Sequential logic (quantities are usually integers)
- Product name context (if detectable)

## Implementation Plan

In this worktree, I will:
1. Create test cases that demonstrate the current failure modes
2. Implement improved quantity detection 
3. Fix the two-price logic to handle all three permutations
4. Add validation to reject implausible combinations
5. Test with realistic OCR error scenarios

## Files to Modify
- `frontend/src/lib/scan/receipt-parser.ts` - Main parsing logic
- Potentially add tests to verify fixes

## Expected Outcome
After fixes, the system should:
- Correctly identify quantities in more OCR scenarios
- Reduce false positives where totals are mistaken for unit prices  
- Provide better fallback logic when OCR is partial or noisy
- Maintain backward compatibility with currently working cases

