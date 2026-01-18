import { ALPHA_VANTAGE_API_KEY } from '../constants/appConfig';

/**
 * Fetches market data for a given symbol from multiple data sources.
 *
 * Priority order for STOCK/ETF:
 * 1. NSE API (real-time, NSE stocks only)
 * 2. Yahoo Finance (real-time, both NSE and BSE)
 * 3. Alpha Vantage (15-20 min delay, last resort)
 *
 * @param {string} symbol - The stock/MF/ETF symbol
 * @param {string} type - Asset type: 'STOCK', 'ETF', 'MF', or 'CASH'
 * @param {Object} options - Additional options
 * @param {boolean} options.isBSE - Whether the symbol is from BSE
 * @param {boolean} options.isNSE - Whether the symbol is from NSE
 * @param {string} options.originalSymbol - Original symbol with exchange suffix
 * @returns {Promise<Object|null>} Market data object with price, change, changePercent, name, timestamp, and delayed flag
 */
export const getMarketData = async (symbol, type, options = {}) => {
    try {
        if (type === 'MF') {
            const res = await fetch(`https://api.mfapi.in/mf/${symbol}`);
            const data = await res.json();
            if (!data.data?.[0]) return null;
            const nav = parseFloat(data.data[0].nav);
            const prevNav = data.data[1] ? parseFloat(data.data[1].nav) : nav;
            return {
                price: nav,
                change: nav - prevNav,
                changePercent: prevNav !== 0 ? ((nav - prevNav) / prevNav) * 100 : 0,
                name: data.meta.scheme_name
            };
        } else if (type === 'CASH') {
            return { price: 1, change: 0, changePercent: 0, name: symbol };
        } else {
            // STOCK or ETF - Handle symbol format properly
            // Prioritize real-time sources (NSE/Yahoo) over delayed sources (Alpha Vantage)
            const cleanSymbol = symbol.toUpperCase().replace(/\.(NS|NSE|BO|BSE)$/i, '');
            const { isBSE, isNSE } = options;

            // PRIORITY 1: Yahoo Finance (real-time, works for both NSE and BSE, no CORS issues)
            const yahooSymbols = isBSE
                ? [`${cleanSymbol}.BO`]
                : isNSE
                    ? [`${cleanSymbol}.NS`]
                    : [`${cleanSymbol}.NS`, `${cleanSymbol}.BO`];

            for (const ticker of yahooSymbols) {
                try {
                    // Direct Yahoo Finance API call (no proxy needed, CORS is allowed)
                    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;
                    const response = await fetch(yahooUrl);

                    if (response.ok) {
                        const yahooData = await response.json();
                        if (yahooData?.chart?.result?.[0]) {
                            const meta = yahooData.chart.result[0].meta;
                            return {
                                price: meta.regularMarketPrice,
                                change: meta.regularMarketPrice - meta.chartPreviousClose,
                                changePercent: meta.chartPreviousClose !== 0 ? ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100 : 0,
                                name: meta.longName || meta.shortName || cleanSymbol,
                                timestamp: Date.now()
                            };
                        }
                    }
                } catch (e) {
                    console.log(`Yahoo Finance failed for ${ticker}:`, e);
                    continue; // Try next symbol
                }
            }

            // PRIORITY 2: Alpha Vantage (15-20 min delay, use as last resort)
            try {
                // Determine which exchanges to try based on user input or try both
                let avSymbols = [];
                if (isBSE) {
                    avSymbols = [`BSE:${cleanSymbol}`, cleanSymbol]; // Try BSE first
                } else if (isNSE) {
                    avSymbols = [`NSE:${cleanSymbol}`, cleanSymbol]; // Try NSE first
                } else {
                    avSymbols = [`NSE:${cleanSymbol}`, `BSE:${cleanSymbol}`, cleanSymbol]; // Try both
                }

                for (const avSymbol of avSymbols) {
                    const avUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(avSymbol)}&apikey=${ALPHA_VANTAGE_API_KEY}`;
                    const avResponse = await fetch(avUrl);

                    if (avResponse.ok) {
                        const avData = await avResponse.json();

                        // Check for API limit
                        if (avData['Note'] || avData['Information']) {
                            console.warn('Alpha Vantage API limit reached');
                            break;
                        }

                        const quote = avData['Global Quote'];
                        if (quote && quote['05. price']) {
                            const price = parseFloat(quote['05. price']);
                            const prevClose = parseFloat(quote['08. previous close'] || price);
                            const change = parseFloat(quote['09. change'] || (price - prevClose));
                            const changePercent = parseFloat(quote['10. change percent']?.replace('%', '') || ((change / prevClose) * 100));

                            return {
                                price: price,
                                change: change,
                                changePercent: changePercent,
                                name: quote['01. symbol']?.replace(/^(NSE|BSE):/i, '') || cleanSymbol,
                                timestamp: Date.now(), // Add timestamp
                                delayed: true // Mark as delayed data
                            };
                        }
                    }
                }
            } catch (avError) {
                console.log('Alpha Vantage API failed:', avError);
            }

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
