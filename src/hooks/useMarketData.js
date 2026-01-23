import { useState, useEffect, useRef } from 'react';
import { refreshPrices } from '../services/marketDataService';

/**
 * Custom hook for managing market data fetching
 * Features:
 * - Auto-refresh when portfolio finishes loading
 * - Auto-refresh every 15 minutes (24/7)
 * - Manual refresh via button
 *
 * @param {Array} portfolio - Portfolio array
 * @param {Function} setMarketPrices - Market prices setter
 * @param {boolean} loading - Loading state from portfolio hook
 * @returns {Object} Market data state and methods
 */
export const useMarketData = (portfolio, setMarketPrices, loading = false) => {
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

  // Effect 1: Auto-refresh when portfolio finishes loading
  useEffect(() => {
    // Only trigger when loading goes from true to false AND we have portfolio data
    if (!loading && portfolio.length > 0) {
      console.log('🚀 Portfolio finished loading - refreshing prices...', {
        portfolioLength: portfolio.length,
        loading,
        isRefreshing
      });

      // Small delay to ensure portfolio data is fully loaded
      const timeoutId = setTimeout(() => {
        refreshAllPrices();
      }, 100);

      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, portfolio.length]); // Trigger when loading completes and portfolio has data

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
