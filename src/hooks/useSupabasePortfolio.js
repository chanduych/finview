import { useState, useEffect, useMemo } from 'react';
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

  // Setup realtime subscriptions - use silent refresh to avoid full page reload
  useEffect(() => {
    if (!user) return;

    const portfoliosChannel = subscribeToPortfolios(user.id, (payload) => {
      console.log('Portfolio change detected:', payload);
      // Silent refresh - don't show loading spinner
      refreshData();
    });

    const transactionsChannel = subscribeToTransactions(user.id, (payload) => {
      console.log('Transaction change detected:', payload);
      // Silent refresh - don't show loading spinner
      refreshData();
    });

    return () => {
      unsubscribe(portfoliosChannel);
      unsubscribe(transactionsChannel);
    };
  }, [user]);

  /**
   * Load all data from Supabase (initial load - shows loading spinner)
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
   * Silent refresh - reload data without showing loading spinner
   * Used for realtime updates and after mutations
   */
  const refreshData = async () => {
    try {
      // Don't set loading = true to avoid full page refresh effect
      
      // Load accounts
      const { data: accountsData, error: accountsError } = await getAccounts();
      if (accountsError) throw accountsError;
      setAccounts(accountsData || []);

      // Load portfolios
      const { data: portfoliosData, error: portfoliosError } = await getPortfolios();
      if (portfoliosError) throw portfoliosError;
      setPortfolio(portfoliosData || []);
    } catch (err) {
      console.error('Error refreshing data:', err);
      // Don't set error state for silent refresh - just log it
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
      await refreshData();
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
      // If updating transactions, handle by diffing and syncing
      if (updates.transactions) {
        const existingAsset = portfolio.find(p => p.id === id);
        if (!existingAsset) {
          throw new Error('Asset not found');
        }

        const existingTxIds = new Set((existingAsset.transactions || []).map(tx => tx.id));
        const newTxIds = new Set((updates.transactions || []).map(tx => tx.id));

        // Find transactions to add (in updates but not in existing)
        const toAdd = updates.transactions.filter(tx => !existingTxIds.has(tx.id));
        
        // Find transactions to delete (in existing but not in updates)
        const toDelete = (existingAsset.transactions || []).filter(tx => !newTxIds.has(tx.id));
        
        // Find transactions to update (in both - compare values)
        const toUpdate = updates.transactions.filter(tx => {
          if (!existingTxIds.has(tx.id)) return false;
          const existingTx = existingAsset.transactions.find(t => t.id === tx.id);
          return existingTx && (
            existingTx.price !== tx.price ||
            existingTx.quantity !== tx.quantity ||
            existingTx.date !== tx.date
          );
        });

        // Execute operations
        for (const tx of toAdd) {
          await createTransaction(id, tx);
        }
        
        for (const tx of toDelete) {
          await deleteTransaction(tx.id);
        }
        
        for (const tx of toUpdate) {
          await updateTransaction(tx.id, {
            price: tx.price,
            quantity: tx.quantity,
            date: tx.date
          });
        }

        // Reload data
        await refreshData();
        return { error: null };
      }

      // If updating dividends, handle by diffing and syncing
      if (updates.dividends) {
        const existingAsset = portfolio.find(p => p.id === id);
        if (!existingAsset) {
          throw new Error('Asset not found');
        }

        const existingDivIds = new Set((existingAsset.dividends || []).map(d => d.id));
        const newDivIds = new Set((updates.dividends || []).map(d => d.id));

        // Find dividends to add
        const toAdd = updates.dividends.filter(d => !existingDivIds.has(d.id));
        
        // Find dividends to delete
        const toDelete = (existingAsset.dividends || []).filter(d => !newDivIds.has(d.id));

        // Execute operations
        for (const div of toAdd) {
          await createDividend(id, div);
        }
        
        for (const div of toDelete) {
          await deleteDividend(div.id);
        }

        // Reload data
        await refreshData();
        return { error: null };
      }

      // Update portfolio fields only
      const { error } = await updatePortfolio(id, {
        name: updates.name,
        sector: updates.sector
      });

      if (error) throw error;

      // Reload data
      await refreshData();
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
      await refreshData();
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
      await refreshData();
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
      await refreshData();
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
      await refreshData();
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
      await refreshData();
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
      await refreshData();
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
      await refreshData();
      return { error: null };
    } catch (err) {
      console.error('Error deleting dividend:', err);
      return { error: err };
    }
  };

  /**
   * Bulk import portfolio data (for import functionality)
   * This saves imported data to Supabase database
   * Handles duplicate detection to prevent redundant data
   */
  const bulkImportPortfolio = async (importedPortfolio, importedAccounts) => {
    try {
      setLoading(true);
      setError(null);

      let stats = {
        accountsCreated: 0,
        portfoliosCreated: 0,
        transactionsAdded: 0,
        transactionsSkipped: 0,
        dividendsAdded: 0,
        dividendsSkipped: 0
      };

      // 1. Create accounts first
      for (const accountName of importedAccounts) {
        // Check if account already exists
        const existingAccount = accounts.find(a => a.name === accountName);
        if (!existingAccount) {
          await createAccount(accountName);
          stats.accountsCreated++;
        }
      }

      // 2. Create portfolios with transactions
      for (const asset of importedPortfolio) {
        // Check if portfolio already exists
        const existing = portfolio.find(
          p => p.symbol === asset.symbol &&
               p.account === asset.account &&
               p.type === asset.type
        );

        if (existing) {
          // Add only non-duplicate transactions to existing portfolio
          for (const transaction of asset.transactions) {
            // Check if transaction already exists (by date, quantity, and price)
            const isDuplicate = existing.transactions?.some(existingTx => {
              const sameDate = new Date(existingTx.date).toISOString().split('T')[0] ===
                              new Date(transaction.date).toISOString().split('T')[0];
              const sameQuantity = Math.abs(existingTx.quantity - transaction.quantity) < 0.0001;
              const samePrice = Math.abs(existingTx.price - transaction.price) < 0.01;
              return sameDate && sameQuantity && samePrice;
            });

            if (!isDuplicate) {
              await createTransaction(existing.id, transaction);
              stats.transactionsAdded++;
            } else {
              stats.transactionsSkipped++;
            }
          }

          // Add only non-duplicate dividends if any
          if (asset.dividends && asset.dividends.length > 0) {
            for (const dividend of asset.dividends) {
              // Check if dividend already exists (by date and amount)
              const isDuplicate = existing.dividends?.some(existingDiv => {
                const sameDate = new Date(existingDiv.date).toISOString().split('T')[0] ===
                                new Date(dividend.date).toISOString().split('T')[0];
                const sameAmount = Math.abs(existingDiv.amount - dividend.amount) < 0.01;
                return sameDate && sameAmount;
              });

              if (!isDuplicate) {
                await createDividend(existing.id, dividend);
                stats.dividendsAdded++;
              } else {
                stats.dividendsSkipped++;
              }
            }
          }
        } else {
          // Create new portfolio
          const { data: newPortfolio, error: portfolioError } = await createPortfolio({
            symbol: asset.symbol,
            name: asset.name,
            type: asset.type,
            account: asset.account,
            sector: asset.sector || ''
          });

          if (portfolioError) throw portfolioError;
          stats.portfoliosCreated++;

          // Add transactions
          for (const transaction of asset.transactions) {
            await createTransaction(newPortfolio.id, transaction);
            stats.transactionsAdded++;
          }

          // Add dividends if any
          if (asset.dividends && asset.dividends.length > 0) {
            for (const dividend of asset.dividends) {
              await createDividend(newPortfolio.id, dividend);
              stats.dividendsAdded++;
            }
          }
        }
      }

      // 3. Reload all data
      await refreshData();

      // Log import stats
      console.log('📊 Import Stats:', stats);

      return { error: null, stats };
    } catch (err) {
      console.error('Error bulk importing:', err);
      setError(err.message);
      setLoading(false);
      return { error: err };
    }
  };

  // Memoize account names to prevent unnecessary re-renders
  const accountNames = useMemo(() => accounts.map(a => a.name), [accounts]);

  return {
    portfolio,
    setPortfolio,
    accounts: accountNames, // Memoized array of account names
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
    refreshData, // Silent refresh without loading spinner
    bulkImportPortfolio // For import functionality
  };
};
