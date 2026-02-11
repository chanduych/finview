import React, { useState, useMemo, useEffect, useRef } from 'react';

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
// import MigrationModal from './components/MigrationModal'; // Disabled - uncomment if needed

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
import { calculateFIFORealizedGains, calculateRealizedCapitalGains, calculateUnrealizedCapitalGains } from './utils/fifoCalculations';
import { handleExport, handleImport, getYearWiseSummary } from './utils/importExport';
import { runTransactionTypeMigration } from './utils/migrateTransactionType';
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
    // const [showMigration, setShowMigration] = useState(false); // Migration disabled

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

    // Run migration for localStorage data (one-time migration)
    useEffect(() => {
        if (!useSupabase) {
            // Only run migration for localStorage users
            runTransactionTypeMigration();
        }
    }, [useSupabase]); // Run once when data source is determined

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
        bulkImportPortfolio, // For import functionality
        loading,
        error
    } = portfolioData;
    
    // Get accountsData for Supabase (contains full account objects with IDs)
    const accountsData = useSupabase ? supabaseData.accountsData : null;

    // Debug: Log data source info (only in development)
    useEffect(() => {
        console.log('📊 Data Source Info:', {
            hasSupabaseConfig,
            userEmail: user?.email || 'Not logged in',
            useSupabase,
            dataSource: useSupabase ? 'Supabase (Database)' : 'LocalStorage',
            portfolioCount: portfolio.length,
            accountsCount: accounts.length
        });
    }, [useSupabase, user, portfolio.length, accounts.length]);

    const { isRefreshing, refreshAllPrices } = useMarketData(portfolio, setMarketPrices, loading);

    // ========================================================================
    // STATE MANAGEMENT - UI State
    // ========================================================================
    const [activeAccounts, setActiveAccounts] = useState(accounts);
    const [activeAssetTypes, setActiveAssetTypes] = useState(['STOCK', 'MF', 'ETF']);
    const [showFullySoldAssets, setShowFullySoldAssets] = useState(false); // Phase 5: Toggle for fully sold assets
    const [showAddModal, setShowAddModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showReportsModal, setShowReportsModal] = useState(false);
    const [tableFilter, setTableFilter] = useState('');
    const [expandedAsset, setExpandedAsset] = useState(null);

    // Track if accounts have been initially loaded
    const accountsInitialized = useRef(false);
    
    // Sync activeAccounts with accounts ONLY on initial load or when new accounts are added
    useEffect(() => {
        if (accounts.length > 0) {
            setActiveAccounts(prev => {
                // First load - set to all accounts
                if (!accountsInitialized.current) {
                    accountsInitialized.current = true;
                    return [...accounts];
                }
                // If user has no active accounts, reset to all
                if (prev.length === 0) {
                    return [...accounts];
                }
                // Only add new accounts that don't exist yet (don't remove filtered ones)
                const newAccounts = accounts.filter(acc => !prev.includes(acc));
                if (newAccounts.length > 0) {
                    return [...prev, ...newAccounts];
                }
                // Remove any accounts that no longer exist
                const validAccounts = prev.filter(acc => accounts.includes(acc));
                if (validAccounts.length !== prev.length) {
                    return validAccounts.length > 0 ? validAccounts : [...accounts];
                }
                return prev;
            });
        }
    }, [accounts]);

    // Mobile navigation state
    const [mobileView, setMobileView] = useState('portfolio');

    // AddAssetModal state
    const [selectedAccount, setSelectedAccount] = useState(accounts[0] || '');

    // Sync selectedAccount when accounts load (e.g. new user gets default account) or selected is no longer valid
    useEffect(() => {
        if (accounts.length > 0 && (!selectedAccount || !accounts.includes(selectedAccount))) {
            setSelectedAccount(accounts[0]);
        }
    }, [accounts, selectedAccount]);

    // Wallet management state
    const [isAddingWallet, setIsAddingWallet] = useState(false);
    const [newWalletName, setNewWalletName] = useState('');
    const [walletToDelete, setWalletToDelete] = useState(null);
    const [isDeletingWallet, setIsDeletingWallet] = useState(false);

    // Asset deletion state
    const [assetToDelete, setAssetToDelete] = useState(null);
    const [isDeletingAsset, setIsDeletingAsset] = useState(false);
    const [assetMenuOpen, setAssetMenuOpen] = useState(null);

    // Asset editing state
    const [editingTransaction, setEditingTransaction] = useState(null);

    // P&L view toggle state ('total' or '1day')
    const [pnlView, setPnlView] = useState('total');

    // ========================================================================
    // COMPUTED VALUES - Portfolio Processing
    // ========================================================================

    /**
     * Process portfolio data with calculated values
     * Adds: avgPrice, currentPrice, currentValue, investedValue, absReturn, xirr, etc.
     * Now handles BUY/SELL transactions separately using FIFO
     */
    const processedPortfolio = useMemo(() => {
        return portfolio.map(asset => {
            // Separate BUY and SELL transactions
            const buyTransactions = asset.transactions.filter(tx => (tx.type || 'BUY') === 'BUY');
            const sellTransactions = asset.transactions.filter(tx => (tx.type || 'BUY') === 'SELL');

            // Calculate holdings: Buy quantity - Sell quantity
            const buyQty = buyTransactions.reduce((s, t) => s + t.quantity, 0);
            const sellQty = sellTransactions.reduce((s, t) => s + t.quantity, 0);
            const totalQty = buyQty - sellQty; // Current holdings

            // Total invested from BUY transactions
            const totalBuyAmount = buyTransactions.reduce((s, t) => s + (t.quantity * t.price), 0);
            
            // Get market price first (needed for FIFO calculation)
            const marketData = marketPrices[asset.symbol];
            const tempAvgPrice = buyQty > 0 ? totalBuyAmount / buyQty : 0;
            const tempCurrentPrice = marketData?.price || tempAvgPrice;
            
            // Calculate realized gains using FIFO (this also gives us cost basis of sold shares)
            const fifoResult = calculateFIFORealizedGains(asset.transactions, tempCurrentPrice);
            const realizedGains = fifoResult.totalRealizedGain;
            const realizedGainsPerTransaction = fifoResult.perTransaction;
            
            // Calculate cost basis of sold shares (from FIFO matched lots)
            const costBasisOfSoldShares = realizedGainsPerTransaction.reduce((sum, txGain) => {
                return sum + txGain.matchedLots.reduce((lotSum, lot) => {
                    return lotSum + (lot.quantity * lot.buyPrice);
                }, 0);
            }, 0);
            
            // Total realized (proceeds from SELL transactions) - for display only
            const totalRealized = sellTransactions.reduce((s, t) => s + (t.quantity * t.price), 0);
            
            // ✅ GOLDEN RULE: Invested = cost of UN-SOLD buy lots only
            // Use the remaining buy lots from FIFO to calculate cost of current holdings
            const remainingBuyLots = fifoResult.buyQueue;
            const currentHoldingsCost = remainingBuyLots.reduce((sum, lot) => sum + (lot.remainingQty * lot.price), 0);
            
            // ✅ MUST-FIX: Clamp negative holdings to zero (fully sold assets)
            const isFullySold = totalQty <= 0;
            const clampedQty = Math.max(0, totalQty);
            
            // For fully sold assets: Invested = 0, Market Value = 0, Unrealized = 0
            const invested = isFullySold ? 0 : currentHoldingsCost; // Cost of capital still deployed (open positions only)
            
            // Average buy price for CURRENT HOLDINGS ONLY
            const avgPrice = clampedQty > 0 ? currentHoldingsCost / clampedQty : 0;

            // ✅ GOLDEN RULE: Current value = remaining_qty × current_LTP
            const currentPrice = marketData?.price || avgPrice;
            // ✅ MUST-FIX: Clamp market value to zero for fully sold assets
            const currentValue = isFullySold ? 0 : (clampedQty * currentPrice); // Current holdings value only

            // ✅ GOLDEN RULE: Unrealized P&L = current_value - invested
            // ✅ MUST-FIX: Unrealized = 0 for fully sold assets
            const unrealizedGains = isFullySold ? 0 : (currentValue - invested);

            // ✅ MUST-FIX: Total P&L = Realized only for fully sold assets
            // For open positions: Total P&L = Realized + Unrealized
            const totalPnL = isFullySold ? realizedGains : (realizedGains + unrealizedGains);

            // Calculate capital gains (realized and unrealized separately)
            const realizedCapitalGains = calculateRealizedCapitalGains(asset.transactions);
            const unrealizedCapitalGains = calculateUnrealizedCapitalGains(
                fifoResult.buyQueue,
                currentPrice
            );

            // Combined capital gains for backward compatibility
            const capitalGains = {
                stcg: Math.max(0, realizedCapitalGains.realizedStcg + unrealizedCapitalGains.unrealizedStcg),
                ltcg: Math.max(0, realizedCapitalGains.realizedLtcg + unrealizedCapitalGains.unrealizedLtcg),
                // New: Separate realized and unrealized
                realized: {
                    stcg: realizedCapitalGains.realizedStcg,
                    ltcg: realizedCapitalGains.realizedLtcg
                },
                unrealized: {
                    stcg: unrealizedCapitalGains.unrealizedStcg,
                    ltcg: unrealizedCapitalGains.unrealizedLtcg
                }
            };

            const totalDividends = (asset.dividends || []).reduce((s, d) => s + d.amount, 0);

            const absReturn = totalPnL; // Total P&L (realized + unrealized)
            // Return percentage based on invested (current holdings cost basis)
            const absReturnPercent = invested > 0 ? (absReturn / invested) * 100 : 0;

            const dayChangePercent = marketData?.changePercent || 0;
            const dayChange = (dayChangePercent / 100) * currentValue;

            // ✅ GOLDEN RULE: Asset XIRR - Valid only if asset has remaining quantity
            // If fully sold: Freeze XIRR or hide it
            let xirr = null;
            if (totalQty > 0) {
                // Calculate XIRR only for assets with remaining quantity
                const assetWithValues = {
                    ...asset,
                    totalQty,
                    avgPrice,
                    currentPrice,
                    currentValue,
                    realizedGains,
                    unrealizedGains
                };
                xirr = calculateXIRR(assetWithValues, marketPrices);
            }
            // If totalQty === 0, xirr remains null (asset is fully exited)

            return {
                ...asset,
                totalQty: clampedQty, // ✅ Clamped to zero for fully sold
                avgPrice,
                currentPrice,
                currentValue, // ✅ Clamped to zero for fully sold
                investedValue: invested, // ✅ Cost of UN-SOLD buy lots only (open positions), 0 for fully sold
                totalRealized, // Total realized from sells (exit proceeds)
                realizedGains, // Realized P&L (FIFO)
                unrealizedGains, // ✅ Unrealized P&L (0 for fully sold)
                totalPnL, // ✅ Total P&L (Realized only for fully sold)
                absReturn: totalPnL, // Same as totalPnL
                absReturnPercent,
                dayChange: isFullySold ? 0 : dayChange, // ✅ No day change for fully sold
                dayChangePercent: isFullySold ? 0 : dayChangePercent,
                totalDividends,
                xirr, // ✅ Already null for fully sold
                capitalGains,
                realizedGainsPerTransaction, // Per-transaction realized gains
                buyQty, // Total buy quantity
                sellQty, // Total sell quantity
                isFullySold // ✅ Flag for UI to handle closed positions
            };
        });
    }, [portfolio, marketPrices]);

    /**
     * Filter portfolio based on active accounts, active asset types, selected view, search, and fully sold assets toggle
     */
    const filteredPortfolio = useMemo(() => {
        return processedPortfolio.filter(p => {
            const matchesAccount = activeAccounts.includes(p.account);
            // When selectedView is 'ALL', filter by activeAssetTypes array
            // When selectedView is a specific type, filter by that type
            const matchesType = selectedView === 'ALL' 
                ? activeAssetTypes.includes(p.type) 
                : p.type === selectedView;
            const matchesSearch = p.symbol.toLowerCase().includes(tableFilter.toLowerCase()) ||
                                (p.name && p.name.toLowerCase().includes(tableFilter.toLowerCase())) ||
                                p.account.toLowerCase().includes(tableFilter.toLowerCase());
            // Phase 5: Filter out fully sold assets if toggle is off (default: hide fully sold)
            const matchesFullySold = showFullySoldAssets || (p.totalQty && p.totalQty > 0);
            return matchesAccount && matchesType && matchesSearch && matchesFullySold;
        });
    }, [processedPortfolio, activeAccounts, activeAssetTypes, selectedView, tableFilter, showFullySoldAssets]);

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
        // ✅ GOLDEN RULE: Portfolio totals = ONLY what you currently own (open positions only)
        // Only sum assets with remaining quantity > 0
        const openPositions = filteredPortfolio.filter(p => (p.totalQty || 0) > 0);
        
        // ✅ Portfolio Invested = Σ invested (open positions only)
        const invested = openPositions.reduce((s, p) => s + (p.investedValue || 0), 0);
        
        // ✅ Portfolio Current Value = Σ current_value (open positions only)
        const current = openPositions.reduce((s, p) => s + (p.currentValue || 0), 0);
        
        // ✅ Portfolio Unrealized = portfolio_value - portfolio_invested
        const totalUnrealizedGains = current - invested;
        
        // ✅ Portfolio Realized = Σ realized_pnl (all SELLs) - sum from ALL assets, not just open positions
        const totalRealizedGains = filteredPortfolio.reduce((s, p) => s + (p.realizedGains || 0), 0);
        
        // ✅ Net Worth (Option A) = portfolio_value (realized gains already out of market, not counted)
        const netWorth = current;
        
        const dayChange = openPositions.reduce((sum, p) => sum + (p.dayChange || 0), 0);
        
        // ✅ MUST-FIX: Total P&L in portfolio summary = only unrealized gains (from open positions)
        // Realized gains are shown separately in "Activity" section
        // This follows the golden rule: portfolio totals = only what you currently own
        const totalPnL = totalUnrealizedGains; // Only unrealized (from open positions)
        
        const absReturn = totalPnL; // Total P&L (unrealized only, from open positions)
        const absReturnPct = invested > 0 ? (absReturn / invested) * 100 : 0;
        const dayChangePct = (current - dayChange) > 0 ? (dayChange / (current - dayChange)) * 100 : 0;
        // Total dividends from open positions only
        const totalDividends = openPositions.reduce((s, p) => s + (p.totalDividends || 0), 0);
        
        // Capital gains - use realized and unrealized separately
        const totalRealizedSTCG = filteredPortfolio.reduce((s, p) => s + (p.capitalGains?.realized?.stcg || 0), 0);
        const totalRealizedLTCG = filteredPortfolio.reduce((s, p) => s + (p.capitalGains?.realized?.ltcg || 0), 0);
        const totalUnrealizedSTCG = filteredPortfolio.reduce((s, p) => s + (p.capitalGains?.unrealized?.stcg || 0), 0);
        const totalUnrealizedLTCG = filteredPortfolio.reduce((s, p) => s + (p.capitalGains?.unrealized?.ltcg || 0), 0);
        
        // Backward compatibility - total STCG/LTCG
        const totalSTCG = totalRealizedSTCG + totalUnrealizedSTCG;
        const totalLTCG = totalRealizedLTCG + totalUnrealizedLTCG;

        // ✅ Type allocation for pie chart - Use open positions only
        const typeAllocation = [
            { name: 'Equities', value: openPositions.filter(p => p.type === 'STOCK').reduce((s,p) => s+p.currentValue, 0) },
            { name: 'Mutual Funds', value: openPositions.filter(p => p.type === 'MF').reduce((s,p) => s+p.currentValue, 0) },
            { name: 'ETFs', value: openPositions.filter(p => p.type === 'ETF').reduce((s,p) => s+p.currentValue, 0) }
        ].filter(x => x.value > 0);

        // ✅ Wallet allocation - Use open positions only
        const walletAllocation = activeAccounts.map(acc => ({
            name: acc,
            value: openPositions.filter(p => p.account === acc).reduce((s,p) => s+p.currentValue, 0)
        })).filter(x => x.value > 0);

        // Sector-wise exposure
        const sectorExposure = {};
        filteredPortfolio.filter(p => p.type === 'STOCK' && p.sector).forEach(p => {
            sectorExposure[p.sector] = (sectorExposure[p.sector] || 0) + p.currentValue;
        });

        // Top gainer/loser
        const topGainer = [...filteredPortfolio].sort((a,b) => b.absReturnPercent - a.absReturnPercent)[0];
        const topLoser = [...filteredPortfolio].sort((a,b) => a.absReturnPercent - b.absReturnPercent)[0];

        // ✅ GOLDEN RULE: Portfolio XIRR - Use actual cashflows
        // BUY → negative, SELL → positive, Current value → final positive (virtual)
        let portfolioXIRR = null;
        let oldestTransactionDate = null;

        if (portfolio.length > 0) {
            const allTransactions = [];
            portfolio.forEach(asset => {
                asset.transactions.forEach(tx => {
                    const date = new Date(tx.date);
                    if (!isNaN(date.getTime())) {
                        const txType = tx.type || 'BUY';
                        // BUY → negative (outflow), SELL → positive (inflow)
                        const amount = txType === 'BUY' 
                            ? -(tx.quantity * tx.price)  // Outflow
                            : (tx.quantity * tx.price);  // Inflow
                        allTransactions.push({
                            amount,
                            when: date
                        });
                        if (!oldestTransactionDate || date < oldestTransactionDate) {
                            oldestTransactionDate = date;
                        }
                    }
                });
            });

            // Current value → final positive (virtual inflow)
            if (allTransactions.length > 0 && current > 0) {
                allTransactions.push({
                    amount: current, // Final positive (virtual)
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
            invested, // ✅ Portfolio Invested (open positions only)
            current: netWorth, // ✅ Net Worth = portfolio_value (Option A)
            dayChange,
            dayChangePct,
            absReturn,
            absReturnPct,
            totalDividends,
            totalSTCG,
            totalLTCG,
            // ✅ Realized and unrealized gains (separated)
            realizedGains: totalRealizedGains, // From all SELLs
            unrealizedGains: totalUnrealizedGains, // portfolio_value - portfolio_invested
            totalPnL,
            // Capital gains breakdown
            realizedSTCG: totalRealizedSTCG,
            realizedLTCG: totalRealizedLTCG,
            unrealizedSTCG: totalUnrealizedSTCG,
            unrealizedLTCG: totalUnrealizedLTCG,
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

        // ✅ Filter portfolio by active accounts, active asset types, and selected view
        // Only include assets with open positions (totalQty > 0)
        const portfolioToUse = processedPortfolio.filter(asset => {
            const matchesAccount = activeAccounts.includes(asset.account);
            const matchesType = selectedView === 'ALL' 
                ? activeAssetTypes.includes(asset.type) 
                : asset.type === selectedView;
            const hasOpenPosition = (asset.totalQty || 0) > 0;
            return matchesAccount && matchesType && hasOpenPosition;
        });

        for (let i = monthsToShow - 1; i >= 0; i--) {
            const targetMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = targetMonth.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });

            const monthlyInvestment = portfolioToUse.reduce((sum, asset) => {
                return sum + asset.transactions.reduce((s, tx) => {
                    const txDate = new Date(tx.date);
                    if (txDate.getFullYear() === targetMonth.getFullYear() &&
                        txDate.getMonth() === targetMonth.getMonth()) {
                        const txType = tx.type || 'BUY';
                        // BUY transactions add to investment
                        if (txType === 'BUY') {
                            return s + (tx.quantity * tx.price);
                        }
                        // SELL transactions: We need to calculate cost basis, but for monthly chart
                        // we'll use a simplified approach - subtract based on average buy price
                        // This is an approximation for the chart
                        else if (txType === 'SELL') {
                            // Calculate average buy price up to this point
                            const buyTxsBeforeSell = asset.transactions
                                .filter(t => (t.type || 'BUY') === 'BUY' && new Date(t.date) <= txDate)
                                .reduce((acc, t) => {
                                    acc.totalQty += t.quantity;
                                    acc.totalCost += t.quantity * t.price;
                                    return acc;
                                }, { totalQty: 0, totalCost: 0 });
                            const avgBuyPrice = buyTxsBeforeSell.totalQty > 0 
                                ? buyTxsBeforeSell.totalCost / buyTxsBeforeSell.totalQty 
                                : 0;
                            // Subtract cost basis, not proceeds
                            return s - (tx.quantity * avgBuyPrice);
                        }
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
    }, [processedPortfolio, activeAccounts, activeAssetTypes, selectedView]);

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

        // ✅ Asset Allocation Insight - Use open positions only
        const openPositionsForInsights = filteredPortfolio.filter(p => (p.totalQty || 0) > 0);
        const filteredTotalValue = openPositionsForInsights.reduce((s, p) => s + p.currentValue, 0);
        if (filteredTotalValue > 0) {
            const equity = openPositionsForInsights.filter(p => p.type === 'STOCK').reduce((s, p) => s + p.currentValue, 0);
            const mf = openPositionsForInsights.filter(p => p.type === 'MF').reduce((s, p) => s + p.currentValue, 0);
            const etf = openPositionsForInsights.filter(p => p.type === 'ETF').reduce((s, p) => s + p.currentValue, 0);

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
     * Returns a Promise that resolves on success or rejects on error (so modal can stay open and show error).
     */
    const handleAddAsset = async (assetData) => {
        const existingAsset = portfolio.find(
            p => p.symbol.toUpperCase() === assetData.symbol.toUpperCase() &&
                 p.account === assetData.account &&
                 p.type === assetData.type
        );

        if (existingAsset) {
            const result = await updateAsset(existingAsset.id, {
                transactions: [...existingAsset.transactions, assetData.transaction]
            });
            if (result?.error) throw result.error;
            console.log('📝 Added transaction to existing asset:', existingAsset.symbol);
        } else {
            const result = await addAsset({
                symbol: assetData.symbol,
                name: assetData.name,
                type: assetData.type,
                account: assetData.account,
                sector: assetData.sector || '',
                transactions: [assetData.transaction],
                dividends: []
            });
            if (result?.error) throw result.error;
            console.log('✨ Created new asset:', assetData.symbol);
        }
    };

    /**
     * Handle deleting an asset (async for Supabase; shows loading and errors)
     */
    const handleDeleteAsset = async () => {
        if (!assetToDelete) return;
        setIsDeletingAsset(true);
        try {
            const result = await Promise.resolve(deleteAsset(assetToDelete.id));
            if (result?.error) throw result.error;
            setAssetToDelete(null);
        } catch (err) {
            console.error('Error deleting asset:', err);
            alert(err?.message || 'Failed to delete asset. Please try again.');
        } finally {
            setIsDeletingAsset(false);
        }
    };

    /**
     * Handle updating an asset (e.g., editing sector, name)
     */
    const handleUpdateAsset = (id, updates) => {
        updateAsset(id, updates);
    };

    /**
     * Handle adding a transaction to an existing asset (returns Promise for error handling)
     */
    const handleAddTransaction = async (assetOrId, transaction) => {
        const assetId = typeof assetOrId === 'object' ? assetOrId.id : assetOrId;
        const asset = portfolio.find(p => p.id === assetId);
        if (!asset) return;
        const result = await Promise.resolve(updateAsset(assetId, {
            transactions: [...asset.transactions, transaction]
        }));
        if (result?.error) throw result.error;
    };

    /**
     * Handle updating a transaction (returns Promise for error handling)
     */
    const handleUpdateTransaction = async (assetOrId, transactionData) => {
        const assetId = typeof assetOrId === 'object' ? assetOrId.id : assetOrId;
        const transactionId = transactionData.id;
        const asset = portfolio.find(p => p.id === assetId);
        if (!asset) return;
        const updatedTransactions = asset.transactions.map(tx =>
            tx.id === transactionId ? { ...tx, ...transactionData } : tx
        );
        const result = await Promise.resolve(updateAsset(assetId, { transactions: updatedTransactions }));
        if (result?.error) throw result.error;
    };

    /**
     * Handle deleting a transaction (returns Promise so callers can await and show errors)
     */
    const handleDeleteTransaction = async (assetOrId, transactionId) => {
        const assetId = typeof assetOrId === 'object' ? assetOrId.id : assetOrId;
        const asset = portfolio.find(p => p.id === assetId);
        if (!asset) return;
        const updatedTransactions = asset.transactions.filter(tx => tx.id !== transactionId);
        if (updatedTransactions.length === 0) {
            const result = await Promise.resolve(deleteAsset(assetId));
            if (result?.error) throw result.error;
        } else {
            const result = await Promise.resolve(updateAsset(assetId, { transactions: updatedTransactions }));
            if (result?.error) throw result.error;
        }
    };

    /**
     * Handle adding a dividend to an asset (returns Promise for error handling)
     */
    const handleAddDividend = async (assetOrId, dividend) => {
        const assetId = typeof assetOrId === 'object' ? assetOrId.id : assetOrId;
        const asset = portfolio.find(p => p.id === assetId);
        if (!asset) return;
        const result = await Promise.resolve(updateAsset(assetId, {
            dividends: [...(asset.dividends || []), dividend]
        }));
        if (result?.error) throw result.error;
    };

    /**
     * Handle deleting a dividend (returns Promise so callers can await and show errors)
     */
    const handleDeleteDividend = async (assetOrId, dividendId) => {
        const assetId = typeof assetOrId === 'object' ? assetOrId.id : assetOrId;
        const asset = portfolio.find(p => p.id === assetId);
        if (!asset) return;
        const updatedDividends = (asset.dividends || []).filter(d => d.id !== dividendId);
        const result = await Promise.resolve(updateAsset(assetId, { dividends: updatedDividends }));
        if (result?.error) throw result.error;
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
     * Add a new account from Add Asset modal (e.g. when selecting account)
     * Returns a Promise so the modal can show errors.
     */
    const handleAddAccountFromModal = async (name) => {
        const trimmed = (name || '').trim();
        if (!trimmed) return;
        if (accounts.includes(trimmed)) return; // already exists
        const result = await Promise.resolve(addAccount(trimmed));
        if (result?.error) throw result.error;
        setActiveAccounts(prev => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    };

    /**
     * Handle deleting a wallet/account
     */
    const handleDeleteWallet = async () => {
        if (!walletToDelete) return;
        
        setIsDeletingWallet(true);
        try {
            // For Supabase, we need to find the account ID from the account name
            if (useSupabase && accountsData) {
                const accountToDelete = accountsData.find(acc => acc.name === walletToDelete);
                if (accountToDelete) {
                    await deleteAccount(accountToDelete.id);
                } else {
                    console.error('Account not found:', walletToDelete);
                    alert('Account not found. Please refresh and try again.');
                    setIsDeletingWallet(false);
                    return;
                }
            } else {
                // For localStorage, deleteAccount expects the account name
                deleteAccount(walletToDelete);
            }
            
            // Update active accounts filter
            setActiveAccounts(prev => prev.filter(acc => acc !== walletToDelete));
            setWalletToDelete(null);
        } catch (error) {
            console.error('Error deleting wallet:', error);
            alert('Failed to delete wallet. Please try again.');
        } finally {
            setIsDeletingWallet(false);
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
            accounts,
            bulkImportPortfolio,
            useSupabase
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
    // MIGRATION CHECK - DISABLED
    // ========================================================================
    // Migration is disabled. If you need to migrate localStorage data to Supabase,
    // uncomment the code below and refresh the page.
    /*
    useEffect(() => {
        if (useSupabase && !authLoading) {
            const migrated = localStorage.getItem(`${APP_ID}_migrated`);
            const hasLocalData = localStorage.getItem(`${APP_ID}_portfolio`);

            if (!migrated && hasLocalData) {
                setShowMigration(true);
            }
        }
    }, [useSupabase, authLoading]);
    */

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

    // Migration modal disabled - uncomment if needed
    /*
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
    */

    // Show loading for portfolio data - use skeleton loaders
    if (loading) {
        return (
            <MobileLayout
                currentView="portfolio"
                onViewChange={setMobileView}
                onQuickAdd={() => setShowAddModal(true)}
                onOpenSettings={() => setShowSettings(true)}
                stats={stats}
            >
                <MobilePortfolioView
                    stats={stats}
                    filteredPortfolio={[]}
                    groupedPortfolio={{}}
                    selectedView="ALL"
                    setSelectedView={() => {}}
                    onRefresh={refreshAllPrices}
                    isRefreshing={isRefreshing}
                    tableFilter=""
                    setTableFilter={() => {}}
                    expandedGroups={[]}
                    toggleGroupExpansion={() => {}}
                    pnlView="total"
                    setPnlView={() => {}}
                    onUpdateAsset={() => {}}
                    onDeleteAsset={() => {}}
                    onAddTransaction={() => {}}
                    onUpdateTransaction={() => {}}
                    onDeleteTransaction={() => {}}
                    onAddDividend={() => {}}
                    onDeleteDividend={() => {}}
                    formatCurrency={formatCurrency}
                    onQuickAdd={() => setShowAddModal(true)}
                    accounts={accounts}
                    activeAccounts={activeAccounts}
                    setActiveAccounts={setActiveAccounts}
                    activeAssetTypes={activeAssetTypes}
                    setActiveAssetTypes={setActiveAssetTypes}
                    isLoading={true}
                />
            </MobileLayout>
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
                    activeAssetTypes={activeAssetTypes}
                    setActiveAssetTypes={setActiveAssetTypes}
                />;
            case 'analytics':
                return <MobileAnalyticsView 
                    stats={stats}
                    accounts={accounts}
                    activeAccounts={activeAccounts}
                    setActiveAccounts={setActiveAccounts}
                    activeAssetTypes={activeAssetTypes}
                    setActiveAssetTypes={setActiveAssetTypes}
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
                        activeAssetTypes={activeAssetTypes}
                        setActiveAssetTypes={setActiveAssetTypes}
                        showFullySoldAssets={showFullySoldAssets}
                        setShowFullySoldAssets={setShowFullySoldAssets}
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
                onAddAccount={handleAddAccountFromModal}
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
                    onClose={() => !isDeletingWallet && setWalletToDelete(null)}
                    onConfirm={handleDeleteWallet}
                    title="Delete Wallet"
                    description={`Are you sure you want to delete "${walletToDelete}"? This will permanently delete all assets, transactions, and dividends in this wallet. This action cannot be undone.`}
                    confirmText="Delete"
                    isLoading={isDeletingWallet}
                />
            )}

            {/* Confirmation Modal - Delete Asset */}
            {assetToDelete && (
                <ConfirmationModal
                    isOpen={!!assetToDelete}
                    onClose={() => !isDeletingAsset && setAssetToDelete(null)}
                    onConfirm={handleDeleteAsset}
                    title="Delete Asset"
                    description={`Are you sure you want to delete ${assetToDelete.symbol}? This will remove all transactions and data for this asset.`}
                    confirmText="Delete"
                    isLoading={isDeletingAsset}
                />
            )}
        </>
    );
};

export default App;
