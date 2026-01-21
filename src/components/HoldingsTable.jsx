import React from 'react';
import {
    Search, Activity, Building2, TrendingUp, Wallet, Layers,
    ChevronUp, ChevronDown
} from 'lucide-react';
import AssetRow from './AssetRow';
import MobileAssetCard from './MobileAssetCard';
import { formatCurrency } from '../utils/formatters';
import xirr from 'xirr';

/**
 * HoldingsTable Component - Main table wrapper with grouped view logic
 *
 * Mobile-Responsive Features (CRITICAL):
 * - Horizontal scroll wrapper for table on mobile
 * - Responsive column visibility using hidden md:table-cell
 * - Reduced padding on mobile (px-3 md:px-6 lg:px-8)
 * - Responsive text sizes
 * - Sticky header maintained
 * - Min-width on table to prevent column crushing
 *
 * @param {Object} props
 * @param {string} props.selectedView - Current view ('ALL' or specific type)
 * @param {Array} props.groupedPortfolio - Portfolio grouped by type
 * @param {Array} props.filteredPortfolio - Filtered flat portfolio
 * @param {Array<string>} props.expandedGroups - List of expanded group types
 * @param {Function} props.setExpandedGroups - Function to update expanded groups
 * @param {string|null} props.expandedAsset - ID of currently expanded asset
 * @param {Function} props.setExpandedAsset - Function to set expanded asset
 * @param {Object} props.marketPrices - Market prices lookup
 * @param {Function} props.setMarketPrices - Function to update market prices
 * @param {string|null} props.editingId - ID of asset being edited
 * @param {Function} props.setEditingId - Function to set editing ID
 * @param {string} props.editValue - Current edit value
 * @param {Function} props.setEditValue - Function to set edit value
 * @param {string|null} props.assetMenuOpen - ID of asset with open menu
 * @param {Function} props.setAssetMenuOpen - Function to set open menu
 * @param {Function} props.setAssetToDelete - Function to set asset for deletion
 * @param {Object|null} props.editingTransaction - Currently editing transaction
 * @param {Function} props.setEditingTransaction - Function to set editing transaction
 * @param {Array} props.portfolio - Full portfolio array
 * @param {Function} props.setPortfolio - Function to update portfolio
 * @param {Function} props.xirr - XIRR calculation function
 */
