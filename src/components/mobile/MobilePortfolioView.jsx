import React, { useState } from 'react';
import { RefreshCw, Search, Filter } from 'lucide-react';
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
    onQuickAdd
}) => {
    const [showFilters, setShowFilters] = useState(false);

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
                            onClick={() => setShowFilters(!showFilters)}
                            className={`p-3 rounded-xl border transition-all ${
                                showFilters
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}
                        >
                            <Filter size={20} />
                        </button>
                    </div>

                    {/* Filter Chips */}
                    {showFilters && (
                        <div className="flex gap-2 mt-3 overflow-x-auto hide-scrollbar pb-1">
                            {['ALL', 'STOCK', 'MF', 'ETF', 'CASH'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setSelectedView(type)}
                                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase whitespace-nowrap transition-all ${
                                        selectedView === type
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                            : 'bg-white text-slate-600 border border-slate-200 active:bg-slate-50'
                                    }`}
                                >
                                    {type === 'ALL' ? 'All Assets' :
                                     type === 'STOCK' ? 'Stocks' :
                                     type === 'MF' ? 'Mutual Funds' :
                                     type === 'ETF' ? 'ETFs' : 'Cash'}
                                </button>
                            ))}
                        </div>
                    )}
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
                                'ETF': 'ETFs',
                                'CASH': 'Cash'
                            };

                            // Calculate group totals
                            const totalPnL = items.reduce((sum, item) => sum + item.absReturn, 0);
                            const totalDayChange = items.reduce((sum, item) => sum + item.dayChange, 0);

                            return (
                                <div key={type} className="space-y-3">
                                    <div className="bg-white p-4 rounded-2xl border border-slate-200">
                                        <button
                                            onClick={() => toggleGroupExpansion(type)}
                                            className="w-full active:bg-slate-50 transition-all"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-black text-slate-800 uppercase">
                                                    {typeLabels[type]} ({items.length})
                                                </span>
                                                <span className="text-xs text-slate-500">
                                                    {isExpanded ? 'Collapse' : 'Expand'}
                                                </span>
                                            </div>
                                        </button>

                                        {/* Group Total with Toggle */}
                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
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
