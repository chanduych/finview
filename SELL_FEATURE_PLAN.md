# Sell Feature Implementation Plan

## Overview
Add the ability to record sell transactions, track realized gains/losses, and update holdings accordingly.

---

## 1. Database Schema Changes

### Option A: Add `type` field to transactions table (Recommended)
```sql
ALTER TABLE transactions 
ADD COLUMN type TEXT NOT NULL DEFAULT 'BUY' CHECK (type IN ('BUY', 'SELL'));
```

**Pros:**
- Clear separation of buy/sell
- Easy to query and filter
- Better for reporting

**Cons:**
- Requires migration for existing data
- Need to update all transaction queries

### Option B: Use negative quantity for sells
- Keep current schema
- Sell transactions have negative quantity
- `quantity: -10` means selling 10 units

**Pros:**
- No schema changes needed
- Backward compatible

**Cons:**
- Less explicit/intuitive
- Harder to query sells separately
- Potential confusion with negative quantities

**Recommendation: Option A** - More explicit and maintainable

---

## 2. Data Model Updates

### Transaction Object Structure
```javascript
{
  id: "uuid",
  portfolio_id: "uuid",
  user_id: "uuid",
  type: "BUY" | "SELL",  // NEW
  quantity: number,      // Always positive
  price: number,
  date: "YYYY-MM-DD",
  created_at: timestamp,
  updated_at: timestamp
}
```

### Portfolio Calculations (Updated)
```javascript
// Current holdings
const buyQty = asset.transactions
  .filter(tx => tx.type === 'BUY')
  .reduce((sum, tx) => sum + tx.quantity, 0);

const sellQty = asset.transactions
  .filter(tx => tx.type === 'SELL')
  .reduce((sum, tx) => sum + tx.quantity, 0);

const totalQty = buyQty - sellQty;  // Current holdings

// Total invested (only from BUY transactions)
const totalInvested = asset.transactions
  .filter(tx => tx.type === 'BUY')
  .reduce((sum, tx) => sum + (tx.quantity * tx.price), 0);

// Total realized (from SELL transactions)
const totalRealized = asset.transactions
  .filter(tx => tx.type === 'SELL')
  .reduce((sum, tx) => sum + (tx.quantity * tx.price), 0);

// Average buy price (for cost basis)
const avgBuyPrice = buyQty > 0 ? totalInvested / buyQty : 0;
```

---

## 3. Cost Basis Calculation Methods

### FIFO (First In, First Out) - **SELECTED**
- Match each SELL transaction with oldest BUY transactions
- More accurate and tax-compliant
- Required for most tax jurisdictions
- Tracks which specific buy lots were sold

**Implementation:**
- Maintain a queue of buy transactions
- When selling, match against oldest buys first
- Track remaining quantity in each buy lot
- Calculate realized P&L per sell transaction based on matched buy lots

---

## 4. Realized vs Unrealized Gains

### Realized Gains/Losses (from SELL transactions) - FIFO Method
```javascript
// Calculate realized gains using FIFO
const calculateRealizedGainsFIFO = (asset) => {
  // Sort buy transactions by date (oldest first)
  const buyQueue = [...asset.transactions
    .filter(tx => tx.type === 'BUY')
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(tx => ({ ...tx, remainingQty: tx.quantity }))]; // Track remaining quantity
  
  const sellTransactions = asset.transactions
    .filter(tx => tx.type === 'SELL')
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  
  let totalRealizedGains = 0;
  const perTransactionGains = [];
  
  sellTransactions.forEach(sellTx => {
    let remainingSellQty = sellTx.quantity;
    let transactionRealizedGain = 0;
    
    // Match against oldest buys first (FIFO)
    while (remainingSellQty > 0 && buyQueue.length > 0) {
      const buyLot = buyQueue[0];
      const matchedQty = Math.min(remainingSellQty, buyLot.remainingQty);
      
      const costBasis = matchedQty * buyLot.price;
      const saleValue = matchedQty * sellTx.price;
      transactionRealizedGain += (saleValue - costBasis);
      
      remainingSellQty -= matchedQty;
      buyLot.remainingQty -= matchedQty;
      
      if (buyLot.remainingQty === 0) {
        buyQueue.shift(); // Remove fully consumed lot
      }
    }
    
    totalRealizedGains += transactionRealizedGain;
    perTransactionGains.push({
      transaction: sellTx,
      realizedGain: transactionRealizedGain,
      cumulativeGain: totalRealizedGains
    });
  });
  
  return {
    total: totalRealizedGains,
    perTransaction: perTransactionGains
  };
};
```

