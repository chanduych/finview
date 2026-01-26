/**
 * FIFO (First In, First Out) calculation utilities for sell transactions
 * Matches sell transactions with oldest buy transactions first
 */

/**
 * Calculate realized gains using FIFO method
 * @param {Array} transactions - All transactions (BUY and SELL), sorted by date
 * @param {number} currentPrice - Current market price (for validation)
 * @returns {Object} Object containing:
 *   - totalRealizedGain: Total realized gain/loss from all sells
 *   - perTransaction: Array of realized gains per sell transaction
 *   - buyQueue: Remaining buy lots after matching sells
 */
export const calculateFIFORealizedGains = (transactions, currentPrice = 0) => {
  // Separate and sort transactions
  const buyTransactions = transactions
    .filter(tx => (tx.type || 'BUY') === 'BUY')
    .sort((a, b) => new Date(a.date) - new Date(b.date)) // Oldest first
    .map(tx => ({
      ...tx,
      remainingQty: tx.quantity // Track remaining quantity
    }));

  const sellTransactions = transactions
    .filter(tx => (tx.type || 'BUY') === 'SELL')
    .sort((a, b) => new Date(a.date) - new Date(b.date)); // Process chronologically

  let totalRealizedGain = 0;
  const perTransactionGains = [];
  const buyQueue = [...buyTransactions]; // Working copy

  // Process each sell transaction
  sellTransactions.forEach(sellTx => {
    let remainingSellQty = sellTx.quantity;
    let transactionRealizedGain = 0;
    const matchedLots = []; // Track which buy lots were matched

    // Match against oldest buys first (FIFO)
    while (remainingSellQty > 0 && buyQueue.length > 0) {
      const buyLot = buyQueue[0];
      const matchedQty = Math.min(remainingSellQty, buyLot.remainingQty);

      // Calculate gain for this matched portion
      const costBasis = matchedQty * buyLot.price;
      const saleValue = matchedQty * sellTx.price;
      const gain = saleValue - costBasis;

      transactionRealizedGain += gain;

      matchedLots.push({
        buyDate: buyLot.date,
        buyPrice: buyLot.price,
        quantity: matchedQty,
        gain: gain
      });

      remainingSellQty -= matchedQty;
      buyLot.remainingQty -= matchedQty;

      // Remove fully consumed buy lot
      if (buyLot.remainingQty === 0) {
        buyQueue.shift();
      }
    }

    // If we couldn't match all sell quantity, log warning
    if (remainingSellQty > 0) {
      console.warn(`Insufficient holdings for sell transaction on ${sellTx.date}. Unmatched quantity: ${remainingSellQty}`);
    }

    totalRealizedGain += transactionRealizedGain;
    perTransactionGains.push({
      transaction: sellTx,
      realizedGain: transactionRealizedGain,
      cumulativeGain: totalRealizedGain,
      matchedLots: matchedLots
    });
  });

  return {
    totalRealizedGain: totalRealizedGain,
    perTransaction: perTransactionGains,
    buyQueue: buyQueue // Remaining buy lots (for calculating unrealized gains)
  };
};

/**
 * Calculate realized capital gains (STCG/LTCG) using FIFO
 * @param {Array} transactions - All transactions (BUY and SELL)
 * @returns {Object} Object with realizedStcg and realizedLtcg
 */
export const calculateRealizedCapitalGains = (transactions) => {
  let realizedStcg = 0;
  let realizedLtcg = 0;

  // Separate and sort transactions
  const buyQueue = transactions
    .filter(tx => (tx.type || 'BUY') === 'BUY')
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(tx => ({
      ...tx,
      remainingQty: tx.quantity
    }));

  const sellTransactions = transactions
    .filter(tx => (tx.type || 'BUY') === 'SELL')
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Process each sell transaction
  sellTransactions.forEach(sellTx => {
    let remainingSellQty = sellTx.quantity;
    const sellDate = new Date(sellTx.date);

    while (remainingSellQty > 0 && buyQueue.length > 0) {
      const buyLot = buyQueue[0];
      const matchedQty = Math.min(remainingSellQty, buyLot.remainingQty);

      // Calculate gain for this matched portion
      const costBasis = matchedQty * buyLot.price;
      const saleValue = matchedQty * sellTx.price;
      const gain = saleValue - costBasis;

      // Calculate holding period (sell date - buy date)
      const buyDate = new Date(buyLot.date);
      const holdingPeriod = (sellDate - buyDate) / (1000 * 60 * 60 * 24);

      // Categorize as STCG or LTCG
      if (holdingPeriod < 365) {
        realizedStcg += gain;
      } else {
        realizedLtcg += gain;
      }

      remainingSellQty -= matchedQty;
      buyLot.remainingQty -= matchedQty;

      if (buyLot.remainingQty === 0) {
        buyQueue.shift();
      }
    }
  });

  return {
    realizedStcg: Math.max(0, realizedStcg), // Only positive gains
    realizedLtcg: Math.max(0, realizedLtcg)
  };
};

/**
 * Calculate unrealized capital gains (STCG/LTCG) for current holdings
 * @param {Array} buyQueue - Remaining buy lots after matching sells (from FIFO calculation)
 * @param {number} currentPrice - Current market price
 * @param {Date} currentDate - Current date (defaults to today)
 * @returns {Object} Object with unrealizedStcg and unrealizedLtcg
 */
export const calculateUnrealizedCapitalGains = (buyQueue, currentPrice, currentDate = new Date()) => {
  let unrealizedStcg = 0;
  let unrealizedLtcg = 0;

  buyQueue.forEach(buyLot => {
    const buyDate = new Date(buyLot.date);
    const holdingPeriod = (currentDate - buyDate) / (1000 * 60 * 60 * 24);
    const costBasis = buyLot.remainingQty * buyLot.price;
    const currentValue = buyLot.remainingQty * currentPrice;
    const gain = currentValue - costBasis;

    if (holdingPeriod < 365) {
      unrealizedStcg += gain;
    } else {
      unrealizedLtcg += gain;
    }
  });

  return {
    unrealizedStcg: unrealizedStcg, // Can be negative (losses)
    unrealizedLtcg: unrealizedLtcg
  };
};
