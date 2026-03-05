import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, Search, Filter, X, Check, LogOut, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useDarkModeContext } from '../MobileLayout';
import MobileAssetCard from '../MobileAssetCard';
import MobilePortfolioSummaryCard from './MobilePortfolioSummaryCard';
import MobileEmptyState from './MobileEmptyState';
import { PortfolioSummarySkeleton, AssetCardSkeleton, GroupHeaderSkeleton } from '../SkeletonLoader';

/**
 * MobilePortfolioView - Main portfolio view for mobile
 * Clean, scrollable, card-based interface
 */
const MobilePortfolioView = ({
    stats,
    filteredPortfolio,
    groupedPortfolio,
    selectedView,
    setSelectedView,
    onRefresh,
    isRefreshing,
    tableFilter,
    setTableFilter,
    expandedGroups,
    toggleGroupExpansion,
    pnlView,
    setPnlView,
    onUpdateAsset,
    onDeleteAsset,
    onAddTransaction,
    onUpdateTransaction,
    onDeleteTransaction,
    onAddDividend,
    onDeleteDividend,
    formatCurrency,
    onQuickAdd,
    accounts = [],
    activeAccounts = [],
    setActiveAccounts,
    activeAssetTypes = ['STOCK', 'MF', 'ETF'], // US_STOCK unchecked by default
    setActiveAssetTypes,
    showFullySoldAssets = false,
    setShowFullySoldAssets,
    isLoading = false
}) => {
    const [showFilters, setShowFilters] = useState(false);
    const [showFilterSheet, setShowFilterSheet] = useState(false);
    
    // Use refs to store filter selections while sheet is open (avoids stale closure issues)
    const tempWalletsRef = useRef([]);
    const tempAssetsRef = useRef([]);
    
    // Force re-render when temp values change
    const [, forceUpdate] = useState(0);
    
    // Open filter and initialize temp states from current active states
    const openFilterSheet = () => {
        // Copy current selections to temp - use accounts as fallback if activeAccounts is empty
        const walletsToUse = activeAccounts.length > 0 ? [...activeAccounts] : [...accounts];
        tempWalletsRef.current = walletsToUse;
        tempAssetsRef.current = [...activeAssetTypes];
        setShowFilterSheet(true);
    };
    
    // Toggle wallet in temp ref
    const toggleTempWallet = (account) => {
        const current = tempWalletsRef.current;
        const isSelected = current.includes(account);
        if (isSelected) {
            // Don't allow removing the last one
            if (current.length > 1) {
                tempWalletsRef.current = current.filter(a => a !== account);
            }
        } else {
            tempWalletsRef.current = [...current, account];
        }
        forceUpdate(n => n + 1);
    };
    
    // Toggle asset type in temp ref
    const toggleTempAsset = (assetType) => {
        const current = tempAssetsRef.current;
        const isSelected = current.includes(assetType);
        if (isSelected) {
            // Don't allow removing the last one
            if (current.length > 1) {
                tempAssetsRef.current = current.filter(a => a !== assetType);
            }
        } else {
            tempAssetsRef.current = [...current, assetType];
        }
        forceUpdate(n => n + 1);
    };
    
    // Apply filter selections
    const applyFilters = () => {
        // Get values from refs
        const walletsToApply = tempWalletsRef.current.length > 0 
            ? [...tempWalletsRef.current] 
            : [...accounts];
        const assetsToApply = tempAssetsRef.current.length > 0 
            ? [...tempAssetsRef.current] 
            : ['STOCK', 'MF', 'ETF']; // Default: US Stocks unchecked
        
        // Apply wallet filter to parent state
        if (setActiveAccounts) {
            setActiveAccounts(walletsToApply);
        }
        // Apply asset type filter to parent state (affects all calculations)
        if (setActiveAssetTypes) {
            setActiveAssetTypes(assetsToApply);
        }
        
        // Close the sheet
        setShowFilterSheet(false);
    };
    
    // Clear all filters
    const clearFilters = () => {
        // Reset to all wallets and default asset types (US Stocks unchecked)
        if (setActiveAccounts) {
            setActiveAccounts([...accounts]);
        }
        if (setActiveAssetTypes) {
            setActiveAssetTypes(['STOCK', 'MF', 'ETF']);
        }
        
        // Close the sheet
        setShowFilterSheet(false);
    };
    
    // Ensure selectedView is always 'ALL' on mobile for grouped view
    useEffect(() => {
        if (selectedView !== 'ALL') {
            setSelectedView('ALL');
        }
    }, [selectedView, setSelectedView]);
    
    // Track which headers are currently stuck (sticky)
    const [stickyHeaders, setStickyHeaders] = useState({});
    const headerRefs = useRef({});
    const scrollContainerRef = useRef(null);

    // Get auth context
    const { user, signOut } = useAuth();
    
    // Get dark mode context
    const { isDarkMode, toggleDarkMode } = useDarkModeContext();
    
    // Detect sticky state using IntersectionObserver
    useEffect(() => {
        const observers = [];
        
        Object.entries(headerRefs.current).forEach(([type, ref]) => {
            if (ref) {
                const observer = new IntersectionObserver(
                    ([entry]) => {
                        // When the header is intersecting at the top, it's sticky
                        const isSticky = entry.intersectionRatio < 1 && entry.boundingClientRect.top <= 0;
                        setStickyHeaders(prev => ({ ...prev, [type]: isSticky }));
                    },
                    { threshold: [1], rootMargin: '-1px 0px 0px 0px' }
                );
                observer.observe(ref);
                observers.push(observer);
            }
        });
        
        return () => {
            observers.forEach(observer => observer.disconnect());
        };
    }, [groupedPortfolio]);

    // Personalized name - extract from email
    const getDisplayName = () => {
        if (user?.email) {
            const emailName = user.email.split('@')[0];
            // Capitalize first letter
            return emailName.charAt(0).toUpperCase() + emailName.slice(1);
        }
        return 'User'; // Fallback (but shouldn't be shown if no user)
    };

    const displayName = getDisplayName();

    // Check if portfolio is empty
    const isEmptyPortfolio = filteredPortfolio.length === 0 && !tableFilter && selectedView === 'ALL';

    return (
        <div className={`flex flex-col h-full transition-colors duration-300 ${
            isDarkMode ? 'bg-slate-900' : 'bg-slate-50'
        }`}>
            {/* Mobile Header - Compact */}
            <div className={`sticky top-0 z-30 border-b transition-colors duration-300 ${
                isDarkMode 
                    ? 'bg-slate-900/95 backdrop-blur-lg border-slate-800' 
                    : 'bg-white border-slate-200'
            }`}>
                <div className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className={`text-lg font-black transition-colors duration-300 ${
                                isDarkMode ? 'text-white' : 'text-slate-800'
                            }`}>
                                {displayName}'s Portfolio
                            </h1>
                            <p className={`text-[10px] font-bold uppercase tracking-wider ${
                                isDarkMode ? 'text-slate-500' : 'text-slate-400'
                            }`}>
                                Personal Investments
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Dark Mode Toggle */}
                            <button
                                onClick={toggleDarkMode}
                                className={`p-3 rounded-xl transition-all active:scale-95 ${
                                    isDarkMode 
                                        ? 'bg-slate-700 text-amber-400' 
                                        : 'bg-slate-100 text-slate-600'
                                }`}
                                aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                            >
                                {isDarkMode ? (
                                    <Sun size={18} strokeWidth={2.5} />
                                ) : (
                                    <Moon size={18} strokeWidth={2.5} />
                                )}
                            </button>
                            {user && (
                                <button
                                    onClick={signOut}
                                    className="p-3 rounded-xl bg-red-50 text-red-600 active:bg-red-100 transition-all"
                                    aria-label="Sign out"
                                >
                                    <LogOut size={18} />
                                </button>
                            )}
                            <button
                                onClick={onRefresh}
                                disabled={isRefreshing}
                                className={`p-3 rounded-xl bg-teal-50 text-teal-600 active:bg-teal-100 transition-all ${
                                    isRefreshing ? 'animate-spin' : ''
                                }`}
                            >
                                <RefreshCw size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Search & Filter Bar */}
                <div className="px-4 pb-3">
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <Search size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                                isDarkMode ? 'text-slate-500' : 'text-slate-400'
                            }`} />
                            <input
                                type="text"
                                placeholder="Search assets..."
                                value={tableFilter}
                                onChange={(e) => setTableFilter(e.target.value)}
                                className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors duration-300 ${
                                    isDarkMode 
                                        ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' 
                                        : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400'
                                } border`}
                            />
                        </div>
                        <button
                            onClick={openFilterSheet}
                            className={`p-3 rounded-xl border transition-all relative ${
                                (activeAccounts.length < accounts.length) || (activeAssetTypes.length < 4)
                                    ? 'bg-teal-600 text-white border-teal-600'
                                    : isDarkMode 
                                        ? 'bg-slate-800 text-slate-400 border-slate-700'
                                    : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}
                        >
                            <Filter size={20} />
                            {/* Active filter count badge */}
                            {((accounts.length - activeAccounts.length) + (4 - activeAssetTypes.length)) > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-sm">
                                    {(accounts.length - activeAccounts.length) + (4 - activeAssetTypes.length)}
                                </span>
                            )}
                        </button>
                    </div>

                </div>
            </div>

            {/* Portfolio Cards - Scrollable */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {/* Show Loading Skeletons */}
                {isLoading ? (
                    <>
                        <PortfolioSummarySkeleton />
                        <GroupHeaderSkeleton />
                        {[1, 2, 3].map((i) => (
                            <AssetCardSkeleton key={i} />
                        ))}
                    </>
                ) : isEmptyPortfolio ? (
                    <MobileEmptyState onAddAsset={onQuickAdd} />
                ) : (
                    <>
                        {/* Portfolio Summary Card - Only show if has holdings */}
                        {filteredPortfolio.length > 0 && !tableFilter && (
                            <MobilePortfolioSummaryCard stats={stats} />
                        )}

                        {/* Asset Cards - Always show grouped view on mobile, filtered by activeAssetTypes */}
                        {(() => {
                            // Filter grouped portfolio by active asset types
                            const filteredGroups = Object.entries(groupedPortfolio)
                                .filter(([type]) => activeAssetTypes.includes(type));
                            
                            if (filteredGroups.length === 0) {
                                return (
                                <div className="text-center py-20">
                                        <p className={`text-sm ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                            No assets found
                                        </p>
                                </div>
                                );
                            }
                            
                            return filteredGroups.map(([type, items]) => {
                            const isExpanded = expandedGroups.includes(type);
                            const typeLabels = {
                                'STOCK': 'Stocks',
                                'MF': 'Mutual Funds',
                                'ETF': 'ETFs',
                                'US_STOCK': 'US Stocks'
                            };
                            
                            // ✅ SHOULD-FIX: Separate open and closed positions
                            const openItems = items.filter(item => (item.totalQty || 0) > 0);
                            const closedItems = items.filter(item => (item.totalQty || 0) <= 0);
                            const displayItems = showFullySoldAssets ? items : openItems;
                            
                            // Calculate group totals
                            // ✅ GOLDEN RULE: Group totals = ONLY what you currently own (open positions only)
                            // - Invested, Current Value, Day Change: only open positions (totalQty > 0)
                            // - Total P&L: only unrealized gains from open positions (not including realized from sold items)
                            const totalUnrealizedGains = openItems.reduce((sum, item) => sum + (item.unrealizedGains || 0), 0);
                            const totalPnL = totalUnrealizedGains; // Only unrealized (from open positions)
                            const totalDayChange = openItems.reduce((sum, item) => sum + item.dayChange, 0);
                            const totalValue = openItems.reduce((sum, item) => sum + item.currentValue, 0);
                            const totalInvested = openItems.reduce((sum, item) => sum + (item.investedValue || 0), 0);
                            const totalDayChangePercent = totalValue - totalDayChange > 0 
                                ? (totalDayChange / (totalValue - totalDayChange)) * 100 
                                : 0;
                            const totalReturnPercent = totalInvested > 0 
                                ? (totalPnL / totalInvested) * 100 
                                : 0;

                            // Calculate group XIRR (weighted average)
                            // ✅ GOLDEN RULE: XIRR only for open positions
                            const groupXIRR = openItems.reduce((sum, item) => {
                                if (item.xirr !== null && item.xirr !== undefined) {
                                    const weight = item.investedValue || 0;
                                    return sum + (item.xirr * weight);
                                }
                                return sum;
                            }, 0) / (totalInvested || 1);

                            // Check if this header is currently sticky (scrolled)
                            const isHeaderSticky = stickyHeaders[type];
                            // Show expanded only if group is expanded AND not sticky
                            const showExpandedStats = isExpanded && !isHeaderSticky;

                            return (
                                <div key={type} className="space-y-2">
                                    {/* Sticky Collapsible Section Header */}
                                    <div 
                                        className={`rounded-2xl overflow-hidden transition-all ${
                                            isDarkMode 
                                                ? 'bg-slate-800 border border-slate-700' 
                                                : 'bg-white border border-slate-200 shadow-sm'
                                        }`}
                                    >
                                        {/* Header Row - Always Visible */}
                                        <button
                                            onClick={() => toggleGroupExpansion(type)}
                                            className={`w-full flex items-center justify-between transition-all active:bg-slate-50 dark:active:bg-slate-700/50 ${
                                                isHeaderSticky ? 'p-2' : 'p-3'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className={`rounded-xl flex items-center justify-center transition-all relative overflow-hidden ${
                                                    isHeaderSticky ? 'w-7 h-7 text-sm' : 'w-9 h-9 text-base'
                                                } ${
                                                    type === 'STOCK' 
                                                        ? 'asset-pattern-stock' 
                                                        : type === 'MF'
                                                            ? 'asset-pattern-mf' 
                                                            : type === 'US_STOCK'
                                                                ? 'asset-pattern-usstock'
                                                                : 'asset-pattern-etf'
                                                } text-white shadow-md`}>
                                                    {type === 'STOCK' ? '📈' : type === 'MF' ? '💼' : type === 'US_STOCK' ? '🌎' : '📦'}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`font-black ${isDarkMode ? 'text-white' : 'text-slate-800'} ${
                                                            isHeaderSticky ? 'text-xs' : 'text-sm'
                                                        }`}>
                                                            {typeLabels[type]}
                                                        </span>
                                                        <span className={`font-bold px-1.5 py-0.5 rounded-full transition-all duration-200 ${
                                                            isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'
                                                        } ${isHeaderSticky ? 'text-[8px]' : 'text-[10px]'}`}>
                                                            {openItems.length}{showFullySoldAssets && closedItems.length > 0 ? ` (${closedItems.length})` : ''}
                                                </span>
                                                    </div>
                                                    {!isHeaderSticky && (
                                                        <p className={`text-[10px] font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                                            {formatCurrency(totalInvested)} invested
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* Value/Change Summary */}
                                            <div className="flex items-center gap-1.5">
                                                <div className="text-right">
                                                    {pnlView === 'total' ? (
                                                        <>
                                                            <p className={`font-black tabular-nums ${isDarkMode ? 'text-white' : 'text-slate-800'} ${isHeaderSticky ? 'text-xs' : 'text-sm'}`}>
                                                                {formatCurrency(totalValue)}
                                                            </p>
                                                            <p className={`font-bold ${
                                                                totalPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'
                                                            } ${isHeaderSticky ? 'text-[8px]' : 'text-[10px]'}`}>
                                                                {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)} ({totalReturnPercent >= 0 ? '↑' : '↓'}{Math.abs(totalReturnPercent).toFixed(1)}%)
                                                            </p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <p className={`font-black tabular-nums ${
                                                                totalDayChange >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                                            } ${isHeaderSticky ? 'text-xs' : 'text-sm'}`}>
                                                                {totalDayChange >= 0 ? '+' : ''}{formatCurrency(totalDayChange)}
                                                            </p>
                                                            <p className={`font-bold ${
                                                                totalDayChangePercent >= 0 ? 'text-emerald-500' : 'text-rose-500'
                                                            } ${isHeaderSticky ? 'text-[8px]' : 'text-[10px]'}`}>
                                                                {totalDayChangePercent >= 0 ? '↑' : '↓'} {Math.abs(totalDayChangePercent).toFixed(2)}%
                                                            </p>
                                                        </>
                                                    )}
                                                </div>
                                                <div className={`rounded-full flex items-center justify-center transition-all ${
                                                    isDarkMode ? 'bg-slate-700' : 'bg-slate-100'
                                                } ${isHeaderSticky ? 'w-5 h-5' : 'w-6 h-6'}`}>
                                                    <span className={`transition-transform duration-200 ${isExpanded && !isHeaderSticky ? 'rotate-180' : ''} ${
                                                        isHeaderSticky ? 'text-[10px]' : 'text-xs'
                                                    }`}>
                                                        ▾
                                                </span>
                                                </div>
                                            </div>
                                        </button>

                                        {/* Expandable Stats Row - Smooth expand/collapse */}
                                        <div className={`expand-section overflow-hidden ${showExpandedStats ? 'open' : ''}`}>
                                            <div className="expand-content">
                                                <div className={`px-3 pb-3 pt-1 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                                                {/* Total/1D Toggle */}
                                                <div className="flex justify-between items-center mb-2">
                                                    <p className={`text-[9px] font-bold uppercase ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                                        Summary
                                                    </p>
                                                    <div className={`flex items-center rounded-lg p-0.5 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setPnlView('total'); }}
                                                            className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase transition-all ${
                                                                pnlView === 'total'
                                                                    ? isDarkMode 
                                                                        ? 'bg-slate-600 text-white shadow' 
                                                                        : 'bg-white text-slate-800 shadow'
                                                                    : isDarkMode 
                                                                        ? 'text-slate-400' 
                                                                        : 'text-slate-500'
                                                            }`}
                                                        >
                                                            Total
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setPnlView('1day'); }}
                                                            className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase transition-all ${
                                                                pnlView === '1day'
                                                                    ? isDarkMode 
                                                                        ? 'bg-slate-600 text-white shadow' 
                                                                        : 'bg-white text-slate-800 shadow'
                                                                    : isDarkMode 
                                                                        ? 'text-slate-400' 
                                                                        : 'text-slate-500'
                                                            }`}
                                                        >
                                                            1D
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Stats Grid */}
                                                <div className="grid grid-cols-4 gap-1.5">
                                                    <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
                                                        <p className={`text-[8px] font-bold uppercase ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Value</p>
                                                        <p className={`text-[11px] font-black tabular-nums ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                                                            {formatCurrency(totalValue)}
                                                        </p>
                                                    </div>
                                                    <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
                                                        <p className={`text-[8px] font-bold uppercase ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Invested</p>
                                                        <p className={`text-[11px] font-black tabular-nums ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                                            {formatCurrency(totalInvested)}
                                                        </p>
                                                    </div>
                                                    <div className={`p-2 rounded-lg ${
                                                        totalDayChange >= 0 
                                                            ? isDarkMode ? 'bg-emerald-900/30' : 'bg-emerald-50'
                                                            : isDarkMode ? 'bg-rose-900/30' : 'bg-rose-50'
                                                    }`}>
                                                        <p className={`text-[8px] font-bold uppercase ${
                                                            totalDayChange >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                                        }`}>Today</p>
                                                        <p className={`text-[11px] font-black tabular-nums ${
                                                                totalDayChange >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                                            }`}>
                                                                {totalDayChange >= 0 ? '+' : ''}{formatCurrency(totalDayChange)}
                                                            </p>
                                                    </div>
                                                    {/* XIRR - For STOCK, MF, US_STOCK */}
                                                    {(type === 'STOCK' || type === 'MF' || type === 'US_STOCK') && (
                                                        <div className={`p-2 rounded-lg ${
                                                            groupXIRR >= 0 
                                                                ? isDarkMode ? 'bg-teal-900/30' : 'bg-teal-50'
                                                                : isDarkMode ? 'bg-rose-900/30' : 'bg-rose-50'
                                                        }`}>
                                                            <p className={`text-[8px] font-bold uppercase ${
                                                                groupXIRR >= 0 ? 'text-teal-600' : 'text-rose-600'
                                                            }`}>XIRR</p>
                                                            <p className={`text-[11px] font-black tabular-nums ${
                                                                groupXIRR >= 0 ? 'text-teal-600' : 'text-rose-600'
                                                            }`}>
                                                                {groupXIRR >= 0 ? '+' : ''}{groupXIRR.toFixed(1)}%
                                                            </p>
                                                        </div>
                                                    )}
                                                    {type === 'ETF' && (
                                                        <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
                                                            <p className={`text-[8px] font-bold uppercase ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Return</p>
                                                            <p className={`text-[11px] font-black tabular-nums ${
                                                                totalReturnPercent >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                                            }`}>
                                                                {totalReturnPercent >= 0 ? '+' : ''}{totalReturnPercent.toFixed(1)}%
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Individual Items - Smooth expand/collapse with stagger */}
                                    <div className={`expand-section overflow-hidden ${isExpanded ? 'open' : ''}`}>
                                        <div className="expand-content">
                                            {/* Open Positions */}
                                            {openItems.length > 0 && openItems.map((item, idx) => (
                                                <div 
                                                    key={item.id} 
                                                    className={`animate-fade-slide-in stagger-${Math.min(idx + 1, 8)}`}
                                                >
                                                    <MobileAssetCard
                                                        item={item}
                                                        pnlView={pnlView}
                                                        onUpdateAsset={onUpdateAsset}
                                                        onDeleteAsset={onDeleteAsset}
                                                        onAddTransaction={onAddTransaction}
                                                        onUpdateTransaction={onUpdateTransaction}
                                                        onDeleteTransaction={onDeleteTransaction}
                                                        onAddDividend={onAddDividend}
                                                        onDeleteDividend={onDeleteDividend}
                                                    />
                                                </div>
                                            ))}
                                            
                                            {/* Closed Positions – smooth transition when toggling show fully sold */}
                                            {closedItems.length > 0 && (
                                                <div className={`closed-positions-enter mt-2 ${showFullySoldAssets ? 'open' : ''}`}>
                                                    <div className="mt-2 mb-2 px-2">
                                                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                                                            Closed Positions
                                                        </p>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {closedItems.map((item, idx) => (
                                                            <div key={item.id} className="closed-position-item opacity-75">
                                                                <MobileAssetCard
                                                                    item={item}
                                                                    pnlView={pnlView}
                                                                    onUpdateAsset={onUpdateAsset}
                                                                    onDeleteAsset={onDeleteAsset}
                                                                    onAddTransaction={onAddTransaction}
                                                                    onUpdateTransaction={onUpdateTransaction}
                                                                    onDeleteTransaction={onDeleteTransaction}
                                                                    onAddDividend={onAddDividend}
                                                                    onDeleteDividend={onDeleteDividend}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                        </div>
                                    </div>
                                </div>
                            );
                        });
                        })()}
                    </>
                )}
            </div>

            {/* Filter Bottom Sheet */}
            {showFilterSheet && (
                <div className="fixed inset-0 z-[200] flex items-end bg-slate-900/60 backdrop-blur-md filter-sheet-backdrop">
                    <div className={`w-full rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col filter-sheet-panel ${
                        isDarkMode ? 'bg-slate-800' : 'bg-white'
                    }`}>
                        {/* Header */}
                        <div className={`p-6 border-b flex items-center justify-between flex-shrink-0 ${
                            isDarkMode ? 'border-slate-700' : 'border-slate-200'
                        }`}>
                            <h2 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                                Filter Portfolio
                            </h2>
                            <button
                                onClick={() => setShowFilterSheet(false)}
                                className={`p-2 rounded-full transition-colors ${
                                    isDarkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-600'
                                }`}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Asset Types Section - Grid Layout */}
                            <div>
                                <h3 className={`text-sm font-black uppercase mb-4 ${
                                    isDarkMode ? 'text-slate-100' : 'text-slate-800'
                                }`}>Asset Types</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { value: 'STOCK', label: 'Stocks' },
                                        { value: 'MF', label: 'Mutual Funds' },
                                        { value: 'ETF', label: 'ETFs' },
                                        { value: 'US_STOCK', label: 'US Stocks' }
                                    ].map((asset) => {
                                        const isSelected = tempAssetsRef.current.includes(asset.value);
                                        return (
                                            <button
                                                key={asset.value}
                                                onClick={() => toggleTempAsset(asset.value)}
                                                className={`p-3 rounded-xl border-2 transition-all text-center ${
                                                    isSelected 
                                                        ? isDarkMode 
                                                            ? 'bg-teal-900/30 border-teal-500 text-teal-300'
                                                            : 'bg-teal-50 border-teal-500 text-teal-700'
                                                        : isDarkMode
                                                            ? 'bg-slate-700 border-slate-600 text-slate-400'
                                                            : 'bg-slate-50 border-slate-200 text-slate-600'
                                                }`}
                                            >
                                                <span className="text-xs font-bold">{asset.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Wallets Section */}
                            <div>
                                <h3 className={`text-sm font-black uppercase mb-4 ${
                                    isDarkMode ? 'text-slate-100' : 'text-slate-800'
                                }`}>Wallets</h3>
                                <div className="space-y-3">
                                    {accounts.map((account) => {
                                        const isSelected = tempWalletsRef.current.includes(account);
                                        return (
                                            <button
                                                key={account}
                                                onClick={() => toggleTempWallet(account)}
                                                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                                                    isSelected 
                                                        ? isDarkMode 
                                                            ? 'bg-teal-900/30 border-teal-500'
                                                            : 'bg-teal-50 border-teal-500'
                                                        : isDarkMode
                                                            ? 'bg-slate-700 border-slate-600'
                                                            : 'bg-slate-50 border-slate-200'
                                                }`}
                                            >
                                                <span className={`text-sm font-bold ${
                                                    isSelected 
                                                        ? isDarkMode ? 'text-teal-300' : 'text-teal-700'
                                                        : isDarkMode ? 'text-slate-400' : 'text-slate-600'
                                                }`}>
                                                    {account}
                                                </span>
                                                {isSelected && (
                                                    <div className="w-5 h-5 bg-teal-600 rounded flex items-center justify-center">
                                                        <Check size={14} className="text-white" />
                                                    </div>
                                                )}
                                                {!isSelected && (
                                                    <div className={`w-5 h-5 border-2 rounded ${
                                                        isDarkMode ? 'border-slate-500' : 'border-slate-300'
                                                    }`} />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Phase 5: Show Fully Sold Assets Toggle */}
                            <div>
                                <h3 className={`text-sm font-black uppercase mb-4 ${
                                    isDarkMode ? 'text-slate-100' : 'text-slate-800'
                                }`}>Display Options</h3>
                                <button
                                    onClick={() => setShowFullySoldAssets && setShowFullySoldAssets(!showFullySoldAssets)}
                                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                                        showFullySoldAssets 
                                            ? isDarkMode 
                                                ? 'bg-teal-900/30 border-teal-500'
                                                : 'bg-teal-50 border-teal-500'
                                            : isDarkMode
                                                ? 'bg-slate-700 border-slate-600'
                                                : 'bg-slate-50 border-slate-200'
                                    }`}
                                >
                                    <div className="flex flex-col items-start">
                                        <span className={`text-sm font-bold ${
                                            showFullySoldAssets 
                                                ? isDarkMode ? 'text-teal-300' : 'text-teal-700'
                                                : isDarkMode ? 'text-slate-400' : 'text-slate-600'
                                        }`}>
                                            Show Fully Sold Assets
                                        </span>
                                        <span className={`text-xs mt-1 ${
                                            isDarkMode ? 'text-slate-500' : 'text-slate-500'
                                        }`}>
                                            Display assets with 0 holdings
                                        </span>
                                    </div>
                                    <div className={`w-12 h-6 rounded-full transition-all ${
                                        showFullySoldAssets 
                                            ? 'bg-teal-600' 
                                            : isDarkMode ? 'bg-slate-600' : 'bg-slate-300'
                                    }`}>
                                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                                            showFullySoldAssets ? 'translate-x-6' : 'translate-x-0.5'
                                        } mt-0.5`} />
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className={`p-6 border-t space-y-3 flex-shrink-0 ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                            <button
                                onClick={applyFilters}
                                className={`w-full py-4 bg-teal-600 text-white rounded-2xl font-black text-sm active:bg-teal-700 transition-all ${
                                    isDarkMode ? '' : 'shadow-lg shadow-teal-200'
                                }`}
                            >
                                Apply Filters
                            </button>
                            <button
                                onClick={clearFilters}
                                className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                                    isDarkMode 
                                        ? 'bg-slate-700 text-slate-300 active:bg-slate-600' 
                                        : 'bg-slate-100 text-slate-600 active:bg-slate-200'
                                }`}
                            >
                                Clear All Filters
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
};

export default MobilePortfolioView;
