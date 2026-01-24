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
 * Calculate simple annualized return as a fallback when XIRR fails
 * ONLY used for single-transaction cases where the calculation is accurate
 * 
 * @param {Array} transactions - Cash flow transactions (investments are negative)
 * @param {number} currentValue - Current portfolio value
 * @param {number} investmentCount - Number of investment transactions (excluding current value)
 * @returns {number|null} Annualized return percentage, or null if not suitable for simple calc
 */
const calculateSimpleAnnualizedReturn = (transactions, currentValue, investmentCount) => {
    try {
        // Only use simple calculation for single transaction cases
        // For multiple transactions, XIRR is the only accurate method
        if (investmentCount > 1) {
            return null; // Don't provide inaccurate fallback
        }
        
        // Get total invested (sum of all negative amounts)
        const totalInvested = transactions
            .filter(t => t.amount < 0)
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        
        if (totalInvested <= 0) return null;
        
        // Get earliest transaction date
        const sortedTx = [...transactions].sort((a, b) => a.when - b.when);
        const firstDate = sortedTx[0].when;
        const today = new Date();
        
        // Calculate days held
        const daysHeld = Math.max(1, (today - firstDate) / (1000 * 60 * 60 * 24));
        
        // Simple return
        const simpleReturn = (currentValue - totalInvested) / totalInvested;
        
        // For very short periods (< 30 days), don't annualize - it creates misleading numbers
        if (daysHeld < 30) {
            return null; // Too short to provide meaningful annualized return
        }
        
        // For longer periods, use proper annualization
        const yearsHeld = daysHeld / 365;
        const annualizedReturn = (Math.pow(1 + simpleReturn, 1 / yearsHeld) - 1) * 100;
        
        // Cap extreme values
        return Math.max(-100, Math.min(1000, annualizedReturn));
    } catch (e) {
        return null;
    }
};

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
            return null;
        }

        // Need at least 2 cash flows for XIRR (one investment + one redemption)
        if (transactions.length < 2) {
            return null;
        }

        // Check if we have both positive and negative amounts
        const hasOutflow = transactions.some(t => t.amount < 0);
        const hasInflow = transactions.some(t => t.amount > 0);

        if (!hasOutflow || !hasInflow) {
            return null;
        }

        // Sort transactions by date (required by xirr library)
        transactions.sort((a, b) => a.when - b.when);

        // Verify transaction format for xirr library
        // xirr expects: [{ amount: number, when: Date }, ...]
        const xirrTransactions = transactions.map(t => ({
            amount: t.amount,
            when: t.when instanceof Date ? t.when : new Date(t.when)
        }));

        // Calculate XIRR with multiple attempts
        let result;
        let xirrSucceeded = false;
        
        // Try different initial guesses to help convergence
        const initialGuesses = [0.1, 0.0, 0.5, -0.5, 1.0, -0.9];
        
        for (const guess of initialGuesses) {
            try {
                // The xirr library returns a decimal (e.g., 0.05 for 5%)
                result = xirr(xirrTransactions, { guess });
                xirrSucceeded = true;
                break; // Success, exit loop
            } catch (xirrError) {
                // Try next guess
                continue;
            }
        }
        
        // If all guesses failed, try without options
        if (!xirrSucceeded) {
            try {
                result = xirr(xirrTransactions);
                xirrSucceeded = true;
            } catch (xirrError) {
                // XIRR failed - only use fallback for single-transaction assets
                const investmentCount = transactions.filter(t => t.amount < 0).length;
                const totalInflow = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
                const fallbackReturn = calculateSimpleAnnualizedReturn(transactions, totalInflow, investmentCount);
                
                if (fallbackReturn !== null) {
                    // Silently use fallback for single-transaction case
                    return fallbackReturn;
                }
                
                // For multi-transaction cases, return null - XIRR is the only accurate method
                return null;
            }
        }

        // Check if result is valid (not NaN or Infinity)
        if (result === null || result === undefined || isNaN(result) || !isFinite(result)) {
            // Try fallback only for single-transaction cases
            const investmentCount = transactions.filter(t => t.amount < 0).length;
            const totalInflow = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
            return calculateSimpleAnnualizedReturn(transactions, totalInflow, investmentCount);
        }

        // xirr returns a decimal (0.05 = 5%), convert to percentage
        const xirrPercent = result * 100;
        
        // Cap extreme values to prevent display issues
        if (xirrPercent > 1000) return 1000;
        if (xirrPercent < -100) return -100;
        
        return xirrPercent;
    } catch (e) {
        // Silent fail with null - don't spam console
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
