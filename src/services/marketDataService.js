import { ALPHA_VANTAGE_API_KEY, MASSIVE_API_KEY } from '../constants/appConfig';

const MASSIVE_BASE = 'https://api.massive.com';

// Cache USD/INR rate (avoid hitting API every time); refresh every 10 min
let usdInrRateCache = { rate: null, at: 0 };
const USD_INR_CACHE_MS = 10 * 60 * 1000;

/** Append API key for Massive.com (Polygon) – standard auth is apiKey query param */
const massiveAuth = (url) => (MASSIVE_API_KEY ? `${url}${url.includes('?') ? '&' : '?'}apiKey=${MASSIVE_API_KEY}` : url);

/**
 * Fetches USD to INR exchange rate from Massive.com forex API (cached). Falls back to Alpha Vantage if needed.
 */
const getUSDToINRRate = async () => {
    if (usdInrRateCache.rate != null && Date.now() - usdInrRateCache.at < USD_INR_CACHE_MS) {
        return usdInrRateCache.rate;
    }
    if (MASSIVE_API_KEY) {
        try {
            const url = massiveAuth(`${MASSIVE_BASE}/v1/conversion/USD/INR?amount=1`);
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                const rate = typeof data?.converted === 'number' ? data.converted : null;
                if (rate > 0) {
                    usdInrRateCache = { rate, at: Date.now() };
                    return rate;
                }
            }
        } catch (e) {
            console.warn('Massive USD/INR fetch failed:', e);
        }
    }
    if (ALPHA_VANTAGE_API_KEY) {
        try {
            const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=INR&apikey=${ALPHA_VANTAGE_API_KEY}`;
            const res = await fetch(url);
            if (!res.ok) return usdInrRateCache.rate || 83;
            const data = await res.json();
            const rate = parseFloat(data?.['Realtime Currency Exchange Rate']?.['5. Exchange Rate']);
            if (rate > 0) {
                usdInrRateCache = { rate, at: Date.now() };
                return rate;
            }
        } catch (e) {
            console.warn('Alpha Vantage USD/INR fallback failed:', e);
        }
    }
    return usdInrRateCache.rate || 83;
};

/**
 * Fetches US stock quote from Massive.com (formerly Polygon.io) and converts to INR.
 * Tries snapshot first; on 403 (forbidden, often free tier) falls back to Previous Day Bar.
 * Returns price in INR (main), priceUSD for display, and change in INR.
 */
const fetchMassiveQuote = async (symbol) => {
    if (!MASSIVE_API_KEY) return null;
    const cleanSymbol = String(symbol).toUpperCase().replace(/\.(NS|NSE|BO|BSE)$/i, '');

    const buildResult = (priceUSD, changeUSD = 0, changePercent = 0) => {
        if (priceUSD == null || priceUSD <= 0) return null;
        return getUSDToINRRate().then((rate) => ({
            price: priceUSD * rate,
            priceUSD,
            change: changeUSD * rate,
            changePercent,
            name: cleanSymbol,
            timestamp: Date.now(),
            source: 'Massive',
        }));
    };

    try {
        // 1) Try snapshot first (returns 403 on many plans – snapshot is a premium endpoint)
        const snapshotUrl = massiveAuth(`${MASSIVE_BASE}/v2/snapshot/locale/us/markets/stocks/tickers/${encodeURIComponent(cleanSymbol)}`);
        const res = await fetch(snapshotUrl);
        const data = await res.json().catch(() => ({}));
        if (data?.status === 'NOT_AUTHORIZED') return null;
        if (res.ok) {
            const t = data?.ticker;
            if (t) {
                const priceUSD = typeof t?.day?.c === 'number' ? t.day.c : (typeof t?.lastTrade?.p === 'number' ? t.lastTrade.p : (typeof t?.lastQuote?.P === 'number' ? t.lastQuote.P : null));
                if (priceUSD != null && priceUSD > 0) {
                    const changeUSD = typeof t?.todaysChange === 'number' ? t.todaysChange : 0;
                    const changePercent = typeof t?.todaysChangePerc === 'number' ? t.todaysChangePerc : 0;
                    return buildResult(priceUSD, changeUSD, changePercent);
                }
            }
        }
        // 2) Fallback: Previous Day Bar (included on free/basic tier when snapshot returns 403)
        if (res.status === 403 || res.status === 401 || !res.ok) {
            const prevUrl = massiveAuth(`${MASSIVE_BASE}/v2/aggs/ticker/${encodeURIComponent(cleanSymbol)}/prev?adjusted=true`);
            const prevRes = await fetch(prevUrl);
            const prevData = await prevRes.json().catch(() => ({}));
            if (prevData?.status === 'NOT_AUTHORIZED') return null;
            if (prevRes.ok) {
                const bar = prevData?.results?.[0];
                if (bar && typeof bar.c === 'number') {
                    return buildResult(bar.c, 0, 0);
                }
            }
        }
    } catch (e) {
        console.error('Massive quote error:', e);
    }
    return null;
};

/**
 * Fetches US stock quote from Yahoo Finance (via /api/yahoo proxy). Used only for US stocks when Massive is not entitled.
 * Returns same shape as fetchMassiveQuote: price (INR), priceUSD, change, changePercent, name, source: 'Yahoo'.
 */
const fetchYahooQuote = async (symbol) => {
    const cleanSymbol = String(symbol).toUpperCase().replace(/\.(NS|NSE|BO|BSE)$/i, '');
    try {
        const res = await fetch(`/api/yahoo?symbol=${encodeURIComponent(cleanSymbol)}`);
        const data = await res.json().catch(() => ({}));
        // Support both our API format and raw Yahoo chart response (e.g. when proxied directly)
        let priceUSD = data?.priceUSD;
        let changeUSD = data?.change;
        let changePercent = data?.changePercent ?? 0;
        if (priceUSD == null && data?.chart?.result?.[0]) {
            const meta = data.chart.result[0].meta || {};
            priceUSD = meta.regularMarketPrice ?? meta.previousClose;
            const prev = meta.previousClose ?? meta.chartPreviousClose;
            if (prev != null && priceUSD != null) {
                changeUSD = priceUSD - prev;
                changePercent = prev !== 0 ? ((priceUSD - prev) / prev) * 100 : 0;
            } else {
                changeUSD = 0;
            }
        }
        if (priceUSD == null || priceUSD <= 0) return null;
        if (typeof changeUSD !== 'number') changeUSD = 0;
        const rate = await getUSDToINRRate();
        return {
            price: priceUSD * rate,
            priceUSD,
            change: changeUSD * rate,
            changePercent,
            name: data?.name || cleanSymbol,
            timestamp: Date.now(),
            source: 'Yahoo',
        };
    } catch (e) {
        console.warn('Yahoo quote error:', e);
        return null;
    }
};

/**
 * Fetches NSE stock data using Vercel serverless function (works in both dev and prod)
 * @param {string} symbol - Clean symbol (e.g., "RELIANCE", "TCS")
 * @returns {Promise<Object|null>} Market data object or null
 */
const fetchNSEData = async (symbol) => {
    try {
        console.log(`Fetching NSE data for ${symbol} via Vercel API...`);

        // Use Vercel serverless function - works in both dev and production
        const response = await fetch(`/api/nse?symbol=${encodeURIComponent(symbol)}`);

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
            // Call MF API directly - it supports CORS
            const res = await fetch(`https://api.mfapi.in/mf/${encodeURIComponent(symbol)}`);
            if (!res.ok) {
                console.log(`MF API failed for ${symbol}: ${res.status}`);
                return null;
            }
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
        } else if (type === 'US_STOCK') {
            const massiveData = await fetchMassiveQuote(symbol);
            if (massiveData) return massiveData;
            // Fallback: Yahoo Finance (near real-time, no API key) – US stocks only
            const yahooData = await fetchYahooQuote(symbol);
            if (yahooData) return yahooData;
            return null;
        } else {
            // STOCK or ETF - Use NSE API for Indian stocks (works for both NSE and BSE)
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
    } else if (result.searchType === 'US_STOCK') {
        // US stock: no exchange suffix, use Massive for price
        const symbolToSet = (result.symbol || '').toUpperCase().trim();
        const name = result.name || symbolToSet;
        const type = 'US_STOCK';
        const data = await verifySymbol(symbolToSet, type);

        return {
            symbol: symbolToSet,
            name,
            type,
            data
        };
    } else {
        // Indian Stock/ETF result - preserve exchange information
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
