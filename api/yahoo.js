/**
 * Vercel Serverless Function - Yahoo Finance proxy for stock quotes.
 * Uses the v8 chart endpoint to avoid CORS when called from the browser.
 *
 * US symbols: returns { priceUSD, change, changePercent, name }
 * Indian symbols (.NS / .BO): returns { priceINR, change, changePercent, name }
 */

const YAHOO_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json',
};

const toYahooSymbol = (rawSymbol) => {
  const upper = rawSymbol.toUpperCase().trim();
  const bseMatch = upper.match(/^(.+)\.(BO|BSE)$/);
  const nseMatch = upper.match(/^(.+)\.(NS|NSE)$/);

  if (bseMatch) {
    return { yahooSymbol: `${bseMatch[1]}.BO`, isIndian: true };
  }
  if (nseMatch) {
    return { yahooSymbol: `${nseMatch[1]}.NS`, isIndian: true };
  }

  return { yahooSymbol: upper, isIndian: false };
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { symbol } = req.query;
  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'Symbol parameter is required' });
  }

  const { yahooSymbol, isIndian } = toYahooSymbol(symbol);
  if (!yahooSymbol) {
    return res.status(400).json({ error: 'Invalid symbol' });
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=1d&interval=1d`;
    const response = await fetch(url, { headers: YAHOO_HEADERS });

    if (!response.ok) {
      console.warn(`[Yahoo API] ${yahooSymbol} returned ${response.status}`);
      return res.status(response.status).json({ error: 'Yahoo Finance request failed' });
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];
    if (!result) {
      return res.status(404).json({ error: 'No data for symbol' });
    }

    const meta = result.meta || {};
    const price = meta.regularMarketPrice ?? meta.previousClose ?? null;
    const previousClose = meta.previousClose ?? meta.chartPreviousClose ?? price;

    if (price == null || price <= 0) {
      return res.status(404).json({ error: 'No price data' });
    }

    const change = previousClose != null ? price - previousClose : 0;
    const changePercent = previousClose != null && previousClose !== 0
      ? ((price - previousClose) / previousClose) * 100
      : 0;

    const base = {
      change,
      changePercent,
      name: meta.shortName || meta.longName || yahooSymbol,
      symbol: meta.symbol || yahooSymbol,
      currency: meta.currency || (isIndian ? 'INR' : 'USD'),
    };

    if (isIndian) {
      return res.status(200).json({
        ...base,
        priceINR: price,
        previousClose,
      });
    }

    return res.status(200).json({
      ...base,
      priceUSD: price,
      previousClose,
    });
  } catch (error) {
    console.error('[Yahoo API] Error:', error.message);
    return res.status(500).json({
      error: 'Failed to fetch quote',
      message: error.message,
    });
  }
}
