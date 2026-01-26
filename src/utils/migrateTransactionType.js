/**
 * Migration utility to add 'type' field to existing transactions
 * This ensures backward compatibility when adding sell transaction support
 */

import { APP_ID } from '../constants/appConfig';

/**
 * Migrate portfolio data to include transaction type
 * Sets all existing transactions to 'BUY' type
 * @param {Array} portfolio - Portfolio array from localStorage
 * @returns {Array} Migrated portfolio with type field added
 */
export const migratePortfolioTransactionType = (portfolio) => {
  if (!Array.isArray(portfolio)) {
    return portfolio;
  }

  return portfolio.map(asset => {
    if (!asset.transactions || !Array.isArray(asset.transactions)) {
      return asset;
    }

    const migratedTransactions = asset.transactions.map(tx => {
      // If type already exists, keep it; otherwise default to 'BUY'
      if (tx.type && (tx.type === 'BUY' || tx.type === 'SELL')) {
        return tx;
      }
      return {
        ...tx,
        type: 'BUY'
      };
    });

    return {
      ...asset,
      transactions: migratedTransactions
    };
  });
};

/**
 * Run migration on localStorage data
 * Call this once on app initialization
 */
export const runTransactionTypeMigration = () => {
  try {
    const portfolioKey = `${APP_ID}_portfolio`;
    const portfolioData = localStorage.getItem(portfolioKey);

    if (!portfolioData) {
      return; // No data to migrate
    }

    const portfolio = JSON.parse(portfolioData);
    
    // Check if migration is needed
    const needsMigration = portfolio.some(asset => 
      asset.transactions && asset.transactions.some(tx => !tx.type)
    );

    if (!needsMigration) {
      return; // Already migrated
    }

    // Perform migration
    const migratedPortfolio = migratePortfolioTransactionType(portfolio);
    
    // Save migrated data
    localStorage.setItem(portfolioKey, JSON.stringify(migratedPortfolio));
    
    console.log('✅ Transaction type migration completed');
  } catch (error) {
    console.error('Error migrating transaction types:', error);
  }
};
