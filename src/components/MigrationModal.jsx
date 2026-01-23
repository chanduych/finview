import React, { useState } from 'react';
import { Database, Upload, AlertCircle, CheckCircle, Loader2, X } from 'lucide-react';
import { bulkCreatePortfolios } from '../services/supabaseService';
import { createAccount } from '../services/supabaseService';
import { APP_ID } from '../constants/appConfig';

const MigrationModal = ({ isOpen, onClose, onComplete }) => {
  const [migrating, setMigrating] = useState(false);
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleMigrate = async () => {
    setMigrating(true);
    setError('');
    setStatus('Reading local data...');
    setProgress(10);

    try {
      // Read data from localStorage
      const portfolioData = localStorage.getItem(`${APP_ID}_portfolio`);
      const accountsData = localStorage.getItem(`${APP_ID}_accounts`);
      const marketPricesData = localStorage.getItem(`${APP_ID}_market_prices`);

      if (!portfolioData || !accountsData) {
        throw new Error('No data found in localStorage to migrate');
      }

      const portfolio = JSON.parse(portfolioData);
      const accounts = JSON.parse(accountsData);
      const marketPrices = JSON.parse(marketPricesData || '{}');

      setStatus(`Found ${portfolio.length} assets in ${accounts.length} accounts`);
      setProgress(20);

      // Create accounts first
      setStatus('Creating accounts...');
      for (const accountName of accounts) {
        await createAccount(accountName);
      }
      setProgress(40);

      // Migrate portfolios
      setStatus('Migrating portfolios...');
      const { data, error: migrationError } = await bulkCreatePortfolios(portfolio);

      if (migrationError) throw migrationError;

      setProgress(80);

      // Save market prices to localStorage (we'll keep using localStorage for this)
      // Or you could migrate to Supabase market_prices table
      setStatus('Finalizing migration...');
      setProgress(90);

      // Mark migration as complete
      localStorage.setItem(`${APP_ID}_migrated`, 'true');

      setProgress(100);
      setStatus('Migration complete!');
      setSuccess(true);

      // Wait a moment before completing
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 2000);

    } catch (err) {
      console.error('Migration error:', err);
      setError(err.message || 'Failed to migrate data');
      setMigrating(false);
    }
  };

  const handleSkip = () => {
    // Mark migration as skipped
    localStorage.setItem(`${APP_ID}_migration_skipped`, 'true');
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <Database className="w-6 h-6 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">
              Data Migration
            </h2>
          </div>
          {!migrating && !success && (
            <button
              onClick={handleSkip}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        {!success ? (
          <>
            {/* Info */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">We've detected local data</p>
                  <p>
                    Your portfolio data is currently stored in your browser.
                    Migrate it to Supabase for cloud backup and multi-device access.
                  </p>
                </div>
              </div>
            </div>

            {/* Status */}
            {status && (
              <div className="mb-4 text-center">
                <p className="text-sm text-slate-600">{status}</p>
                {progress > 0 && (
                  <div className="mt-2 w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleSkip}
                disabled={migrating}
                className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Skip for now
              </button>
              <button
                onClick={handleMigrate}
                disabled={migrating}
                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {migrating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Migrating...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Migrate Now
                  </>
                )}
              </button>
            </div>

            {/* Footer note */}
            <p className="mt-4 text-xs text-center text-slate-500">
              Your local data will remain in your browser after migration
            </p>
          </>
        ) : (
          <>
            {/* Success */}
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                Migration Complete!
              </h3>
              <p className="text-slate-600">
                Your data has been successfully migrated to Supabase.
                You can now access it from any device.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MigrationModal;
