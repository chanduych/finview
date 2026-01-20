import { ALPHA_VANTAGE_API_KEY } from '../constants/appConfig';

/**
 * Fetches NSE stock data using Vite proxy (dev) or direct API (prod)
 * @param {string} symbol - Clean symbol (e.g., "RELIANCE", "TCS")
 * @returns {Promise<Object|null>} Market data object or null
 */
const fetchNSEData = async (symbol) => {
    try {
        console.log(`Fetching NSE data for ${symbol} via Vite proxy...`);

        // Use Vite dev proxy - /api/nse proxies to https://www.nseindia.com
        const response = await fetch(`/api/nse/api/quote-equity?symbol=${encodeURIComponent(symbol)}`);

        if (!response.ok) {
            console.log(`NSE API failed for ${symbol}: ${response.status}`);
            return null;
        }

        const data = await response.json();

        if (data?.priceInfo) {
            const priceInfo = data.priceInfo;
            console.log(`✅ NSE API success for ${symbol}`);
            return {
                price: parseFloat(priceInfo.lastPrice),
                change: parseFloat(priceInfo.change),
                changePercent: parseFloat(priceInfo.pChange),
                name: data.info?.companyName || symbol,
                timestamp: Date.now(),
                source: 'NSE'
            };
        }

        console.log(`NSE API returned no price info for ${symbol}`);
        return null;
    } catch (error) {
        console.log(`NSE API error for ${symbol}:`, error.message);
        return null;
    }
};


/**
 * Fetches market data for a given symbol from multiple data sources.
 *
 * Priority order for STOCK/ETF:
 * 1. NSE API (real-time, works for both NSE and BSE stocks!) - PRIMARY
 * 2. Mutual Fund API (for MF)
 *
 * @param {string} symbol - The stock/MF/ETF symbol
 * @param {string} type - Asset type: 'STOCK', 'ETF', 'MF', or 'CASH'
 * @param {Object} options - Additional options
 * @param {boolean} options.isBSE - Whether the symbol is from BSE
 * @param {boolean} options.isNSE - Whether the symbol is from NSE
 * @param {string} options.originalSymbol - Original symbol with exchange suffix
 * @returns {Promise<Object|null>} Market data object with price, change, changePercent, name, timestamp
 */
export const getMarketData = async (symbol, type, options = {}) => {
    try {
        if (type === 'MF') {
            const res = await fetch(`/api/mf/mf/${symbol}`);
            const data = await res.json();
            if (!data.data?.[0]) return null;
            const nav = parseFloat(data.data[0].nav);
            const prevNav = data.data[1] ? parseFloat(data.data[1].nav) : nav;
            return {
                price: nav,
                change: nav - prevNav,
                changePercent: prevNav !== 0 ? ((nav - prevNav) / prevNav) * 100 : 0,
                name: data.meta.scheme_name,
                source: 'MFAPI'
            };
        } else if (type === 'CASH') {
            return { price: 1, change: 0, changePercent: 0, name: symbol, source: 'CASH' };
        } else {
            // STOCK or ETF - Use NSE API for all stocks (works for both NSE and BSE)
            const cleanSymbol = symbol.toUpperCase().replace(/\.(NS|NSE|BO|BSE)$/i, '');

            console.log(`Fetching stock data for ${cleanSymbol} via NSE API...`);
            const nseData = await fetchNSEData(cleanSymbol);

            if (nseData) {
                console.log(`✅ NSE API success for ${cleanSymbol}`);
                return nseData;
            }

            console.error(`❌ NSE API failed for ${cleanSymbol}`);
            return null;
        }
    } catch (e) {
        console.error('Market data error:', e);
        return null;
    }
};

/**
 * Verifies a symbol and fetches its current price.
 * Handles exchange suffix detection and proper routing to market data sources.
 *
 * @param {string} symbol - The symbol to verify (can include exchange suffix like .BSE, .NS)
 * @param {string} type - Asset type: 'STOCK', 'ETF', 'MF'
 * @returns {Promise<Object|null>} Market data object with price and name, or null if invalid
 */