### Unrealized Gains/Losses (current holdings)
```javascript
const unrealizedGains = (currentPrice - avgBuyPrice) * totalQty;
```

### Total P&L
```javascript
const totalPnL = realizedGains + unrealizedGains;
```

---

## 5. Tax Calculations (Updated)

### Realized Capital Gains
- **STCG (Short-Term)**: SELL transactions where holding period < 365 days
- **LTCG (Long-Term)**: SELL transactions where holding period >= 365 days

### Calculation Logic (FIFO-based)
```javascript
const calculateRealizedCapitalGains = (asset) => {
  let stcg = 0, ltcg = 0;
  
  // Sort buys by date (oldest first) for FIFO matching
  const buyQueue = [...asset.transactions
    .filter(tx => tx.type === 'BUY')
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(tx => ({ ...tx, remainingQty: tx.quantity }))];
  
  asset.transactions
    .filter(tx => tx.type === 'SELL')
    .sort((a, b) => new Date(a.date) - new Date(b.date)) // Process chronologically
    .forEach(sellTx => {
      let remainingSellQty = sellTx.quantity;
      
      while (remainingSellQty > 0 && buyQueue.length > 0) {
        const buyLot = buyQueue[0];
        const matchedQty = Math.min(remainingSellQty, buyLot.remainingQty);
        
        // Calculate gain for this matched portion
        const costBasis = matchedQty * buyLot.price;
        const saleValue = matchedQty * sellTx.price;
        const gain = saleValue - costBasis;
        
        // Calculate holding period (sell date - buy date)
        const holdingPeriod = (new Date(sellTx.date) - new Date(buyLot.date)) / (1000 * 60 * 60 * 24);
        
        if (holdingPeriod < 365) {
          stcg += gain;
        } else {
          ltcg += gain;
        }
        
        remainingSellQty -= matchedQty;
        buyLot.remainingQty -= matchedQty;
        
        if (buyLot.remainingQty === 0) {
          buyQueue.shift();
        }
      }
    });
  
  return { stcg, ltcg };
};
```

---

## 6. XIRR Calculation Updates

### Current XIRR Logic
- All transactions are outflows (negative)
- Current value is inflow (positive)

### Updated XIRR Logic
- BUY transactions: Outflows (negative)
- SELL transactions: Inflows (positive)
- Current holdings value: Inflow (positive)

```javascript
const xirrTransactions = asset.transactions.map(tx => ({
  amount: tx.type === 'BUY' 
    ? -(tx.quantity * tx.price)  // Outflow
    : (tx.quantity * tx.price),  // Inflow
  when: new Date(tx.date)
}));

// Add current holdings value as final inflow
xirrTransactions.push({
  amount: totalQty * currentPrice,
  when: new Date()
});
```

---

## 7. UI/UX Changes

### A. Add Transaction Form
**Location:** `MobileAssetCard.jsx` and `AssetRow.jsx`

**Changes:**
1. Add transaction type toggle/selector:
   - Radio buttons: "Buy" | "Sell"
   - Or dropdown/segmented control
   - Default: "Buy"

2. Validation for SELL:
   - Check if sufficient holdings exist
   - `sellQuantity <= totalQty`
   - Show error: "Insufficient holdings. You only have X units."

3. Visual indicators:
   - Different icon/color for SELL transactions
   - Red/down arrow for sells
   - Green/up arrow for buys

### B. Transaction List Display (Timeline)
**Changes:**
1. **Display SELL transactions in existing timeline** - Mixed with BUY transactions, sorted by date
2. Show transaction type badge/icon:
   - Buy = green/up arrow (TrendingUp icon)
   - Sell = red/down arrow (TrendingDown icon)
3. Show realized P&L for each SELL transaction:
   - Per transaction: "Realized: +₹X,XXX" or "Realized: -₹X,XXX"
   - Cumulative: "Total Realized: +₹X,XXX" (running total)
