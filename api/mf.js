/**
 * Vercel Serverless Function - Mutual Fund API Proxy
 *
 * This function proxies requests to MFAPI.in to avoid CORS issues
 * and work around the fact that Vercel doesn't support Vite dev proxy.
 *
 * Usage: /api/mf?schemeCode=119551
 * Maps to: https://api.mfapi.in/mf/119551
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
    const { schemeCode } = req.query;

    if (!schemeCode) {
      return res.status(400).json({ error: 'schemeCode parameter is required' });
    }

    console.log(`[MF API] Fetching data for scheme: ${schemeCode}`);

    // Fetch from MFAPI.in
    const mfResponse = await fetch(
      `https://api.mfapi.in/mf/${encodeURIComponent(schemeCode)}`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );

    if (!mfResponse.ok) {
      console.error(`[MF API] Error: ${mfResponse.status} ${mfResponse.statusText}`);
      return res.status(mfResponse.status).json({
        error: `MF API returned status ${mfResponse.status}`
      });
    }

    const data = await mfResponse.json();

    console.log(`[MF API] Success for scheme ${schemeCode}`);

    // Return the data
    return res.status(200).json(data);

  } catch (error) {
    console.error('[MF API] Error:', error.message);
    return res.status(500).json({
      error: 'Failed to fetch Mutual Fund data',
      message: error.message
    });
  }
}
