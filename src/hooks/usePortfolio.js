import { useState, useEffect, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { APP_ID } from '../constants/appConfig';

/**
 * Custom hook for managing portfolio state
 * @returns {Object} Portfolio state and methods
 */
export const usePortfolio = () => {
  const [portfolio, setPortfolio] = useLocalStorage(`${APP_ID}_portfolio`, []);
  const [accounts, setAccounts] = useLocalStorage(`${APP_ID}_accounts`, ['Primary Wallet', 'Brokerage']);
  const [marketPrices, setMarketPrices] = useLocalStorage(`${APP_ID}_market_prices`, {});
  const [selectedView, setSelectedView] = useLocalStorage(`${APP_ID}_selectedView`, 'ALL');
  const [expandedGroups, setExpandedGroups] = useLocalStorage(`${APP_ID}_expandedGroups`, ['STOCK', 'MF', 'ETF', 'CASH']);

  // Clean stale market prices (older than 5 minutes)
  useEffect(() => {
    const cleanStaleData = () => {
      const now = Date.now();
      const filtered = {};
      Object.keys(marketPrices).forEach(symbol => {
        if (marketPrices[symbol]?.timestamp && (now - marketPrices[symbol].timestamp) < 5 * 60 * 1000) {
          filtered[symbol] = marketPrices[symbol];
        }
      });
      if (Object.keys(filtered).length !== Object.keys(marketPrices).length) {
        setMarketPrices(filtered);
      }
    };

    cleanStaleData();
  }, []);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(`${APP_ID}_portfolio`, JSON.stringify(portfolio));
    localStorage.setItem(`${APP_ID}_accounts`, JSON.stringify(accounts));
    localStorage.setItem(`${APP_ID}_market_prices`, JSON.stringify(marketPrices));
  }, [portfolio, accounts, marketPrices]);

  const addAsset = (asset) => {
    setPortfolio(prev => [...prev, { ...asset, id: Date.now().toString() }]);
  };

  const updateAsset = (id, updates) => {
    setPortfolio(prev => prev.map(asset =>
      asset.id === id ? { ...asset, ...updates } : asset
    ));
  };

  const deleteAsset = (id) => {
    setPortfolio(prev => prev.filter(asset => asset.id !== id));
  };

  const addAccount = (accountName) => {
    setAccounts(prev => [...prev, accountName]);
  };

  const deleteAccount = (accountName) => {
    setAccounts(prev => prev.filter(acc => acc !== accountName));
    // Remove assets in deleted account
    setPortfolio(prev => prev.filter(asset => asset.account !== accountName));
  };

  return {
    portfolio,
    setPortfolio,
    accounts,
    setAccounts,
    marketPrices,
    setMarketPrices,
    selectedView,
    setSelectedView,
    expandedGroups,
    setExpandedGroups,
    addAsset,
    updateAsset,
    deleteAsset,
    addAccount,
    deleteAccount
  };
};