4. Visual styling:
   - Sell transactions have red accent/border
   - Buy transactions have green accent/border
   - Highlight profit (green) or loss (red) for sells
5. Show which buy lots were matched (optional detail - can be in expanded view)

### C. Portfolio Summary Card
**New Metrics:**
- Realized P&L (total from all sells) - **Cumulative**
- Unrealized P&L (current holdings)
- Total P&L = Realized + Unrealized
- Show both cumulative and per-transaction realized P&L in details

### D. Asset Card Updates
**New Sections:**
- Realized Gains/Losses section
  - Per transaction realized P&L (shown in timeline)
  - Cumulative realized P&L (summary)
- Breakdown: Realized vs Unrealized
- Show average buy price vs current price

### E. Portfolio View Filter
**New Toggle:**
- **"Show Fully Sold Assets"** toggle in portfolio view
- Location: Filter section or settings
- Default: OFF (hide fully sold assets)
- When ON: Shows assets with 0 holdings but with realized P&L history
- Useful for tracking complete investment history

### E. Add Investment Modal
**Changes:**
- Add transaction type selector
- When "Sell" is selected:
  - Show current holdings
  - Validate quantity against holdings
  - Show estimated realized P&L preview

---

## 8. Implementation Steps

### Phase 1: Database & Backend
1. ✅ Add `type` column to transactions table (migration)
2. ✅ Update Supabase service functions:
   - `createTransaction()` - accept type parameter
   - `updateTransaction()` - handle type
   - `getTransactions()` - filter by type if needed
3. ✅ Update localStorage structure (add type to transactions)
4. ✅ Migration script for existing data (set all to 'BUY')

### Phase 2: Calculation Logic
1. ✅ Update `processedPortfolio` in `App.jsx`:
   - Separate BUY/SELL transactions
   - Calculate holdings correctly
   - Calculate realized gains
   - Calculate unrealized gains
2. ✅ Update `calculateCapitalGains()`:
   - Track realized STCG/LTCG
   - Track unrealized STCG/LTCG separately
3. ✅ Update `calculateXIRR()`:
   - Handle SELL as inflows
   - Adjust for current holdings

### Phase 3: UI Components
1. ✅ Update `MobileAssetCard.jsx`:
   - Add transaction type selector
   - Validate sell quantity
   - Show realized P&L
   - Visual distinction for sell transactions
2. ✅ Update `AssetRow.jsx` (desktop):
   - Same changes as mobile
3. ✅ Update `AddAssetModal.jsx`:
   - Add transaction type selector
   - Show holdings when selling
   - Preview realized P&L

### Phase 4: Display & Reporting
1. ✅ Update portfolio summary:
   - Add realized P&L metric (cumulative)
   - Show breakdown: Realized vs Unrealized
2. ✅ Update asset cards:
   - Show realized vs unrealized
   - Show per-transaction and cumulative realized P&L
   - **Add toggle: "Show Fully Sold Assets"** - Filter assets with 0 holdings
3. ✅ Update transaction timeline:
   - Display SELL transactions in existing timeline
   - Show realized P&L per sell transaction
   - Visual distinction (red/down icon for sells)
4. ✅ Update analytics/insights:
   - Realized gains chart
   - Tax reporting with realized gains (STCG/LTCG)

### Phase 5: Testing & Edge Cases
1. ✅ Test scenarios:
   - Sell more than holdings (should be prevented)
   - Sell all holdings (should show 0 holdings)
   - Multiple buys and sells
   - Sell at profit/loss
   - XIRR with sells
   - Tax calculations with sells
