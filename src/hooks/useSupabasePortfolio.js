import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getAccounts,
  createAccount,
  deleteAccount,
  getPortfolios,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  createDividend,
  deleteDividend,
  subscribeToPortfolios,
  subscribeToTransactions,
  unsubscribe
} from '../services/supabaseService';

/**
 * Custom hook for managing portfolio state with Supabase
 * @returns {Object} Portfolio state and methods
 */
export const useSupabasePortfolio = () => {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [marketPrices, setMarketPrices] = useState({});
  const [selectedView, setSelectedView] = useState('ALL');
  const [expandedGroups, setExpandedGroups] = useState(['STOCK', 'MF', 'ETF', 'CASH']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load initial data
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    loadData();
  }, [user]);

  // Setup realtime subscriptions
  useEffect(() => {
    if (!user) return;

    const portfoliosChannel = subscribeToPortfolios(user.id, (payload) => {
      console.log('Portfolio change detected:', payload);
      // Reload data when changes detected
      loadData();
    });

    const transactionsChannel = subscribeToTransactions(user.id, (payload) => {
      console.log('Transaction change detected:', payload);
      // Reload data when changes detected
      loadData();
    });

    return () => {
      unsubscribe(portfoliosChannel);
      unsubscribe(transactionsChannel);
    };
  }, [user]);

  /**
   * Load all data from Supabase
   */
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load accounts
      const { data: accountsData, error: accountsError } = await getAccounts();
      if (accountsError) throw accountsError;
      setAccounts(accountsData || []);

      // Load portfolios
      const { data: portfoliosData, error: portfoliosError } = await getPortfolios();
      if (portfoliosError) throw portfoliosError;
      setPortfolio(portfoliosData || []);

      setLoading(false);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  /**
   * Add a new asset to portfolio
   */
  const addAsset = async (assetData) => {
    try {
      // Check if portfolio already exists
      const existing = portfolio.find(
        p => p.symbol === assetData.symbol &&
             p.account === assetData.account &&
             p.type === assetData.type
      );

      if (existing) {
        // Add transaction to existing portfolio
        const transaction = assetData.transactions[0];
        const { error } = await createTransaction(existing.id, transaction);
        if (error) throw error;
      } else {
        // Create new portfolio
        const { data: newPortfolio, error: portfolioError } = await createPortfolio({
          symbol: assetData.symbol,
          name: assetData.name,
          type: assetData.type,
          account: assetData.account,
          sector: assetData.sector
        });

        if (portfolioError) throw portfolioError;

        // Add initial transaction
        if (assetData.transactions && assetData.transactions.length > 0) {
          const transaction = assetData.transactions[0];
          const { error: txError } = await createTransaction(newPortfolio.id, transaction);
          if (txError) throw txError;
        }
      }

      // Reload data
      await loadData();
      return { error: null };
    } catch (err) {
      console.error('Error adding asset:', err);
      return { error: err };
    }
  };

  /**
   * Update an asset
   */
  const updateAsset = async (id, updates) => {
    try {
      // If updating transactions, handle separately
      if (updates.transactions) {
        // This is complex - for now, we'll just reload
        // In a real implementation, you'd diff the transactions
        await loadData();
        return { error: null };
      }

      // Update portfolio fields
      const { error } = await updatePortfolio(id, {
        name: updates.name,
        sector: updates.sector
      });

      if (error) throw error;

      // Reload data
      await loadData();
      return { error: null };
    } catch (err) {
      console.error('Error updating asset:', err);
      return { error: err };
    }
  };

  /**
   * Delete an asset
   */
  const deleteAsset = async (id) => {
    try {
      const { error } = await deletePortfolio(id);
      if (error) throw error;

      // Reload data
      await loadData();
      return { error: null };
    } catch (err) {
      console.error('Error deleting asset:', err);
      return { error: err };
    }
  };

  /**
   * Add a new account
   */
  const addAccount = async (accountName) => {
    try {
      const { error } = await createAccount(accountName);
      if (error) throw error;

      // Reload accounts
      const { data: accountsData } = await getAccounts();
      setAccounts(accountsData || []);

      return { error: null };
    } catch (err) {
      console.error('Error adding account:', err);
      return { error: err };
    }
  };

  /**
   * Delete an account
   */
  const deleteAccountById = async (accountId) => {
    try {
      const { error } = await deleteAccount(accountId);
      if (error) throw error;

      // Reload data
      await loadData();
      return { error: null };
    } catch (err) {
      console.error('Error deleting account:', err);
      return { error: err };
    }
  };

  /**
   * Add transaction to existing asset
   */
  const addTransaction = async (portfolioId, transaction) => {
    try {
      const { error } = await createTransaction(portfolioId, transaction);
      if (error) throw error;

      // Reload data
      await loadData();
      return { error: null };
    } catch (err) {
      console.error('Error adding transaction:', err);
      return { error: err };
    }
  };

  /**
   * Update a transaction
   */
  const updateTransactionById = async (transactionId, updates) => {
    try {
      const { error } = await updateTransaction(transactionId, updates);
      if (error) throw error;

      // Reload data
      await loadData();
      return { error: null };
    } catch (err) {
      console.error('Error updating transaction:', err);
      return { error: err };
    }
  };

  /**
   * Delete a transaction
   */
  const deleteTransactionById = async (transactionId) => {
    try {
      const { error } = await deleteTransaction(transactionId);
      if (error) throw error;

      // Reload data
      await loadData();
      return { error: null };
    } catch (err) {
      console.error('Error deleting transaction:', err);
      return { error: err };
    }
  };

  /**
   * Add dividend to an asset
   */
  const addDividend = async (portfolioId, dividend) => {
    try {
      const { error } = await createDividend(portfolioId, dividend);
      if (error) throw error;

      // Reload data
      await loadData();
      return { error: null };
    } catch (err) {
      console.error('Error adding dividend:', err);
      return { error: err };
    }
  };

  /**
   * Delete a dividend
   */
  const deleteDividendById = async (dividendId) => {
    try {
      const { error } = await deleteDividend(dividendId);
      if (error) throw error;

      // Reload data
      await loadData();
      return { error: null };
    } catch (err) {
      console.error('Error deleting dividend:', err);
      return { error: err };
    }
  };

  return {
    portfolio,
    setPortfolio,
    accounts: accounts.map(a => a.name), // Convert to array of names for compatibility
    accountsData: accounts, // Full account objects with IDs
    setAccounts,
    marketPrices,
    setMarketPrices,
    selectedView,
    setSelectedView,
    expandedGroups,
    setExpandedGroups,
    loading,
    error,
    addAsset,
    updateAsset,
    deleteAsset,
    addAccount,
    deleteAccount: deleteAccountById,
    addTransaction,
    updateTransaction: updateTransactionById,
    deleteTransaction: deleteTransactionById,
    addDividend,
    deleteDividend: deleteDividendById,
    refreshData: loadData
  };
};
