/**
 * Vercel Serverless Function - NSE Autocomplete Search Proxy
 *
 * This function proxies autocomplete search requests to NSE India API.
 *
 * Usage: /api/nse/api/search/autocomplete?q=RELIANCE
 * Maps to: https://www.nseindia.com/api/search/autocomplete?q=RELIANCE
 */

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept');

  // Handle OPTIONS preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const nseUrl = `https://www.nseindia.com/api/search/autocomplete?q=${encodeURIComponent(q)}`;

    console.log(`[NSE Autocomplete] Searching for: ${q}`);
    console.log(`[NSE Autocomplete] Proxying to: ${nseUrl}`);

    // Fetch from NSE India API with proper headers
    const nseResponse = await fetch(nseUrl, {
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Referer': 'https://www.nseindia.com/'
      }
    });

    if (!nseResponse.ok) {
      console.error(`[NSE Autocomplete] Error: ${nseResponse.status} ${nseResponse.statusText}`);
      return res.status(nseResponse.status).json({
        error: `NSE API returned status ${nseResponse.status}`
      });
    }

    const data = await nseResponse.json();

    console.log(`[NSE Autocomplete] Success for query: ${q}`);

    // Return the data
    return res.status(200).json(data);

  } catch (error) {
    console.error('[NSE Autocomplete] Error:', error.message);
    return res.status(500).json({
      error: 'Failed to fetch NSE autocomplete data',
      message: error.message
    });
  }
}