export const verifySymbol = async (symbol, type) => {
    if (!symbol) return null;

    const upperSymbol = symbol.toUpperCase().trim();

    // Preserve exchange information if present (e.g., VBL.BSE, RELIANCE.NS)
    const isBSE = upperSymbol.includes('.BSE') || upperSymbol.includes('.BO');
    const isNSE = upperSymbol.includes('.NSE') || upperSymbol.includes('.NS');

    // Clean symbol but remember the exchange
    const cleanSymbol = upperSymbol.replace(/\.(BSE|BO|NSE|NS)$/i, '');

    // If user typed with exchange suffix, use it; otherwise try both
    let symbolToTry = upperSymbol;
    if (isBSE) {
        symbolToTry = cleanSymbol; // Will try BSE: format in getMarketData
    } else if (isNSE) {
        symbolToTry = cleanSymbol; // Will try NSE: format in getMarketData
    } else {
        symbolToTry = cleanSymbol; // Will try both in getMarketData
    }

    const data = await getMarketData(symbolToTry, type, { isBSE, isNSE, originalSymbol: upperSymbol });
    return data;
};

/**
 * Processes a search result selection and verifies the symbol.
 * Handles both Mutual Fund and Stock/ETF results, preserving exchange information.
 *
 * @param {Object} result - The search result object
 * @param {string} result.searchType - Type of search result: 'MF', 'STOCK', or 'ETF'
 * @param {string} result.symbol - The symbol
 * @param {string} result.name - Display name
 * @param {string} result.schemeName - For MF results
 * @param {string} result.schemeCode - For MF results
 * @param {string} result.exchange - Exchange: 'NSE' or 'BSE'
 * @returns {Promise<Object>} Object containing symbol, name, type, and market data
 */
export const handleSelectResult = async (result) => {
    if (result.searchType === 'MF') {
        // Mutual Fund result
        const symbol = result.schemeCode.toString();
        const name = result.schemeName;
        const type = 'MF';
        const data = await verifySymbol(symbol, type);

        return {
            symbol,
            name,
            type,
            data
        };
    } else {
        // Stock/ETF result - preserve exchange information
        let symbolToSet = result.symbol;

        // Check if symbol already has exchange suffix
        const hasBSE = symbolToSet.includes('.BSE') || symbolToSet.includes('.BO');
        const hasNSE = symbolToSet.includes('.NS') || symbolToSet.includes('.NSE');

        // Only append exchange suffix if not already present and exchange is known
        if (!hasBSE && !hasNSE) {
            if (result.exchange === 'BSE') {
                symbolToSet = `${symbolToSet}.BSE`;
            } else if (result.exchange === 'NSE') {
                symbolToSet = `${symbolToSet}.NS`;
            }
        }

        const name = result.name;
        const type = result.searchType === 'ETF' ? 'ETF' : 'STOCK';
        const data = await verifySymbol(symbolToSet, type);

        return {
            symbol: symbolToSet,
            name,
            type,
            data
        };
    }
};

/**
 * Batch refreshes market prices for all portfolio items.
 * Handles exchange information properly and updates market prices with timestamps.
 *
 * @param {Array} portfolio - Array of portfolio items with symbol and type
 * @returns {Promise<Object>} Object with updated market prices keyed by symbol
 */
export const refreshPrices = async (portfolio) => {
    if (!portfolio || portfolio.length === 0) {
        return {};
    }

    const symbols = [...new Set(portfolio.map(p => {
        const symbol = p.symbol;
        const isBSE = symbol.includes('.BSE') || symbol.includes('.BO');
        const isNSE = symbol.includes('.NS') || symbol.includes('.NSE');
        return {
            symbol: p.symbol,
            type: p.type,
            isBSE,
            isNSE
        };
    }))];

    // Refresh prices with proper exchange info
    const results = await Promise.all(symbols.map(async (s) => {
        const data = await getMarketData(s.symbol, s.type, { isBSE: s.isBSE, isNSE: s.isNSE });
        return { symbol: s.symbol, data };
    }));

    const marketPrices = {};
    results.forEach(r => {
        if (r.data) {
            marketPrices[r.symbol] = {
                ...r.data,
                timestamp: r.data.timestamp || Date.now() // Ensure timestamp is set
            };
        }
    });

    return marketPrices;
};
