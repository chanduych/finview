import { useState, useEffect, useRef } from 'react';
import { refreshPrices } from '../services/marketDataService';

/**
 * Custom hook for managing market data fetching
 * Features:
 * - Auto-refresh on app load
 * - Auto-refresh every 15 minutes (24/7)
 * - Manual refresh via button
 *
 * @param {Array} portfolio - Portfolio array
 * @param {Function} setMarketPrices - Market prices setter
 * @returns {Object} Market data state and methods
 */
export const useMarketData = (portfolio, setMarketPrices) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const intervalRef = useRef(null);

  const refreshAllPrices = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      const updated = await refreshPrices(portfolio);
      setMarketPrices(updated);
      setLastRefreshTime(new Date());
      console.log('✅ Prices refreshed at', new Date().toLocaleTimeString('en-IN'));
    } catch (error) {
      console.error('❌ Error refreshing prices:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Effect 1: Auto-refresh on app load
  useEffect(() => {
    if (portfolio.length > 0) {
      console.log('🚀 App loaded - refreshing prices...');
      refreshAllPrices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Effect 2: Auto-refresh every 15 minutes (24/7)
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up interval to refresh every 15 minutes
    if (portfolio.length > 0) {
      intervalRef.current = setInterval(() => {
        console.log('⏰ 15 minutes elapsed - auto-refreshing prices...');
        refreshAllPrices();
      }, 15 * 60 * 1000); // 15 minutes in milliseconds
    }

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portfolio.length]);

  return {
    isRefreshing,
    refreshAllPrices,
    lastRefreshTime
  };
};
