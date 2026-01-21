/**
 * Vercel Serverless Function - NSE API Proxy (Catch-all)
 *
 * This function proxies all requests to NSE India API to avoid CORS issues
 * and work around the fact that Vercel doesn't support Vite dev proxy.
 *
 * Usage examples:
 * - /api/nse/api/search/autocomplete?q=RELIANCE
 *   Maps to: https://www.nseindia.com/api/search/autocomplete?q=RELIANCE
 * - /api/nse/api/quote-equity?symbol=RELIANCE
 *   Maps to: https://www.nseindia.com/api/quote-equity?symbol=RELIANCE
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
    // Get the path segments
    const path = req.query.path || [];
    const pathArray = Array.isArray(path) ? path : [path];
    
    // If the first segment is 'api', skip it (because request is /api/nse/api/...)
    // This matches the Vite proxy behavior which removes /api/nse prefix
    const cleanPath = pathArray[0] === 'api' ? pathArray.slice(1) : pathArray;
    const apiPath = cleanPath.join('/');
    
    // Get all query parameters except 'path'
    const queryParams = new URLSearchParams();
    Object.keys(req.query).forEach(key => {
      if (key !== 'path') {
        queryParams.append(key, req.query[key]);
      }
    });
    
    const queryString = queryParams.toString();
    const nseUrl = `https://www.nseindia.com/api/${apiPath}${queryString ? `?${queryString}` : ''}`;

    console.log(`[NSE API] Proxying request to: ${nseUrl}`);

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
      console.error(`[NSE API] Error: ${nseResponse.status} ${nseResponse.statusText}`);
      return res.status(nseResponse.status).json({
        error: `NSE API returned status ${nseResponse.status}`
      });
    }

    const data = await nseResponse.json();

    console.log(`[NSE API] Success for path: ${apiPath}`);

    // Return the data
    return res.status(200).json(data);

  } catch (error) {
    console.error('[NSE API] Error:', error.message);
    return res.status(500).json({
      error: 'Failed to fetch NSE data',
      message: error.message
    });
  }
}