2. ✅ Edge cases:
   - Sell before any buy (shouldn't be possible)
   - Sell quantity = 0
   - Negative holdings (shouldn't be possible)

---

## 9. Data Migration Strategy

### For Supabase Users
```sql
-- Add type column with default
ALTER TABLE transactions 
ADD COLUMN type TEXT CHECK (type IN ('BUY', 'SELL'));

-- Set all existing transactions to BUY
UPDATE transactions SET type = 'BUY' WHERE type IS NULL;

-- Make it NOT NULL after setting defaults
ALTER TABLE transactions 
ALTER COLUMN type SET NOT NULL,
ALTER COLUMN type SET DEFAULT 'BUY';
```

### For LocalStorage Users
- On app load, check if transactions have `type` field
- If missing, add `type: 'BUY'` to all existing transactions
- Save updated data

---

## 10. Validation Rules

### SELL Transaction Validation
1. **Quantity Check:**
   ```javascript
   if (type === 'SELL' && quantity > currentHoldings) {
     throw new Error(`Insufficient holdings. You only have ${currentHoldings} units.`);
   }
   ```

2. **Date Check:**
   - Sell date cannot be before first buy date
   - Sell date cannot be in the future

3. **Price Check:**
   - Price must be positive
   - Price should be reasonable (warn if very different from current price)

---

## 11. UI Mockups/Design Considerations

### Transaction Type Selector
```
┌─────────────────────────┐
│  [Buy] [Sell]          │  ← Segmented control
└─────────────────────────┘
```

### Sell Transaction Form
```
┌─────────────────────────┐
│ Type: [Sell]           │
│                        │
│ Current Holdings: 150  │  ← Show available
│                        │
│ Quantity: [___]       │
│ Price: ₹[___]         │
│                        │
│ Realized P&L: +₹500   │  ← Preview
└─────────────────────────┘
```

### Transaction List Item
```
┌─────────────────────────┐
│ 🔴 SELL                │  ← Red indicator
│ 50 units @ ₹2,500      │
│ Date: 2024-01-15       │
│ Realized: +₹2,500      │
└─────────────────────────┘
```

---

## 12. Decisions Made ✅

1. **Cost Basis Method:** ✅ **FIFO only** - Match sells with oldest buys first
2. **Sell All Holdings:** ✅ **Toggle to show/hide fully sold assets** - Keep assets with 0 holdings, allow user to toggle visibility
3. **Historical Sells:** ✅ **Display in existing timeline** - Show sell transactions alongside buy transactions in the current timeline view
4. **Realized P&L Display:** ✅ **Show both** - Per transaction AND cumulative realized P&L
5. **Tax Reporting:** ✅ **Include realized gains** - Tax reports should show realized STCG/LTCG from sell transactions

---

## 13. Testing Checklist

- [ ] Add buy transaction
- [ ] Add sell transaction (partial)
- [ ] Add sell transaction (full)
- [ ] Try to sell more than holdings (should fail)
- [ ] Edit sell transaction
- [ ] Delete sell transaction
- [ ] Multiple buys and sells
- [ ] Holdings calculation correct
- [ ] Realized P&L calculation correct
- [ ] Unrealized P&L calculation correct
- [ ] XIRR with sells
- [ ] Tax calculations (STCG/LTCG) with sells
- [ ] Portfolio summary shows realized P&L (cumulative)
- [ ] Asset card shows realized vs unrealized
- [ ] Transaction timeline shows SELL transactions mixed with BUY
- [ ] Per-transaction realized P&L shown in timeline
- [ ] Cumulative realized P&L calculated correctly
- [ ] "Show Fully Sold Assets" toggle works
- [ ] Fully sold assets hidden by default
- [ ] Tax report includes realized gains (STCG/LTCG)
- [ ] Migration of existing data works
- [ ] Works with both Supabase and localStorage

---

## 14. Future Enhancements (Post-MVP)

1. ~~**FIFO Cost Basis**~~ - ✅ Implemented in MVP
2. **Tax Lot Tracking** - Show which specific buy lots were matched to each sell
3. **Sell Transaction Templates** - Quick sell buttons (25%, 50%, 100% of holdings)
4. **Realized Gains Chart** - Visualize sell performance over time
5. **Tax Export** - Export sell transactions with realized gains for tax filing
6. **Sell Alerts** - Notify when to sell for tax loss harvesting
7. **Partial Sell History** - Detailed view of which lots were sold in each transaction
8. **Average Cost Basis Option** - Allow users to choose between FIFO and Average Cost

---

## Next Steps

1. **Review this plan** - Confirm approach and decisions
2. **Start with Phase 1** - Database schema changes
3. **Implement incrementally** - One phase at a time
4. **Test thoroughly** - Especially edge cases
5. **Get user feedback** - Iterate on UI/UX

---

**Ready to proceed?** Let me know if you want to adjust anything or if you have questions about any part of the plan!
