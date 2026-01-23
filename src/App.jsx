import React, { useState, useMemo, useEffect } from 'react';

// ============================================================================
// IMPORTS - Components
// ============================================================================
import Header from './components/Header';
import StatsCards from './components/StatsCards';
import PortfolioInsights from './components/PortfolioInsights';
import ChartSection from './components/ChartSection';
import FilterBar from './components/FilterBar';
import TableControlBar from './components/TableControlBar';
import HoldingsTable from './components/HoldingsTable';
import AddAssetModal from './components/AddAssetModal';
import SettingsModal from './components/SettingsModal';
import ReportsModal from './components/ReportsModal';
import ConfirmationModal from './components/ConfirmationModal';
import MobileLayout from './components/MobileLayout';
import MobilePortfolioView from './components/mobile/MobilePortfolioView';
import MobileInsightsView from './components/mobile/MobileInsightsView';
import MobileAnalyticsView from './components/mobile/MobileAnalyticsView';
import AuthPage from './components/Auth/AuthPage';
import MigrationModal from './components/MigrationModal';

// ============================================================================
// IMPORTS - Hooks
// ============================================================================
import { usePortfolio } from './hooks/usePortfolio';
import { useSupabasePortfolio } from './hooks/useSupabasePortfolio';
import { useMarketData } from './hooks/useMarketData';
import { useAuth } from './contexts/AuthContext';

// ============================================================================
// IMPORTS - Utils & Constants
// ============================================================================
import { formatCurrency, formatCurrencyWithDecimals } from './utils/formatters';
import { calculateXIRR, calculateCapitalGains } from './utils/calculations';
import { handleExport, handleImport, getYearWiseSummary } from './utils/importExport';
import { COLORS, APP_ID } from './constants/appConfig';
import { TAX_RATES, LTCG_EXEMPTION } from './constants/taxConfig';
import { TrendingUp, PieChart, AlertTriangle, TrendingDown, BarChart3, Loader2 } from 'lucide-react';
import xirr from 'xirr';

/**
 * App Component - Main Investment Tracker Application
 *
 * Refactored version using extracted components and hooks.
 * Manages portfolio state, market data, and UI interactions.
 */
