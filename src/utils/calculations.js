/**
 * Financial calculation utilities for portfolio analytics
 */

// Import xirr - CommonJS module
// @ts-ignore - CommonJS module compatibility
import xirrRaw from 'xirr';

// Extract the actual function from the module
let xirr;
if (typeof xirrRaw === 'function') {
    xirr = xirrRaw;
} else if (xirrRaw && typeof xirrRaw.default === 'function') {
    xirr = xirrRaw.default;
} else if (xirrRaw && typeof xirrRaw.xirr === 'function') {
    xirr = xirrRaw.xirr;
} else {
    // Fallback: try to get it from the module object
    xirr = xirrRaw;
    console.warn('XIRR import warning:', typeof xirrRaw, Object.keys(xirrRaw || {}));
}

// Verify it's a function
if (typeof xirr !== 'function') {
    console.error('XIRR is not a function. Type:', typeof xirr, 'Value:', xirr);
}

/**
 * Calculates the Extended Internal Rate of Return (XIRR) for an asset
 * XIRR is the annualized rate of return for investments with irregular cash flows
 *
 * @param {Object} asset - The asset object containing transactions and current value
 * @param {Array} asset.transactions - Array of transaction objects with date, price, and quantity
 * @param {number} asset.currentValue - Current value of the asset
 * @param {number} asset.currentPrice - Current price per unit
 * @param {number} asset.totalQty - Total quantity held
 * @param {number} asset.avgPrice - Average purchase price
 * @param {string} asset.symbol - Asset symbol for logging
 * @param {Object} marketPrices - Market prices lookup object (optional)
 * @returns {number|null} XIRR as a percentage or null if calculation fails
 */
export const calculateXIRR = (asset, marketPrices = {}) => {
    try {
        // Need at least one transaction
        if (!asset.transactions || asset.transactions.length === 0) {
            console.log('XIRR: No transactions for', asset.symbol);
            return null;
        }

        // Build transaction list with proper dates
        const transactions = asset.transactions
            .filter(t => {
                if (!t.date || t.quantity <= 0 || t.price <= 0) {
                    return false;
                }
                const date = new Date(t.date);
                return !isNaN(date.getTime());
            })
            .map(t => {
                const date = new Date(t.date);
                return {
                    amount: -(t.quantity * t.price), // Negative for outflows (investments)
                    when: date
                };
            });

        if (transactions.length === 0) {
            console.log('XIRR: No valid transactions after filtering for', asset.symbol);
            return null;
        }

        // Get current value - use provided currentValue or calculate
        let currentValue = asset.currentValue;
        if (!currentValue && asset.currentPrice !== undefined && asset.totalQty > 0) {
            currentValue = asset.totalQty * asset.currentPrice;
        } else if (!currentValue) {
            // Fallback to marketPrices
            const currentPrice = marketPrices[asset.symbol]?.price || asset.avgPrice || 0;
            currentValue = asset.totalQty * currentPrice;
        }

        // Add current value as positive inflow (redemption) - this is the key for XIRR
        if (currentValue > 0 && asset.totalQty > 0) {
            transactions.push({
                amount: currentValue,
                when: new Date()
            });
        } else {
            console.log('XIRR: Current value is 0 or invalid for', asset.symbol, 'currentValue:', currentValue, 'totalQty:', asset.totalQty);
            return null;
        }

        // Need at least 2 cash flows for XIRR (one investment + one redemption)
        if (transactions.length < 2) {
            console.log('XIRR: Not enough transactions for', asset.symbol, 'count:', transactions.length);
            return null;
        }

        // Check if we have both positive and negative amounts
        const hasOutflow = transactions.some(t => t.amount < 0);
        const hasInflow = transactions.some(t => t.amount > 0);

        if (!hasOutflow || !hasInflow) {
            console.log('XIRR: Missing outflow or inflow for', asset.symbol, 'hasOutflow:', hasOutflow, 'hasInflow:', hasInflow);
            return null;
        }

        // Sort transactions by date (required by xirr library)
        transactions.sort((a, b) => a.when - b.when);

        // Debug: Log transaction details
        console.log('XIRR Calculation for', asset.symbol, ':', {
            transactionCount: transactions.length,
            transactions: transactions.map(t => ({
                amount: t.amount,
                date: t.when.toISOString().split('T')[0]
            })),
            currentValue: currentValue,
            totalQty: asset.totalQty
        });

        // Verify transaction format for xirr library
        // xirr expects: [{ amount: number, when: Date }, ...]
        const xirrTransactions = transactions.map(t => ({
            amount: t.amount,
            when: t.when instanceof Date ? t.when : new Date(t.when)
        }));

        // Calculate XIRR
        let result;
        try {
            // The xirr library returns a decimal (e.g., 0.05 for 5%)
            result = xirr(xirrTransactions);
            console.log('XIRR raw result for', asset.symbol, ':', result, 'type:', typeof result);
        } catch (xirrError) {
            console.error('XIRR library error for', asset.symbol, ':', xirrError);
            console.error('Transaction data:', JSON.stringify(xirrTransactions.map(t => ({
                amount: t.amount,
                when: t.when.toISOString()
            })), null, 2));

            // Check if we have valid cash flows
            const totalOutflow = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
            const totalInflow = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);

            console.log('Cash flow summary:', {
                totalOutflow,
                totalInflow,
                netFlow: totalInflow - totalOutflow,
                transactionCount: transactions.length
            });

            if (totalInflow <= totalOutflow) {
                console.log('XIRR: Total inflow must be greater than total outflow for positive return');
            }
            return null;
        }

        // Check if result is valid (not NaN or Infinity)
        if (result === null || result === undefined || isNaN(result) || !isFinite(result)) {
            console.log('XIRR: Invalid result for', asset.symbol, 'result:', result, 'type:', typeof result);
            return null;
        }

        // xirr returns a decimal (0.05 = 5%), convert to percentage
        const xirrPercent = result * 100;
        console.log('XIRR calculated successfully for', asset.symbol, ':', xirrPercent.toFixed(2) + '%');
        return xirrPercent;
    } catch (e) {
        console.error('XIRR calculation error for', asset.symbol, ':', e);
        if (e.message) {
            console.error('Error message:', e.message);
        }
        return null;
    }
};

/**
 * Calculates Short-Term and Long-Term Capital Gains for an asset
 * Short-term: holding period < 365 days
 * Long-term: holding period >= 365 days
 *
 * @param {Object} asset - The asset object
 * @param {Array} asset.transactions - Array of transactions with date, price, and quantity
 * @param {string} asset.symbol - Asset symbol
 * @param {number} asset.avgPrice - Average purchase price (fallback for current price)
 * @param {Object} marketPrices - Market prices lookup object
 * @returns {Object} Object with stcg and ltcg properties (both non-negative numbers)
 */
export const calculateCapitalGains = (asset, marketPrices = {}) => {
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    let stcg = 0, ltcg = 0;

    asset.transactions.forEach(tx => {
        const txDate = new Date(tx.date);
        const holdingPeriod = (now - txDate) / (1000 * 60 * 60 * 24);
        const currentPrice = marketPrices[asset.symbol]?.price || asset.avgPrice;
        const gain = (currentPrice - tx.price) * tx.quantity;

        if (holdingPeriod < 365) {
            stcg += gain;
        } else {
            ltcg += gain;
        }
    });

    return { stcg: Math.max(0, stcg), ltcg: Math.max(0, ltcg) };
};
