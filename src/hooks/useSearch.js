import { useState, useEffect } from 'react';
import { POPULAR_STOCKS } from '../constants/stockData';

/**
 * Search stocks using NSE autocomplete API via Vite proxy
 */
const searchNSEStocks = async (query) => {
  try {
    console.log('🔍 Searching NSE for:', query);

    // Use Vite proxy for NSE autocomplete
    const response = await fetch(`/api/nse/api/search/autocomplete?q=${encodeURIComponent(query)}`);

    if (!response.ok) {
      console.warn('❌ NSE search returned:', response.status);
      return [];
    }

    const data = await response.json();
    console.log('🔍 NSE search data:', data);

    // NSE returns symbols array with symbol and symbol_info
    const symbols = data?.symbols || [];

    const results = symbols
      .filter(s => s.symbol && s.result_sub_type === 'equity') // Filter only equity stocks
      .slice(0, 10) // Limit to top 10 results
      .map(s => ({
        symbol: s.symbol,
        name: s.symbol_info || s.symbol,
        exchange: 'NSE',
        searchType: 'STOCK' // Ensure it's marked as STOCK, not CUSTOM
      }));

    console.log('✅ NSE stocks found:', results.length, results);
    return results;

  } catch (error) {
    console.error('❌ NSE search error:', error);
    return [];
  }
};

/**
 * Custom hook for asset search functionality
 * @param {string} selectedAssetType - Current asset type (STOCK, MF, ETF, CASH)
 * @param {boolean} isSelecting - Flag to prevent search during result selection
 * @returns {Object} Search state and methods
 */
export const useSearch = (selectedAssetType, isSelecting = false) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      const query = searchQuery.trim();
      console.log('🔍 Search triggered:', { query, selectedAssetType, queryLength: query.length, isSelecting });

      // Don't search if we're in the middle of selecting a result
      if (isSelecting) {
        console.log('⏸️ Search blocked: selection in progress');
        return;
      }

      if (query.length < 2) {
        setSearchResults([]);
        return;
      }

      // Don't search if query has exchange suffix (means it's already selected)
      if (query.match(/\.(NS|NSE|BO|BSE)$/i)) {
        console.log('⏸️ Search blocked: query has exchange suffix (already selected)');
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
            const response = await fetch(`/api/mf/mf/search?q=${encodeURIComponent(query)}`);
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
          // For stocks/ETFs: Search NSE API with fallback to local
          console.log('🔍 Searching NSE API for:', query);

          const nseResults = await searchNSEStocks(query);
          console.log('🔍 NSE search results:', nseResults.length);

          if (nseResults.length > 0) {
            console.log('✅ Setting NSE search results:', nseResults);
            setSearchResults(nseResults);
          } else {
            // Fallback to local search if NSE fails
            console.log('🔍 NSE failed, trying local fallback');
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
              console.log('⚠️ No matches anywhere, allowing direct symbol entry');
              setSearchResults([{
                symbol: upperQuery,
                name: upperQuery,
                exchange: 'NSE',
                searchType: 'STOCK' // Changed from CUSTOM to STOCK
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
  }, [searchQuery, selectedAssetType, isSelecting]);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    isSearching
  };
};
