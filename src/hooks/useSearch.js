import { useState, useEffect } from 'react';
import { POPULAR_STOCKS } from '../constants/stockData';

/**
 * Search stocks using Yahoo Finance API
 * Direct API call - Yahoo allows CORS for search endpoint
 */
const searchYahooFinance = async (query) => {
  try {
    // Direct Yahoo Finance search - simpler URL that works
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}`;

    console.log('🔍 Fetching from Yahoo:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      }
    });

    if (!response.ok) {
      console.warn('❌ Yahoo Finance returned:', response.status);
      return [];
    }

    const data = await response.json();
    console.log('🔍 Raw Yahoo data:', data);

    const quotes = data?.quotes || [];

    // Filter for Indian stocks (NSE/BSE) and format results
    const indianStocks = quotes
      .filter(q => {
        const exchange = q.exchange?.toUpperCase();
        const symbol = q.symbol || '';
        const isIndianStock = (
          exchange === 'NSI' ||
          exchange === 'NSE' ||
          exchange === 'BOM' ||
          exchange === 'BSE' ||
          symbol.includes('.NS') ||
          symbol.includes('.BO')
        );
        console.log(`Stock: ${symbol}, Exchange: ${exchange}, Indian: ${isIndianStock}`);
        return isIndianStock;
      })
      .map(q => ({
        symbol: q.symbol?.replace('.NS', '').replace('.BO', ''),
        name: q.longname || q.shortname || q.symbol,
        exchange: (q.exchange === 'BOM' || q.exchange === 'BSE' || q.symbol?.includes('.BO')) ? 'BSE' : 'NSE',
        searchType: 'STOCK'
      }));

    console.log('✅ Indian stocks found:', indianStocks.length);
    return indianStocks;

  } catch (error) {
    console.error('❌ Yahoo Finance search error:', error);
    return [];
  }
};

/**
 * Custom hook for asset search functionality
 * @param {string} selectedAssetType - Current asset type (STOCK, MF, ETF, CASH)
 * @returns {Object} Search state and methods
 */
export const useSearch = (selectedAssetType) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      const query = searchQuery.trim();
      console.log('🔍 Search triggered:', { query, selectedAssetType, queryLength: query.length });

      if (query.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      const upperQuery = query.toUpperCase();

      try {
        // For Mutual Funds (numeric or when type is MF)
        if (/^\d+$/.test(query) || selectedAssetType === 'MF') {
          console.log('🔍 Searching MF API for:', query);
          try {
            const url = `https://api.mfapi.in/mf/search?q=${encodeURIComponent(query)}`;
            console.log('🔍 Fetching from:', url);
            const response = await fetch(url);
            console.log('🔍 MF API response status:', response.status, response.ok);

            if (response.ok) {
              const data = await response.json();
              console.log('🔍 MF API data received:', data?.length, 'results');

              if (Array.isArray(data) && data.length > 0) {
                const results = data.slice(0, 5).map(scheme => ({
                  schemeCode: scheme.schemeCode,
                  schemeName: scheme.schemeName,
                  searchType: 'MF'
                }));
                console.log('✅ Setting MF results:', results);
                setSearchResults(results);
              } else {
                console.log('⚠️ No MF results found');
                setSearchResults([]);
              }
            } else {
              console.warn('❌ MF API returned non-OK status:', response.status);
              setSearchResults([]);
            }
          } catch (err) {
            console.error('❌ MF API search failed:', err);
            setSearchResults([]);
          }
        } else {
          // For stocks/ETFs: Search Yahoo Finance with fallback to local
          console.log('🔍 Searching Yahoo Finance for:', query);

          const yahooResults = await searchYahooFinance(query);
          console.log('🔍 Yahoo Finance results:', yahooResults.length);

          if (yahooResults.length > 0) {
            console.log('✅ Setting Yahoo Finance results:', yahooResults);
            setSearchResults(yahooResults.slice(0, 10));
          } else {
            // Fallback to local search if Yahoo fails
            console.log('🔍 Yahoo failed, trying local fallback');
            const localMatches = POPULAR_STOCKS.filter(stock =>
              stock.symbol.toUpperCase().includes(upperQuery) ||
              stock.name.toUpperCase().includes(upperQuery)
            ).slice(0, 5);

            if (localMatches.length > 0) {
              const results = localMatches.map(stock => ({
                symbol: stock.symbol,
                name: stock.name,
                exchange: 'NSE',
                searchType: 'STOCK'
              }));
              console.log('✅ Setting local fallback results:', results);
              setSearchResults(results);
            } else {
              console.log('⚠️ No matches anywhere, showing custom symbol option');
              setSearchResults([{
                symbol: upperQuery,
                name: `Custom Symbol: ${upperQuery}`,
                exchange: 'NSE',
                searchType: 'CUSTOM'
              }]);
            }
          }
        }
      } catch (error) {
        console.error('❌ Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
        console.log('🔍 Search completed, isSearching set to false');
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, selectedAssetType]);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    isSearching
  };
};
