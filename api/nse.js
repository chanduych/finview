/**
 * Vercel Serverless Function - NSE API Proxy
 *
 * This function proxies requests to NSE India API to avoid CORS issues.
 * Handles both:
 * - Legacy: /api/nse?symbol=RELIANCE → /api/quote-equity?symbol=RELIANCE
 * - Path-based: /api/nse/api/search/autocomplete?q=... → /api/search/autocomplete?q=...
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
    // Check if this is a path-based request
    // Try multiple methods to get the path
    let apiPath = null;
    
    // Method 1: Check Vercel's x-vercel-original-path header
    const originalPath = req.headers['x-vercel-original-path'] || req.headers['x-invoke-path'];
    if (originalPath && originalPath.startsWith('/api/nse/api/')) {
      apiPath = originalPath.replace('/api/nse/api/', '');
    }
    
    // Method 2: Try to get path from query parameter (Vercel rewrite with :path*)
    if (!apiPath && req.query.path) {
      const pathParam = Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path;
      // If path starts with 'api/', it's a path-based request
      if (pathParam.startsWith('api/')) {
        apiPath = pathParam.replace(/^api\//, '');
      } else if (pathParam.includes('/')) {
        // Path might be like 'api/search/autocomplete'
        const parts = pathParam.split('/');
        if (parts[0] === 'api') {
          apiPath = parts.slice(1).join('/');
        }
      }
    }
    
    // Method 3: Try parsing from req.url
    if (!apiPath && req.url) {
      try {
        // req.url might be just the path or full URL
        let pathname = req.url;
        if (req.url.includes('?')) {
          pathname = req.url.split('?')[0];
        }
        if (pathname.startsWith('/api/nse/api/')) {
          apiPath = pathname.replace('/api/nse/api/', '');
        } else if (pathname.startsWith('/api/nse/') && pathname !== '/api/nse') {
          // Handle case where rewrite passes path differently
          const remaining = pathname.replace('/api/nse/', '');
          if (remaining.startsWith('api/')) {
            apiPath = remaining.replace(/^api\//, '');
          }
        }
      } catch (e) {
        console.log('[NSE API] URL parsing error:', e.message);
      }
    }
    
    console.log('[NSE API] Detected path:', apiPath, 'Original URL:', req.url, 'Query:', req.query);
    
    // If we have a path-based request, handle it
    if (apiPath) {
      // Get all query parameters except 'path'
      const queryParams = new URLSearchParams();
      Object.keys(req.query).forEach(key => {
        if (key !== 'path') {
          const value = req.query[key];
          if (Array.isArray(value)) {
            value.forEach(v => queryParams.append(key, v));
          } else {
            queryParams.append(key, value);
          }
        }
      });
      
      const queryString = queryParams.toString();
      const nseUrl = `https://www.nseindia.com/api/${apiPath}${queryString ? `?${queryString}` : ''}`;

      console.log(`[NSE API] Proxying path-based request to: ${nseUrl}`);

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
      return res.status(200).json(data);
    }
    
    // Legacy: Handle /api/nse?symbol=RELIANCE
    const { symbol } = req.query;

    if (!symbol) {
      return res.status(400).json({ error: 'Symbol parameter is required for legacy endpoint' });
    }

    console.log(`[NSE API] Fetching data for symbol: ${symbol}`);

    // Fetch from NSE India API with proper headers
    const nseResponse = await fetch(
      `https://www.nseindia.com/api/quote-equity?symbol=${encodeURIComponent(symbol)}`,
      {
        headers: {
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Referer': 'https://www.nseindia.com/'
        }
      }
    );

    if (!nseResponse.ok) {
      console.error(`[NSE API] Error: ${nseResponse.status} ${nseResponse.statusText}`);
      return res.status(nseResponse.status).json({
        error: `NSE API returned status ${nseResponse.status}`
      });
    }

    const data = await nseResponse.json();

    console.log(`[NSE API] Success for ${symbol}`);

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