const App = () => {
    // ========================================================================
    // AUTHENTICATION CHECK
    // ========================================================================
    const { user, loading: authLoading } = useAuth();
    const [showMigration, setShowMigration] = useState(false);

    // Check for Supabase environment variables
    const hasSupabaseConfig = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;

    // ========================================================================
    // STATE MANAGEMENT - Portfolio & Market Data
    // ========================================================================
    // Always call both hooks (can't conditionally call hooks)
    const localStorageData = usePortfolio();
    const supabaseData = useSupabasePortfolio();

    // Choose which data source to use based on config and auth
    const useSupabase = hasSupabaseConfig && user;
    const portfolioData = useSupabase ? supabaseData : localStorageData;

    // Destructure the chosen data
    const {
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
        deleteAccount,
        loading,
        error
    } = portfolioData;

    const { isRefreshing, refreshAllPrices } = useMarketData(portfolio, setMarketPrices);

    // ========================================================================
    // STATE MANAGEMENT - UI State
    // ========================================================================
    const [activeAccounts, setActiveAccounts] = useState(accounts);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showReportsModal, setShowReportsModal] = useState(false);
    const [tableFilter, setTableFilter] = useState('');
    const [expandedAsset, setExpandedAsset] = useState(null);

    // Mobile navigation state
    const [mobileView, setMobileView] = useState('portfolio');

    // AddAssetModal state
    const [selectedAccount, setSelectedAccount] = useState(accounts[0] || '');

    // Wallet management state
    const [isAddingWallet, setIsAddingWallet] = useState(false);
    const [newWalletName, setNewWalletName] = useState('');
    const [walletToDelete, setWalletToDelete] = useState(null);

    // Asset deletion state
    const [assetToDelete, setAssetToDelete] = useState(null);
    const [assetMenuOpen, setAssetMenuOpen] = useState(null);

    // Asset editing state
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [editingTransaction, setEditingTransaction] = useState(null);

    // P&L view toggle state ('total' or '1day')
    const [pnlView, setPnlView] = useState('total');

    // ========================================================================
    // COMPUTED VALUES - Portfolio Processing
    // ========================================================================

    /**
     * Process portfolio data with calculated values
     * Adds: avgPrice, currentPrice, currentValue, investedValue, absReturn, xirr, etc.
     */
    const processedPortfolio = useMemo(() => {
        return portfolio.map(asset => {
            const totalQty = asset.transactions.reduce((s, t) => s + t.quantity, 0);
            const totalCost = asset.transactions.reduce((s, t) => s + (t.quantity * t.price), 0);
            const totalDividends = (asset.dividends || []).reduce((s, d) => s + d.amount, 0);
            const avgPrice = totalQty > 0 ? totalCost / totalQty : 0;

            const marketData = marketPrices[asset.symbol];
            const currentPrice = marketData?.price || avgPrice;
            const currentValue = totalQty * currentPrice;
            const investedValue = totalCost;

            const absReturn = currentValue - investedValue;
            const absReturnPercent = investedValue > 0 ? (absReturn / investedValue) * 100 : 0;

            const dayChangePercent = marketData?.changePercent || 0;
            const dayChange = (dayChangePercent / 100) * currentValue;

            // Calculate XIRR - pass asset with calculated values
            const assetWithValues = {
                ...asset,
                totalQty,
                avgPrice,
                currentPrice,
                currentValue
            };
            const xirr = calculateXIRR(assetWithValues, marketPrices);

            // Calculate Capital Gains
            const capitalGains = calculateCapitalGains(assetWithValues, marketPrices);

            return {
                ...asset,
                totalQty,
                avgPrice,
                currentPrice,
                currentValue,
                investedValue,
                absReturn,
                absReturnPercent,
                dayChange,
                dayChangePercent,
                totalDividends,
                xirr,
                capitalGains
            };
        });
    }, [portfolio, marketPrices]);

    /**
     * Filter portfolio based on active accounts, selected view, and search
     */
    const filteredPortfolio = useMemo(() => {
        return processedPortfolio.filter(p => {
            const matchesAccount = activeAccounts.includes(p.account);
            const matchesType = selectedView === 'ALL' || p.type === selectedView;
            const matchesSearch = p.symbol.toLowerCase().includes(tableFilter.toLowerCase()) ||
                                (p.name && p.name.toLowerCase().includes(tableFilter.toLowerCase())) ||
                                p.account.toLowerCase().includes(tableFilter.toLowerCase());
            return matchesAccount && matchesType && matchesSearch;
        });
    }, [processedPortfolio, activeAccounts, selectedView, tableFilter]);

    /**
     * Group portfolio by asset type for "ALL" view
     */
    const groupedPortfolio = useMemo(() => {
        if (selectedView !== 'ALL') return {};
        const groups = {};
        filteredPortfolio.forEach(item => {
            if (!groups[item.type]) groups[item.type] = [];
            groups[item.type].push(item);
        });
        return groups;
    }, [filteredPortfolio, selectedView]);

    // ========================================================================
    // COMPUTED VALUES - Portfolio Statistics
    // ========================================================================

    /**
     * Calculate comprehensive portfolio statistics
     */
    const stats = useMemo(() => {
        const invested = filteredPortfolio.reduce((s, p) => s + p.investedValue, 0);
        const current = filteredPortfolio.reduce((s, p) => s + p.currentValue, 0);
        const dayChange = filteredPortfolio.reduce((s, p) => s + p.dayChange, 0);
        const absReturn = current - invested;
        const absReturnPct = invested > 0 ? (absReturn / invested) * 100 : 0;
        const dayChangePct = (current - dayChange) > 0 ? (dayChange / (current - dayChange)) * 100 : 0;
        const totalDividends = filteredPortfolio.reduce((s, p) => s + (p.totalDividends || 0), 0);
        const totalSTCG = filteredPortfolio.reduce((s, p) => s + (p.capitalGains?.stcg || 0), 0);
        const totalLTCG = filteredPortfolio.reduce((s, p) => s + (p.capitalGains?.ltcg || 0), 0);

        // Type allocation for pie chart - Use filteredPortfolio to respect wallet and asset type filters
        const typeAllocation = [
            { name: 'Equities', value: filteredPortfolio.filter(p => p.type === 'STOCK').reduce((s,p) => s+p.currentValue, 0) },
            { name: 'Mutual Funds', value: filteredPortfolio.filter(p => p.type === 'MF').reduce((s,p) => s+p.currentValue, 0) },
            { name: 'ETFs', value: filteredPortfolio.filter(p => p.type === 'ETF').reduce((s,p) => s+p.currentValue, 0) }
        ].filter(x => x.value > 0);

        // Wallet allocation
        const walletAllocation = activeAccounts.map(acc => ({
            name: acc,
            value: filteredPortfolio.filter(p => p.account === acc).reduce((s,p) => s+p.currentValue, 0)
        })).filter(x => x.value > 0);

        // Sector-wise exposure
        const sectorExposure = {};
        filteredPortfolio.filter(p => p.type === 'STOCK' && p.sector).forEach(p => {
            sectorExposure[p.sector] = (sectorExposure[p.sector] || 0) + p.currentValue;
        });

        // Top gainer/loser
        const topGainer = [...filteredPortfolio].sort((a,b) => b.absReturnPercent - a.absReturnPercent)[0];
        const topLoser = [...filteredPortfolio].sort((a,b) => a.absReturnPercent - b.absReturnPercent)[0];

        // Calculate Portfolio XIRR
        let portfolioXIRR = null;
        let oldestTransactionDate = null;

        if (portfolio.length > 0) {
            const allTransactions = [];
            portfolio.forEach(asset => {
                asset.transactions.forEach(tx => {
                    const date = new Date(tx.date);
                    if (!isNaN(date.getTime())) {
                        allTransactions.push({
                            amount: -(tx.quantity * tx.price),
                            when: date
                        });
                        if (!oldestTransactionDate || date < oldestTransactionDate) {
                            oldestTransactionDate = date;
                        }
                    }
                });
            });

            if (allTransactions.length > 0 && current > 0) {
                allTransactions.push({
                    amount: current,
                    when: new Date()
                });

                try {
                    // Use imported xirr function
                    const xirrFunc = typeof xirr === 'function' ? xirr : xirr.default || xirr.xirr;

                    if (typeof xirrFunc === 'function') {
                        const result = xirrFunc(allTransactions);
                        if (result !== null && !isNaN(result) && isFinite(result)) {
                            portfolioXIRR = result * 100;
                        }
                    }
                } catch (e) {
                    console.error('Portfolio XIRR calculation error:', e);
                }
            }
        }

        return {
            invested,
            current,
            dayChange,
            dayChangePct,
            absReturn,
            absReturnPct,
            totalDividends,
            totalSTCG,
            totalLTCG,
            typeAllocation,
            walletAllocation,
            sectorExposure,
            topGainer,
            topLoser,
            portfolioXIRR,
            oldestTransactionDate
        };
    }, [filteredPortfolio, processedPortfolio, activeAccounts, portfolio]);

    // ========================================================================
    // COMPUTED VALUES - Capital Deployment Chart Data
    // ========================================================================

    /**
     * Generate capital deployment data filtered by active accounts
     * This ensures the chart reflects the selected wallet filters
     */
    const capitalDeploymentData = useMemo(() => {
        const now = new Date();
        const monthsToShow = 120; // Generate all months (10 years max)
        const data = [];

        // Filter portfolio by active accounts and selected view
        const portfolioToUse = portfolio.filter(asset => {
            const matchesAccount = activeAccounts.includes(asset.account);
            const matchesType = selectedView === 'ALL' || asset.type === selectedView;
            return matchesAccount && matchesType;
        });

        for (let i = monthsToShow - 1; i >= 0; i--) {
            const targetMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = targetMonth.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });

            const monthlyInvestment = portfolioToUse.reduce((sum, asset) => {
                return sum + asset.transactions.reduce((s, tx) => {
                    const txDate = new Date(tx.date);
                    if (txDate.getFullYear() === targetMonth.getFullYear() &&
                        txDate.getMonth() === targetMonth.getMonth()) {
                        return s + (tx.quantity * tx.price);
                    }
                    return s;
                }, 0);
            }, 0);

            if (monthlyInvestment > 0 || data.length > 0) {
                data.push({
                    month: monthKey,
                    invested: monthlyInvestment
                });
            }
        }

        return data.length > 0 ? data : [{ month: 'No data', invested: 0 }];
    }, [portfolio, activeAccounts, selectedView]);

    // ========================================================================
    // COMPUTED VALUES - Portfolio Insights
    // ========================================================================

    /**
     * Generate insights array for PortfolioInsights component
     */
    const insights = useMemo(() => {
        const insightsArray = [];

        // Capital Deployment Insight
        const totalInvested = stats.invested;
        const monthlyData = capitalDeploymentData.map(d => ({
            month: d.month,
            amount: d.invested
        }));

        if (totalInvested > 0 && monthlyData.length > 0) {
            insightsArray.push({
                type: 'capital',
                title: 'Capital Deployment',
                description: `Total invested: ${formatCurrency(totalInvested)}`,
                value: formatCurrency(totalInvested),
                icon: BarChart3,
                color: 'indigo',
                data: { monthlyData }
            });
        }

        // Tax Intelligence Insight
        const stcg = stats.totalSTCG || 0;
        const ltcg = stats.totalLTCG || 0;
        const stcgTax = stcg * TAX_RATES.STCG;
        const ltcgAboveExemption = Math.max(0, ltcg - LTCG_EXEMPTION);
        const ltcgTax = ltcgAboveExemption * TAX_RATES.LTCG;
        const totalTax = stcgTax + ltcgTax;
        const exemptionLeft = Math.max(0, LTCG_EXEMPTION - ltcg);

        if (stcg > 0 || ltcg > 0) {
            insightsArray.push({
                type: 'tax',
                title: 'Tax Intelligence',
                description: 'Capital gains tax breakdown',
                value: formatCurrency(totalTax),
                icon: TrendingUp,
                color: 'emerald',
                data: {
                    stcg,
                    ltcg,
                    stcgTax,
                    ltcgTax,
                    totalTax,
                    exemptionLeft
                }
            });
        }

        // Concentration Risk Insight
        const totalPortfolioValue = stats.current;
        if (filteredPortfolio.length > 0 && totalPortfolioValue > 0) {
            const top5Holdings = [...filteredPortfolio]
                .sort((a, b) => b.currentValue - a.currentValue)
                .slice(0, 5)
                .map(p => ({
                    name: p.name || p.symbol,
                    value: p.currentValue,
                    percent: (p.currentValue / totalPortfolioValue) * 100
                }));

            const top5Percent = top5Holdings.reduce((sum, h) => sum + h.percent, 0);

            insightsArray.push({
                type: 'concentration',
                title: 'Concentration Risk',
                description: `Top 5 holdings: ${top5Percent.toFixed(1)}% of portfolio`,
                value: `${top5Percent.toFixed(1)}%`,
                icon: AlertTriangle,
                color: 'amber',
                data: { top5Holdings }
            });
        }

        // Win/Loss Ratio Insight
        const profitable = filteredPortfolio.filter(p => p.absReturn > 0);
        const unprofitable = filteredPortfolio.filter(p => p.absReturn < 0);
        const profitableValue = profitable.reduce((s, p) => s + p.absReturn, 0);
        const unprofitableValue = Math.abs(unprofitable.reduce((s, p) => s + p.absReturn, 0));
        const netGain = profitableValue - unprofitableValue;

        if (filteredPortfolio.length > 0) {
            insightsArray.push({
                type: 'winloss',
                title: 'Win/Loss Ratio',
                description: `${profitable.length} winners vs ${unprofitable.length} losers`,
                value: `${profitable.length}:${unprofitable.length}`,
                icon: TrendingDown,
                color: profitable.length >= unprofitable.length ? 'emerald' : 'rose',
                data: {
                    profitable: profitable.length,
                    unprofitable: unprofitable.length,
                    profitableValue,
                    unprofitableValue,
                    netGain
                }
            });
        }

        // Asset Allocation Insight - Use filteredPortfolio to respect wallet and asset type filters
        const filteredTotalValue = filteredPortfolio.reduce((s, p) => s + p.currentValue, 0);
        if (filteredTotalValue > 0) {
            const equity = filteredPortfolio.filter(p => p.type === 'STOCK').reduce((s, p) => s + p.currentValue, 0);
            const mf = filteredPortfolio.filter(p => p.type === 'MF').reduce((s, p) => s + p.currentValue, 0);
            const etf = filteredPortfolio.filter(p => p.type === 'ETF').reduce((s, p) => s + p.currentValue, 0);

            const equityPercent = (equity / filteredTotalValue) * 100;
            const mfPercent = (mf / filteredTotalValue) * 100;
            const etfPercent = (etf / filteredTotalValue) * 100;

            insightsArray.push({
                type: 'overweight',
                title: 'Asset Allocation',
                description: 'Portfolio distribution by asset type',
                value: `${Math.max(equityPercent, mfPercent, etfPercent).toFixed(1)}%`,
                icon: PieChart,
                color: 'indigo',
                data: {
                    equity: { value: equity, percent: equityPercent },
                    mf: { value: mf, percent: mfPercent },
                    etf: { value: etf, percent: etfPercent }
                }
            });
        }

        return insightsArray;
    }, [stats, capitalDeploymentData, filteredPortfolio, processedPortfolio]);

    // ========================================================================
    // EVENT HANDLERS - Asset Management
    // ========================================================================

    /**
     * Handle adding a new asset from AddAssetModal
     */
    const handleAddAsset = (assetData) => {
        const existingAsset = portfolio.find(
            p => p.symbol === assetData.symbol &&
                 p.account === assetData.account &&
                 p.type === assetData.type
        );

        if (existingAsset) {
            // Add transaction to existing asset
            const updatedAsset = {
                ...existingAsset,
                transactions: [...existingAsset.transactions, assetData.transaction]
            };
            updateAsset(existingAsset.id, updatedAsset);
        } else {
            // Create new asset
            addAsset({
                symbol: assetData.symbol,
                name: assetData.name,
                type: assetData.type,
                account: assetData.account,
                sector: assetData.sector || '',
                transactions: [assetData.transaction],
                dividends: []
            });
        }
    };

    /**
     * Handle deleting an asset
     */
    const handleDeleteAsset = () => {
        if (assetToDelete) {
            deleteAsset(assetToDelete.id);
            setAssetToDelete(null);
        }
    };

    /**
     * Handle updating an asset (e.g., editing sector, name)
     */
    const handleUpdateAsset = (id, updates) => {
        updateAsset(id, updates);
    };

    /**
     * Handle adding a transaction to an existing asset
     */
    const handleAddTransaction = (assetId, transaction) => {
        const asset = portfolio.find(p => p.id === assetId);
        if (asset) {
            updateAsset(assetId, {
                transactions: [...asset.transactions, transaction]
            });
        }
    };

    /**
     * Handle updating a transaction
     */
    const handleUpdateTransaction = (assetId, transactionId, updates) => {
        const asset = portfolio.find(p => p.id === assetId);
        if (asset) {
            const updatedTransactions = asset.transactions.map(tx =>
                tx.id === transactionId ? { ...tx, ...updates } : tx
            );
            updateAsset(assetId, { transactions: updatedTransactions });
        }
    };

    /**
     * Handle deleting a transaction
     */
    const handleDeleteTransaction = (assetId, transactionId) => {
        const asset = portfolio.find(p => p.id === assetId);
        if (asset) {
            const updatedTransactions = asset.transactions.filter(tx => tx.id !== transactionId);

            // If no transactions left, delete the asset
            if (updatedTransactions.length === 0) {
                deleteAsset(assetId);
            } else {
                updateAsset(assetId, { transactions: updatedTransactions });
            }
        }
    };

    /**
     * Handle adding a dividend to an asset
     */
    const handleAddDividend = (assetId, dividend) => {
        const asset = portfolio.find(p => p.id === assetId);
        if (asset) {
            updateAsset(assetId, {
                dividends: [...(asset.dividends || []), dividend]
            });
        }
    };

    /**
     * Handle deleting a dividend
     */
    const handleDeleteDividend = (assetId, dividendId) => {
        const asset = portfolio.find(p => p.id === assetId);
        if (asset) {
            const updatedDividends = (asset.dividends || []).filter(d => d.id !== dividendId);
            updateAsset(assetId, { dividends: updatedDividends });
        }
    };

    // ========================================================================
    // EVENT HANDLERS - Wallet Management
    // ========================================================================

    /**
     * Handle confirming wallet addition
     */
    const handleConfirmAddWallet = () => {
        const name = newWalletName.trim();
        if (name && !accounts.includes(name)) {
            addAccount(name);
            setActiveAccounts(prev => [...prev, name]);
            setNewWalletName('');
            setIsAddingWallet(false);
        }
    };

    /**
     * Handle deleting a wallet/account
     */
    const handleDeleteWallet = () => {
        if (walletToDelete) {
            deleteAccount(walletToDelete);
            setActiveAccounts(prev => prev.filter(acc => acc !== walletToDelete));
            setWalletToDelete(null);
        }
    };

    // ========================================================================
    // EVENT HANDLERS - Import/Export
    // ========================================================================

    /**
     * Handle exporting portfolio data
     */
    const handleExportWrapper = (format) => {
        handleExport(format, {
            portfolio,
            accounts,
            marketPrices,
            processedPortfolio
        });
    };

    /**
     * Handle importing portfolio data
     */
    const handleImportWrapper = (e) => {
        handleImport(e, {
            setPortfolio,
            setAccounts,
            setMarketPrices,
            setShowSettingsModal,
            accounts
        });
    };

    // ========================================================================
    // EVENT HANDLERS - UI Interactions
    // ========================================================================

    /**
     * Toggle asset type group expansion
     */
    const toggleGroupExpansion = (type) => {
        setExpandedGroups(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
    };

    /**
     * Handle quick add asset button click
     */
    const handleQuickAdd = () => {
        setShowAddModal(true);
    };

    // ========================================================================
    // MIGRATION CHECK
    // ========================================================================
    useEffect(() => {
        if (useSupabase && !authLoading) {
            const migrated = localStorage.getItem(`${APP_ID}_migrated`);
            const hasLocalData = localStorage.getItem(`${APP_ID}_portfolio`);

            if (!migrated && hasLocalData) {
                setShowMigration(true);
            }
        }
    }, [useSupabase, authLoading]);

    // ========================================================================
    // RENDER
    // ========================================================================

    // Show auth loading
    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
                    <p className="text-slate-600">Loading...</p>
                </div>
            </div>
        );
    }

    // Show auth page if Supabase is configured but user is not authenticated
    if (hasSupabaseConfig && !user) {
        return <AuthPage />;
    }

    // Show migration modal if needed
    if (showMigration) {
        return (
            <MigrationModal
                isOpen={showMigration}
                onClose={() => setShowMigration(false)}
                onComplete={() => {
                    setShowMigration(false);
                    window.location.reload();
                }}
            />
        );
    }

    // Show loading for portfolio data
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
                    <p className="text-slate-600">Loading your portfolio...</p>
                </div>
            </div>
        );
    }

    // Show error if portfolio data failed to load
    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="text-center max-w-md p-6 bg-white rounded-xl shadow-lg">
                    <div className="text-red-600 mb-4">
                        <AlertTriangle className="w-12 h-12 mx-auto" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Error Loading Portfolio</h2>
                    <p className="text-slate-600 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Render mobile view content
    const renderMobileView = () => {
        switch (mobileView) {
            case 'insights':
                return <MobileInsightsView 
                    insights={insights}
                    accounts={accounts}
                    activeAccounts={activeAccounts}
                    setActiveAccounts={setActiveAccounts}
                    selectedView={selectedView}
                    setSelectedView={setSelectedView}
                />;
            case 'analytics':
                return <MobileAnalyticsView 
                    stats={stats}
                    accounts={accounts}
                    activeAccounts={activeAccounts}
                    setActiveAccounts={setActiveAccounts}
                    selectedView={selectedView}
                    setSelectedView={setSelectedView}
                />;
            case 'portfolio':
            default:
                return (
                    <MobilePortfolioView
                        stats={stats}
                        filteredPortfolio={filteredPortfolio}
                        groupedPortfolio={groupedPortfolio}
                        selectedView={selectedView}
                        setSelectedView={setSelectedView}
                        onRefresh={refreshAllPrices}
                        isRefreshing={isRefreshing}
                        tableFilter={tableFilter}
                        setTableFilter={setTableFilter}
                        expandedGroups={expandedGroups}
                        toggleGroupExpansion={toggleGroupExpansion}
                        pnlView={pnlView}
                        setPnlView={setPnlView}
                        onUpdateAsset={handleUpdateAsset}
                        onDeleteAsset={(asset) => setAssetToDelete(asset)}
                        onAddTransaction={handleAddTransaction}
                        onUpdateTransaction={handleUpdateTransaction}
                        onDeleteTransaction={handleDeleteTransaction}
                        onAddDividend={handleAddDividend}
                        onDeleteDividend={handleDeleteDividend}
                        formatCurrency={formatCurrency}
                        onQuickAdd={handleQuickAdd}
                        accounts={accounts}
                        activeAccounts={activeAccounts}
                        setActiveAccounts={setActiveAccounts}
                    />
                );
        }
    };

    return (
        <>
            {/* Mobile Layout - Single Page App with Bottom Nav */}
            <MobileLayout
                currentView={mobileView}
                onViewChange={setMobileView}
                onQuickAdd={handleQuickAdd}
                onOpenSettings={() => setShowSettingsModal(true)}
                stats={stats}
            >
                {renderMobileView()}
            </MobileLayout>

            {/* Desktop Layout - Traditional Multi-Section Layout */}
            <div className="hidden md:block min-h-screen bg-slate-50">
                {/* Header */}
                <Header
                    onRefresh={refreshAllPrices}
                    isRefreshing={isRefreshing}
                    onOpenSettings={() => setShowSettingsModal(true)}
                    onOpenReports={() => setShowReportsModal(true)}
                    onOpenAddAsset={() => setShowAddModal(true)}
                />

                {/* Main Content */}
                <div className="container mx-auto px-4 md:px-6 py-6 space-y-6 max-w-7xl">
                {/* Stats Cards */}
                <StatsCards
                    stats={stats}
                    accounts={accounts}
                    onQuickAdd={handleQuickAdd}
                />

                {/* Portfolio Insights */}
                <PortfolioInsights
                    insights={insights}
                />

                {/* Charts Section */}
                <ChartSection
                    stats={stats}
                />

                {/* Filter Bar */}
                <FilterBar
                    selectedView={selectedView}
                    setSelectedView={setSelectedView}
                    accounts={accounts}
                    activeAccounts={activeAccounts}
                    setActiveAccounts={setActiveAccounts}
                />

                {/* Table Control Bar */}
                <TableControlBar
                    tableFilter={tableFilter}
                    setTableFilter={setTableFilter}
                    filteredPortfolio={filteredPortfolio}
                    processedPortfolio={processedPortfolio}
                    selectedView={selectedView}
                    setSelectedView={setSelectedView}
                    activeAccounts={activeAccounts}
                    setShowAddModal={setShowAddModal}
                    onExport={handleExportWrapper}
                />

                {/* Holdings Table */}
                <HoldingsTable
                    selectedView={selectedView}
                    filteredPortfolio={filteredPortfolio}
                    groupedPortfolio={groupedPortfolio}
                    expandedGroups={expandedGroups}
                    toggleGroupExpansion={toggleGroupExpansion}
                    expandedAsset={expandedAsset}
                    setExpandedAsset={setExpandedAsset}
                    marketPrices={marketPrices}
                    setMarketPrices={setMarketPrices}
                    assetMenuOpen={assetMenuOpen}
                    setAssetMenuOpen={setAssetMenuOpen}
                    editingId={editingId}
                    setEditingId={setEditingId}
                    editValue={editValue}
                    setEditValue={setEditValue}
                    editingTransaction={editingTransaction}
                    setEditingTransaction={setEditingTransaction}
                    pnlView={pnlView}
                    setPnlView={setPnlView}
                    onUpdateAsset={handleUpdateAsset}
                    onDeleteAsset={(asset) => setAssetToDelete(asset)}
                    onAddTransaction={handleAddTransaction}
                    onUpdateTransaction={handleUpdateTransaction}
                    onDeleteTransaction={handleDeleteTransaction}
                    onAddDividend={handleAddDividend}
                    onDeleteDividend={handleDeleteDividend}
                    formatCurrency={formatCurrency}
                    formatCurrencyWithDecimals={formatCurrencyWithDecimals}
                    portfolio={portfolio}
                    setPortfolio={setPortfolio}
                />
                </div>
            </div>

            {/* Modals - Shared between Mobile and Desktop */}

            {/* Add Asset Modal */}
            <AddAssetModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAdd={handleAddAsset}
                accounts={accounts}
                selectedAccount={selectedAccount}
                setSelectedAccount={setSelectedAccount}
            />

            {/* Settings Modal */}
            <SettingsModal
                isOpen={showSettingsModal}
                onClose={() => setShowSettingsModal(false)}
                accounts={accounts}
                isAddingWallet={isAddingWallet}
                setIsAddingWallet={setIsAddingWallet}
                newWalletName={newWalletName}
                setNewWalletName={setNewWalletName}
                onConfirmAddWallet={handleConfirmAddWallet}
                onDeleteWallet={(wallet) => setWalletToDelete(wallet)}
                onImport={handleImportWrapper}
                onExport={handleExportWrapper}
                onOpenReports={() => setShowReportsModal(true)}
                portfolio={portfolio}
                setPortfolio={setPortfolio}
            />

            {/* Reports Modal */}
            <ReportsModal
                isOpen={showReportsModal}
                onClose={() => setShowReportsModal(false)}
                portfolio={portfolio}
                processedPortfolio={processedPortfolio}
                stats={stats}
                getYearWiseSummary={getYearWiseSummary}
                formatCurrency={formatCurrency}
                formatCurrencyWithDecimals={formatCurrencyWithDecimals}
            />

            {/* Confirmation Modal - Delete Wallet */}
            {walletToDelete && (
                <ConfirmationModal
                    isOpen={!!walletToDelete}
                    onClose={() => setWalletToDelete(null)}
                    onConfirm={handleDeleteWallet}
                    title="Delete Wallet"
                    message={`Are you sure you want to delete "${walletToDelete}"? All assets in this wallet will be deleted.`}
                    confirmText="Delete"
                    confirmStyle="danger"
                />
            )}

            {/* Confirmation Modal - Delete Asset */}
            {assetToDelete && (
                <ConfirmationModal
                    isOpen={!!assetToDelete}
                    onClose={() => setAssetToDelete(null)}
                    onConfirm={handleDeleteAsset}
                    title="Delete Asset"
                    message={`Are you sure you want to delete ${assetToDelete.symbol}? This will remove all transactions and data for this asset.`}
                    confirmText="Delete"
                    confirmStyle="danger"
                />
            )}
        </>
    );
};

export default App;