const HoldingsTable = ({
    selectedView,
    groupedPortfolio,
    filteredPortfolio,
    expandedGroups,
    toggleGroupExpansion,
    expandedAsset,
    setExpandedAsset,
    assetMenuOpen,
    setAssetMenuOpen,
    editingId,
    setEditingId,
    editValue,
    setEditValue,
    editingTransaction,
    setEditingTransaction,
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
    formatCurrencyWithDecimals,
    portfolio,
    setPortfolio,
    marketPrices,
    setMarketPrices
}) => {
    const typeLabels = {
        'STOCK': { label: 'Stocks', icon: Activity, color: 'indigo' },
        'MF': { label: 'Mutual Funds', icon: Building2, color: 'emerald' },
        'ETF': { label: 'ETFs', icon: TrendingUp, color: 'purple' }
    };

    const toggleGroup = (type) => {
        if (toggleGroupExpansion) {
            toggleGroupExpansion(type);
        }
    };

    const calculateGroupXIRR = (items) => {
        if (!items || items.length === 0) {
            return null;
        }

        try {
            const allTransactions = [];
            let totalValue = 0;

            items.forEach(item => {
                if (item.transactions && Array.isArray(item.transactions) && item.transactions.length > 0) {
                    item.transactions.forEach(tx => {
                        if (tx.date && tx.quantity && tx.price) {
                            const date = new Date(tx.date);
                            if (!isNaN(date.getTime())) {
                                allTransactions.push({
                                    amount: -(tx.quantity * tx.price),
                                    when: date
                                });
                            }
                        }
                    });
                }
                if (item.currentValue && !isNaN(item.currentValue)) {
                    totalValue += item.currentValue;
                }
            });

            // Need at least one transaction and positive current value
            if (totalValue <= 0 || allTransactions.length === 0) {
                return null;
            }

            // Add the current value as inflow
            allTransactions.push({
                amount: totalValue,
                when: new Date()
            });

            // Sort by date
            allTransactions.sort((a, b) => a.when - b.when);

            // Check if transactions span at least one day
            const firstDate = allTransactions[0].when.getTime();
            const lastDate = allTransactions[allTransactions.length - 1].when.getTime();
            const daysDifference = (lastDate - firstDate) / (1000 * 60 * 60 * 24);

            if (daysDifference < 1) {
                // All transactions on same day, XIRR not meaningful
                return null;
            }

            try {
                // Get xirr function
                const xirrFunc = typeof xirr === 'function' ? xirr : xirr.default || xirr.xirr;

                if (!xirrFunc || typeof xirrFunc !== 'function') {
                    console.error('XIRR function not available');
                    return null;
                }

                const result = xirrFunc(allTransactions);

                if (result !== null && result !== undefined && !isNaN(result) && isFinite(result)) {
                    return result * 100;
                }

                return null;
            } catch (e) {
                console.error('XIRR calculation failed for group:', e.message, 'Transactions:', allTransactions.length);
                return null;
            }
        } catch (e) {
            console.error('Group XIRR outer error:', e);
            return null;
        }
    };

    const renderEmptyState = () => (
        <tr>
            <td colSpan="5" className="px-4 md:px-8 py-12 md:py-20 text-center text-slate-400 italic font-medium">
                <div className="flex flex-col items-center gap-2">
                    <Search size={40} className="text-slate-200" />
                    <p className="text-sm md:text-base">No assets match current filters.</p>
                </div>
            </td>
        </tr>
    );

    const renderGroupedView = () => {
        if (Object.keys(groupedPortfolio).length === 0) {
            return renderEmptyState();
        }

        return Object.entries(groupedPortfolio).map(([type, items]) => {
            const typeInfo = typeLabels[type] || { label: type, icon: Layers, color: 'slate' };
            const Icon = typeInfo.icon;
            const isExpanded = expandedGroups.includes(type);

            // Calculate group-level statistics
            const totalInvested = items.reduce((sum, item) => sum + item.investedValue, 0);
            const totalValue = items.reduce((sum, item) => sum + item.currentValue, 0);
            const totalReturn = totalValue - totalInvested;
            const totalROI = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;
            const groupXIRR = calculateGroupXIRR(items);

            return (
                <React.Fragment key={type}>
                    {/* Group Header */}
                    <tr
                        className="bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                        onClick={() => toggleGroup(type)}
                    >
                        <td colSpan="5" className="px-4 md:px-6 lg:px-8 py-3 md:py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 md:gap-3">
                                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl bg-${typeInfo.color}-100 text-${typeInfo.color}-600 flex items-center justify-center shrink-0`}>
                                        <Icon size={18} className="md:hidden" />
                                        <Icon size={20} className="hidden md:block" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-black text-slate-800 text-xs md:text-sm uppercase tracking-tight">
                                                {typeInfo.label} ({items.length})
                                            </h4>
                                            {isExpanded ? (
                                                <ChevronUp size={14} className="text-slate-400 shrink-0 md:w-4 md:h-4" />
                                            ) : (
                                                <ChevronDown size={14} className="text-slate-400 shrink-0 md:w-4 md:h-4" />
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-1">
                                            <p className="text-[9px] text-slate-400 font-bold whitespace-nowrap">
                                                Invested: <span className="text-slate-600">{formatCurrency(totalInvested)}</span>
                                            </p>
                                            <p className="text-[9px] text-slate-400 font-bold whitespace-nowrap">
                                                Value: <span className="text-slate-600">{formatCurrency(totalValue)}</span>
                                            </p>
                                            <p className={`text-[9px] font-bold whitespace-nowrap ${totalROI >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                ROI: <span>{totalROI >= 0 ? '+' : ''}{totalROI.toFixed(2)}%</span>
                                            </p>
                                            {groupXIRR !== null ? (
                                                <p className={`text-[9px] font-bold whitespace-nowrap ${groupXIRR >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    XIRR: <span>{groupXIRR >= 0 ? '+' : ''}{groupXIRR.toFixed(2)}%</span>
                                                </p>
                                            ) : (
                                                <p className="text-[9px] text-slate-300 font-bold whitespace-nowrap">
                                                    XIRR: N/A
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </td>
                    </tr>
                    {/* Group Items */}
                    {isExpanded && items.map((item) => (
                        <AssetRow
                            key={item.id}
                            item={item}
                            pnlView={pnlView}
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
                            onUpdateAsset={onUpdateAsset}
                            onDeleteAsset={onDeleteAsset}
                            onAddTransaction={onAddTransaction}
                            onUpdateTransaction={onUpdateTransaction}
                            onDeleteTransaction={onDeleteTransaction}
                            onAddDividend={onAddDividend}
                            onDeleteDividend={onDeleteDividend}
                            formatCurrency={formatCurrency}
                            formatCurrencyWithDecimals={formatCurrencyWithDecimals}
                            portfolio={portfolio}
                            setPortfolio={setPortfolio}
                        />
                    ))}
                </React.Fragment>
            );
        });
    };

    const renderFlatView = () => {
        if (filteredPortfolio.length === 0) {
            return renderEmptyState();
        }

        return filteredPortfolio.map((item) => (
            <AssetRow
                key={item.id}
                item={item}
                pnlView={pnlView}
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
                onUpdateAsset={onUpdateAsset}
                onDeleteAsset={onDeleteAsset}
                onAddTransaction={onAddTransaction}
                onUpdateTransaction={onUpdateTransaction}
                onDeleteTransaction={onDeleteTransaction}
                onAddDividend={onAddDividend}
                onDeleteDividend={onDeleteDividend}
                formatCurrency={formatCurrency}
                formatCurrencyWithDecimals={formatCurrencyWithDecimals}
                portfolio={portfolio}
                setPortfolio={setPortfolio}
            />
        ));
    };

    // Mobile Card View
    const renderMobileCards = () => {
        if (filteredPortfolio.length === 0) {
            return (
                <div className="text-center py-12">
                    <Search size={40} className="text-slate-200 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">No assets match current filters.</p>
                </div>
            );
        }

        return (
            <div className="space-y-3">
                {filteredPortfolio.map((item) => (
                    <MobileAssetCard
                        key={item.id}
                        item={item}
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
    };

    const renderMobileGroupedCards = () => {
        if (Object.keys(groupedPortfolio).length === 0) {
            return (
                <div className="text-center py-12">
                    <Search size={40} className="text-slate-200 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">No assets match current filters.</p>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {Object.entries(groupedPortfolio).map(([type, items]) => {
                    const typeInfo = typeLabels[type] || { label: type, icon: Layers, color: 'slate' };
                    const Icon = typeInfo.icon;
                    const isExpanded = expandedGroups.includes(type);

                    // Calculate group-level statistics
                    const totalInvested = items.reduce((sum, item) => sum + item.investedValue, 0);
                    const totalValue = items.reduce((sum, item) => sum + item.currentValue, 0);
                    const totalReturn = totalValue - totalInvested;
                    const totalROI = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;
                    const groupXIRR = calculateGroupXIRR(items);

                    return (
                        <div key={type} className="space-y-3">
                            {/* Group Header */}
                            <div
                                onClick={() => toggleGroup(type)}
                                className="bg-slate-50 p-4 rounded-2xl border border-slate-200 active:bg-slate-100 transition-colors"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl bg-${typeInfo.color}-100 text-${typeInfo.color}-600 flex items-center justify-center`}>
                                            <Icon size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-800 text-sm uppercase">
                                                {typeInfo.label} ({items.length})
                                            </h4>
                                        </div>
                                    </div>
                                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[10px]">
                                    <div>
                                        <span className="text-slate-400 font-bold">Invested: </span>
                                        <span className="text-slate-700 font-black">{formatCurrency(totalInvested)}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 font-bold">Value: </span>
                                        <span className="text-slate-700 font-black">{formatCurrency(totalValue)}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 font-bold">ROI: </span>
                                        <span className={`font-black ${totalROI >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {totalROI >= 0 ? '+' : ''}{totalROI.toFixed(2)}%
                                        </span>
                                    </div>
                                    {groupXIRR !== null && (
                                        <div>
                                            <span className="text-slate-400 font-bold">XIRR: </span>
                                            <span className={`font-black ${groupXIRR >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {groupXIRR >= 0 ? '+' : ''}{groupXIRR.toFixed(2)}%
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Group Items */}
                            {isExpanded && (
                                <div className="space-y-3">
                                    {items.map((item) => (
                                        <MobileAssetCard
                                            key={item.id}
                                            item={item}
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
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <>
            {/* Mobile View - Card Layout (< md breakpoint) */}
            <div className="md:hidden">
                {selectedView === 'ALL' ? renderMobileGroupedCards() : renderMobileCards()}
            </div>

            {/* Desktop View - Table Layout (>= md breakpoint) */}
            <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-24rem)]">
                    <table className="w-full min-w-[800px] text-left">
                        <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100 sticky top-0 z-10">
                            <tr>
                                <th className="px-3 md:px-6 lg:px-8 py-4 md:py-5 bg-slate-50">Security</th>
                                <th className="px-3 md:px-6 py-4 md:py-5 text-right bg-slate-50">Qty & Avg</th>
                                <th className="px-3 md:px-6 py-4 md:py-5 text-right bg-slate-50">
                                    <span className="hidden sm:inline">LTP (Edit)</span>
                                    <span className="sm:hidden">LTP</span>
                                </th>
                                <th className="px-3 md:px-6 py-4 md:py-5 text-right bg-slate-50">
                                    <button
                                        onClick={() => setPnlView(pnlView === 'total' ? '1day' : 'total')}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 rounded-lg transition-all cursor-pointer ml-auto"
                                        title="Toggle between Total P&L and 1-Day Change"
                                    >
                                        <span className="text-[9px] font-black text-slate-700 uppercase whitespace-nowrap">
                                            {pnlView === 'total' ? '📊 Total P&L' : '📈 1-Day'}
                                        </span>
                                        <span className="text-[10px] text-slate-400">⇄</span>
                                    </button>
                                </th>
                                <th className="px-3 md:px-6 lg:px-8 py-4 md:py-5 text-center bg-slate-50">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {selectedView === 'ALL' ? renderGroupedView() : renderFlatView()}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

export default HoldingsTable;
