import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  optimizeDeps: {
    include: ['xirr'],
  },
  server: {
    proxy: {
      // Proxy for NSE India API - Primary source for all stocks
      '/api/nse': {
        target: 'https://www.nseindia.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/nse/, ''),
        secure: false,
        headers: {
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      },
      // Proxy for Mutual Fund API
      '/api/mf': {
        target: 'https://api.mfapi.in',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/mf/, ''),
        secure: false,
      },
      // Proxy for Yahoo Finance (US stocks + Indian .NS/.BO fallback)
      '/api/yahoo': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => {
          try {
            const query = path.includes('?') ? path.slice(path.indexOf('?')) : '';
            const symbol = new URLSearchParams(query).get('symbol') || 'AAPL';
            return `/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`;
          } catch {
            return '/v8/finance/chart/AAPL?range=1d&interval=1d';
          }
        },
      },
    },
  },
})
