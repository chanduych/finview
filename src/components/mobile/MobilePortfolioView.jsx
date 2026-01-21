import React, { useState } from 'react';
import { RefreshCw, Search, Filter, X, Check } from 'lucide-react';
import MobileAssetCard from '../MobileAssetCard';
import MobilePortfolioSummaryCard from './MobilePortfolioSummaryCard';
import MobileEmptyState from './MobileEmptyState';

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
    setActiveAccounts
}) => {
    const [showFilters, setShowFilters] = useState(false);
    const [showFilterSheet, setShowFilterSheet] = useState(false);
    const [tempSelectedWallets, setTempSelectedWallets] = useState(activeAccounts);
    const [tempSelectedAssets, setTempSelectedAssets] = useState(
        selectedView === 'ALL' ? ['STOCK', 'MF', 'ETF'] : [selectedView]
    );

    // Check if portfolio is empty
    const isEmptyPortfolio = filteredPortfolio.length === 0 && !tableFilter && selectedView === 'ALL';

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Mobile Header - Compact */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-lg font-black text-slate-800">
                                My Portfolio
                            </h1>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                Chandu's Investments
                            </p>
                        </div>
                        <button
                            onClick={onRefresh}
                            disabled={isRefreshing}
                            className={`p-3 rounded-xl bg-indigo-50 text-indigo-600 active:bg-indigo-100 transition-all ${
                                isRefreshing ? 'animate-spin' : ''
                            }`}
                        >
                            <RefreshCw size={20} />
                        </button>
                    </div>
                </div>

                {/* Search & Filter Bar */}
                <div className="px-4 pb-3">
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search assets..."
                                value={tableFilter}
                                onChange={(e) => setTableFilter(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                        <button
                            onClick={() => setShowFilterSheet(true)}
                            className={`p-3 rounded-xl border transition-all ${
                                (activeAccounts.length < accounts.length) || (selectedView !== 'ALL')
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}
                        >
                            <Filter size={20} />
                        </button>
                    </div>

                </div>
            </div>

            {/* Portfolio Cards - Scrollable */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {/* Show Empty State */}
                {isEmptyPortfolio ? (
                    <MobileEmptyState onAddAsset={onQuickAdd} />
                ) : (
                    <>
                        {/* Portfolio Summary Card - Only show if has holdings */}
                        {filteredPortfolio.length > 0 && selectedView === 'ALL' && !tableFilter && (
                            <MobilePortfolioSummaryCard stats={stats} />
                        )}

                        {/* Asset Cards */}
                        {selectedView === 'ALL' ? (
                            // Grouped View
                            Object.keys(groupedPortfolio).length === 0 ? (
                                <div className="text-center py-20">
                                    <p className="text-slate-400 text-sm">No assets found</p>
                                </div>
                            ) : (
                        Object.entries(groupedPortfolio).map(([type, items]) => {
                            const isExpanded = expandedGroups.includes(type);
                            const typeLabels = {
                                'STOCK': 'Stocks',
                                'MF': 'Mutual Funds',
                                'ETF': 'ETFs'
                            };

                            // Calculate group totals
                            const totalPnL = items.reduce((sum, item) => sum + item.absReturn, 0);
                            const totalDayChange = items.reduce((sum, item) => sum + item.dayChange, 0);
                            const totalValue = items.reduce((sum, item) => sum + item.currentValue, 0);
                            const totalInvested = items.reduce((sum, item) => sum + (item.investedValue || 0), 0);
                            const totalDayChangePercent = totalValue - totalDayChange > 0 
                                ? (totalDayChange / (totalValue - totalDayChange)) * 100 
                                : 0;
                            const totalReturnPercent = totalInvested > 0 
                                ? (totalPnL / totalInvested) * 100 
                                : 0;

                            return (
                                <div key={type} className="space-y-3">
                                    {/* Header Card with Integrated Totals */}
                                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                                        {/* Header Section */}
                                        <button
                                            onClick={() => toggleGroupExpansion(type)}
                                            className="w-full p-4 active:bg-slate-50 transition-all"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-black text-slate-800 uppercase">
                                                    {typeLabels[type]} ({items.length})
                                                </span>
                                                <span className="text-xs text-slate-500">
                                                    {isExpanded ? '▼' : '▶'}
                                                </span>
                                            </div>
                                        </button>

                                        {/* Totals Summary - Shown when expanded for STOCK and MF */}
                                        {isExpanded && (type === 'STOCK' || type === 'MF') && (
                                            <div className="px-4 pb-4 border-t border-slate-100 pt-4">
                                                <div className="flex items-center justify-between mb-4">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase">
                                                        Total {typeLabels[type]}
                                                    </p>
                                                    {/* Improved Toggle Button */}
                                                    <div className="flex items-center bg-slate-100 rounded-lg p-1">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (setPnlView && pnlView !== 'total') {
                                                                    setPnlView('total');
                                                                }
                                                            }}
                                                            className={`px-3 py-1.5 rounded-md transition-all text-[9px] font-black uppercase min-w-[50px] ${
                                                                pnlView === 'total'
                                                                    ? 'bg-white text-slate-800 shadow-sm'
                                                                    : 'text-slate-600'
                                                            }`}
                                                        >
                                                            Total
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (setPnlView && pnlView !== '1day') {
                                                                    setPnlView('1day');
                                                                }
                                                            }}
                                                            className={`px-3 py-1.5 rounded-md transition-all text-[9px] font-black uppercase min-w-[50px] ${
                                                                pnlView === '1day'
                                                                    ? 'bg-white text-slate-800 shadow-sm'
                                                                    : 'text-slate-600'
                                                            }`}
                                                        >
                                                            1D
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Details Grid - All metrics in one clean grid */}
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="bg-slate-50 p-3 rounded-xl">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">
                                                            Total Value
                                                        </p>
                                                        <p className="text-base font-black text-slate-800">
                                                            {formatCurrency(totalValue)}
                                                        </p>
                                                    </div>
                                                    <div className="bg-slate-50 p-3 rounded-xl">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">
                                                            Invested
                                                        </p>
                                                        <p className="text-base font-black text-slate-600">
                                                            {formatCurrency(totalInvested)}
                                                        </p>
                                                    </div>
                                                    <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-3 rounded-xl">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">
                                                            {pnlView === 'total' ? 'Total P&L' : '1-Day Change'}
                                                        </p>
                                                        {pnlView === 'total' ? (
                                                            <p className={`text-base font-black ${
                                                                totalPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                                            }`}>
                                                                {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)}
                                                            </p>
                                                        ) : (
                                                            <p className={`text-base font-black ${
                                                                totalDayChange >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                                            }`}>
                                                                {totalDayChange >= 0 ? '+' : ''}{formatCurrency(totalDayChange)}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="bg-slate-50 p-3 rounded-xl">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">
                                                            {pnlView === 'total' ? 'Return %' : '1D Change %'}
                                                        </p>
                                                        {pnlView === 'total' ? (
                                                            <p className={`text-base font-black ${
                                                                totalReturnPercent >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                                            }`}>
                                                                {totalReturnPercent >= 0 ? '+' : ''}{totalReturnPercent.toFixed(2)}%
                                                            </p>
                                                        ) : (
                                                            <p className={`text-base font-black ${
                                                                totalDayChangePercent >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                                            }`}>
                                                                {totalDayChangePercent >= 0 ? '+' : ''}{totalDayChangePercent.toFixed(2)}%
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Individual Items - Shown when expanded */}
                                    {isExpanded && items.map((item) => (
                                        <MobileAssetCard
                                            key={item.id}
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
                                    ))}

                                    {/* Totals Section - Always visible for ETF */}
                                    {isExpanded && type === 'ETF' && (
                                        <div className="bg-white p-4 rounded-2xl border border-slate-200">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">
                                                        Total {typeLabels[type]}
                                                    </p>
                                                    {pnlView === 'total' ? (
                                                        <p className={`text-lg font-black ${
                                                            totalPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                                        }`}>
                                                            {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)}
                                                        </p>
                                                    ) : (
                                                        <p className={`text-lg font-black ${
                                                            totalDayChange >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                                        }`}>
                                                            {totalDayChange >= 0 ? '+' : ''}{formatCurrency(totalDayChange)}
                                                        </p>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (setPnlView) {
                                                            setPnlView(pnlView === 'total' ? '1day' : 'total');
                                                        }
                                                    }}
                                                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 rounded-lg transition-all min-h-[40px]"
                                                >
                                                    <span className="text-[9px] font-black text-slate-700 uppercase whitespace-nowrap">
                                                        {pnlView === 'total' ? '📊 Total' : '📈 1-Day'}
                                                    </span>
                                                    <span className="text-xs text-slate-400">⇄</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )
                ) : (
                    // Flat View
                    filteredPortfolio.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-slate-400 text-sm">No assets found</p>
                        </div>
                    ) : (
                        filteredPortfolio.map((item) => (
                            <MobileAssetCard
                                key={item.id}
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
                        ))
                    )
                )}
                    </>
                )}
            </div>

            {/* Filter Bottom Sheet */}
            {showFilterSheet && (
                <div className="fixed inset-0 z-[200] flex items-end bg-slate-900/60 backdrop-blur-md animate-in fade-in">
                    <div className="bg-white w-full rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
                            <h2 className="text-xl font-black text-slate-800">Filter Portfolio</h2>
                            <button
                                onClick={() => setShowFilterSheet(false)}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Wallets Section */}
                            <div>
                                <h3 className="text-sm font-black text-slate-800 uppercase mb-4">Wallets</h3>
                                <div className="space-y-3">
                                    {accounts.map((account) => {
                                        const isSelected = tempSelectedWallets.includes(account);
                                        return (
                                            <button
                                                key={account}
                                                onClick={() => {
                                                    if (isSelected) {
                                                        setTempSelectedWallets(prev => prev.filter(a => a !== account));
                                                    } else {
                                                        setTempSelectedWallets(prev => [...prev, account]);
                                                    }
                                                }}
                                                className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-xl border-2 transition-all active:bg-slate-100"
                                                style={{ borderColor: isSelected ? '#4f46e5' : '#e2e8f0' }}
                                            >
                                                <span className="text-sm font-bold text-slate-800">{account}</span>
                                                {isSelected && (
                                                    <div className="w-5 h-5 bg-indigo-600 rounded flex items-center justify-center">
                                                        <Check size={14} className="text-white" />
                                                    </div>
                                                )}
                                                {!isSelected && (
                                                    <div className="w-5 h-5 border-2 border-slate-300 rounded" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Assets Section */}
                            <div>
                                <h3 className="text-sm font-black text-slate-800 uppercase mb-4">Assets</h3>
                                <div className="space-y-3">
                                    {[
                                        { value: 'STOCK', label: 'Stocks' },
                                        { value: 'MF', label: 'Mutual Funds' },
                                        { value: 'ETF', label: 'ETFs' }
                                    ].map((asset) => {
                                        const isSelected = tempSelectedAssets.includes(asset.value);
                                        return (
                                            <button
                                                key={asset.value}
                                                onClick={() => {
                                                    if (isSelected) {
                                                        setTempSelectedAssets(prev => prev.filter(a => a !== asset.value));
                                                    } else {
                                                        setTempSelectedAssets(prev => [...prev, asset.value]);
                                                    }
                                                }}
                                                className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-xl border-2 transition-all active:bg-slate-100"
                                                style={{ borderColor: isSelected ? '#4f46e5' : '#e2e8f0' }}
                                            >
                                                <span className="text-sm font-bold text-slate-800">{asset.label}</span>
                                                {isSelected && (
                                                    <div className="w-5 h-5 bg-indigo-600 rounded flex items-center justify-center">
                                                        <Check size={14} className="text-white" />
                                                    </div>
                                                )}
                                                {!isSelected && (
                                                    <div className="w-5 h-5 border-2 border-slate-300 rounded" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 border-t border-slate-200 space-y-3 flex-shrink-0">
                            <button
                                onClick={() => {
                                    // Apply filters
                                    if (setActiveAccounts) {
                                        setActiveAccounts(tempSelectedWallets);
                                    }
                                    if (tempSelectedAssets.length === 1) {
                                        setSelectedView(tempSelectedAssets[0]);
                                    } else if (tempSelectedAssets.length === 3) {
                                        setSelectedView('ALL');
                                    } else {
                                        // Multiple but not all - keep current view or set to first selected
                                        setSelectedView(tempSelectedAssets[0] || 'ALL');
                                    }
                                    setShowFilterSheet(false);
                                }}
                                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-200 active:bg-indigo-700 transition-all"
                            >
                                Apply
                            </button>
                            <button
                                onClick={() => {
                                    // Clear filters
                                    setTempSelectedWallets(accounts);
                                    setTempSelectedAssets(['STOCK', 'MF', 'ETF']);
                                    if (setActiveAccounts) {
                                        setActiveAccounts(accounts);
                                    }
                                    setSelectedView('ALL');
                                    setShowFilterSheet(false);
                                }}
                                className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm active:bg-slate-200 transition-all"
                            >
                                Clear filters
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
