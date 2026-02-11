import React, { useEffect, useRef } from 'react';
import {
    History, ChevronUp, MoreVertical, Trash2, Edit3,
    Plus, ShieldAlert, TrendingUp, TrendingDown
} from 'lucide-react';
import { formatCurrency, formatCurrencyWithDecimals } from '../utils/formatters';

/**
 * AssetRow Component - Individual asset row with expand/collapse
 *
 * Mobile-Responsive Features (CRITICAL):
 * - Responsive truncation: max-w-[120px] sm:max-w-[180px] md:max-w-[250px]
 * - Touch-friendly action icons: min-w-[44px] min-h-[44px]
 * - Expanded content: Mobile-friendly with proper padding
 * - Transaction table: Horizontally scrollable with overflow-x-auto
 * - Edit icons: Larger for touch (size={14} min)
 * - Responsive padding throughout
 * - Card-like layout for expanded section on mobile
 *
 * @param {Object} props
 * @param {Object} props.item - Asset item data
 * @param {string|null} props.expandedAsset - ID of currently expanded asset
 * @param {Function} props.setExpandedAsset - Function to set expanded asset
 * @param {string|null} props.assetMenuOpen - ID of asset with open menu
 * @param {Function} props.setAssetMenuOpen - Function to set open menu
 * @param {Object|null} props.editingTransaction - Currently editing transaction
 * @param {Function} props.setEditingTransaction - Function to set editing transaction
 * @param {Array} props.portfolio - Full portfolio array
 * @param {Function} props.setPortfolio - Function to update portfolio
 */
const AssetRow = ({
    item,
    pnlView = 'total',
    expandedAsset,
    setExpandedAsset,
    assetMenuOpen,
    setAssetMenuOpen,
    onDeleteAsset,
    onAddTransaction,
    onUpdateTransaction,
    onDeleteTransaction,
    onAddDividend,
    onDeleteDividend,
    editingTransaction,
    setEditingTransaction,
    portfolio,
    setPortfolio
}) => {
    const isExpanded = expandedAsset === item.id;

    const handleToggleExpand = () => {
        setExpandedAsset(isExpanded ? null : item.id);
    };


    const handleMenuToggle = (e) => {
        e.stopPropagation();
        setAssetMenuOpen(assetMenuOpen === item.id ? null : item.id);
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        if (onDeleteAsset) {
            onDeleteAsset(item);
        }
        setAssetMenuOpen(null);
    };

    const handleAddTransaction = () => {
        // Create a pending new transaction - NOT added to portfolio yet
        // Will be created when user clicks Save
        const pendingTx = {
            id: `pending-${Date.now()}`, // Mark as pending with special prefix
            type: 'BUY', // Default to BUY
            price: item.currentPrice || 0,
            quantity: 0,
            date: new Date().toISOString().split('T')[0],
            isPending: true // Flag to indicate this is a new transaction
        };
        setEditingTransaction({ ...pendingTx });
    };

    const handleSaveTransaction = (tx) => {
        if (!editingTransaction) return;
        
        const quantity = parseFloat(editingTransaction.quantity) || 0;
        const price = parseFloat(editingTransaction.price) || 0;
        // Preserve original transaction type when editing (don't allow changing type)
        const txType = editingTransaction.isPending 
            ? (editingTransaction.type || 'BUY') 
            : (tx.type || 'BUY');
        
        // Validate that we have meaningful data
        if (quantity <= 0 || price <= 0) {
            alert('Please enter valid quantity and price');
            return;
        }

        // Validate sell quantity against holdings
        if (txType === 'SELL') {
            const currentHoldings = item.totalQty || 0;
            if (quantity > currentHoldings) {
                alert(`Insufficient holdings. You only have ${currentHoldings.toLocaleString('en-IN', { maximumFractionDigits: 2 })} units.`);
                return;
            }
        }
        
        // Validate date is not in the future
        const txDate = new Date(editingTransaction.date);
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today
        if (txDate > today) {
            alert('Transaction date cannot be in the future');
            return;
        }
        
        // Check if this is a NEW transaction (pending) or an EXISTING one being edited
        if (editingTransaction.isPending) {
            // This is a new transaction - CREATE it
            const newTx = {
                id: Date.now(), // Fresh ID for new transaction
                type: txType,
                date: editingTransaction.date,
                quantity: quantity,
                price: price
            };
            if (onAddTransaction) {
                onAddTransaction(item.id, newTx);
            }
        } else {
            // This is an existing transaction - UPDATE it
            const updatedTx = {
                id: tx.id,
                type: txType,
                date: editingTransaction.date,
                quantity: quantity,
                price: price
            };
            if (onUpdateTransaction) {
                onUpdateTransaction(item.id, tx.id, updatedTx);
            }
        }
        setEditingTransaction(null);
    };

    const handleDeleteTransaction = async (tx) => {
        // Can't delete a pending transaction - just cancel edit
        if (editingTransaction?.isPending) {
            setEditingTransaction(null);
            return;
        }
        
        // Show confirmation dialog
        const confirmDelete = window.confirm(
            `Are you sure you want to delete this transaction?\n\nDate: ${new Date(tx.date).toLocaleDateString('en-IN')}\nQuantity: ${tx.quantity}\nPrice: ₹${tx.price.toFixed(2)}`
        );
        
        if (!confirmDelete) return;
        
        try {
            if (onDeleteTransaction) {
                await Promise.resolve(onDeleteTransaction(item, tx.id));
            }
            setEditingTransaction(null);
        } catch (err) {
            console.error('Error deleting transaction:', err);
            alert(err?.message || 'Failed to delete transaction. Please try again.');
        }
    };

    const handleAddDividend = () => {
        // Create a pending new dividend - NOT added to portfolio yet
        const pendingDiv = {
            id: `pending-div-${Date.now()}`,
            amount: '',
            date: new Date().toISOString().split('T')[0],
            divId: `pending-div-${Date.now()}`,
            isPendingDividend: true
        };
        setEditingTransaction(pendingDiv);
    };

    const handleSaveDividend = (div) => {
        if (!editingTransaction) return;
        
        const amount = typeof editingTransaction.amount === 'string'
            ? parseFloat(editingTransaction.amount) || 0
            : editingTransaction.amount;

        if (amount <= 0) {
            alert('Please enter a valid dividend amount');
            return;
        }
        
        // Validate date is not in the future
        const divDate = new Date(editingTransaction.date);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (divDate > today) {
            alert('Dividend date cannot be in the future');
            return;
        }

        // Check if this is a NEW dividend or EXISTING one
        if (editingTransaction.isPendingDividend) {
            // Create new dividend
            const newDiv = {
                id: Date.now(),
                date: editingTransaction.date,
                amount: amount
            };
            if (onAddDividend) {
                onAddDividend(item.id, newDiv);
            }
        } else {
            // Update existing dividend - delete old and add new
            const updatedDiv = {
                id: Date.now(), // New ID since we're replacing
                date: editingTransaction.date,
                amount: amount
            };
            if (onDeleteDividend && onAddDividend) {
                onDeleteDividend(item.id, div.id);
                onAddDividend(item.id, updatedDiv);
            }
        }
        setEditingTransaction(null);
    };

    const handleDeleteDividend = async (div) => {
        // Can't delete a pending dividend - just cancel
        if (editingTransaction?.isPendingDividend) {
            setEditingTransaction(null);
            return;
        }
        
        // Show confirmation dialog
        const confirmDelete = window.confirm(
            `Are you sure you want to delete this dividend?\n\nDate: ${div.date}\nAmount: ₹${div.amount.toFixed(2)}`
        );
        
        if (!confirmDelete) return;
        
        try {
            if (onDeleteDividend) {
                await Promise.resolve(onDeleteDividend(item.id, div.id));
            }
            setEditingTransaction(null);
        } catch (err) {
            console.error('Error deleting dividend:', err);
            alert(err?.message || 'Failed to delete dividend. Please try again.');
        }
    };

    return (
        <React.Fragment>
            {/* Main Row */}
            <tr
                onClick={handleToggleExpand}
                className={`hover:bg-indigo-50/30 transition-colors group cursor-pointer ${isExpanded ? 'bg-indigo-50/50' : ''}`}
            >
                {/* Security Column */}
                <td className="px-3 md:px-6 lg:px-8 py-4 md:py-6">
                    <div className="flex items-center gap-2 md:gap-3">
                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl ${
                            item.type === 'STOCK' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'
                        } flex items-center justify-center font-black text-xs shrink-0`}>
                            {item.symbol.substring(0, 2)}
                        </div>
                        <div className="min-w-0 max-w-[120px] sm:max-w-[180px] md:max-w-[250px]">
                            <div
                                className="font-black text-slate-800 uppercase tracking-tight truncate text-xs md:text-sm"
                                title={item.name || item.symbol}
                            >
                                {item.name || item.symbol}
                            </div>
                            <div className="flex items-center gap-1 md:gap-2 mt-0.5">
                                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest truncate">
                                    {item.account}
                                </div>
                                <div className="w-1 h-1 bg-slate-200 rounded-full shrink-0" />
                                <div className="text-[8px] text-slate-300 font-black uppercase truncate">
                                    {item.symbol}
                                </div>
                            </div>
                        </div>
                    </div>
                </td>

                {/* Quantity & Average Column */}
                <td className="px-3 md:px-6 py-4 md:py-6 text-right tabular-nums">
                    <div className="font-bold text-slate-700 text-xs md:text-sm">
                        {item.totalQty} <span className="hidden sm:inline">Units</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold">
                        @ ₹{item.avgPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                </td>

                {/* LTP Column */}
                <td className="px-3 md:px-6 py-4 md:py-6 text-right tabular-nums">
                    <div className="font-black text-slate-800 text-xs md:text-sm">
                        ₹{item.currentPrice?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                    <div className={`text-[10px] font-black ${
                        item.dayChangePercent >= 0 ? 'text-emerald-500' : 'text-rose-500'
                    }`}>
                        {item.dayChangePercent >= 0 ? '+' : ''}{item.dayChangePercent.toFixed(2)}%
                    </div>
                </td>

                {/* P&L Analysis Column - Toggleable */}
                <td className="px-3 md:px-6 py-4 md:py-6 text-right tabular-nums">
                    {pnlView === 'total' ? (
                        <>
                            <div className={`font-black text-xs md:text-sm ${
                                item.absReturn >= 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}>
                                {item.absReturn >= 0 ? '+' : ''}{formatCurrency(item.absReturn)}
                            </div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase">
                                {item.absReturnPercent >= 0 ? '+' : ''}{item.absReturnPercent.toFixed(2)}% ROI
                            </div>
                        </>
                    ) : (
                        <>
                            <div className={`font-black text-xs md:text-sm ${
                                item.dayChange >= 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}>
                                {item.dayChange >= 0 ? '+' : ''}{formatCurrency(item.dayChange)}
                            </div>
                            <div className={`text-[10px] font-bold uppercase ${
                                item.dayChangePercent >= 0 ? 'text-emerald-500' : 'text-rose-500'
                            }`}>
                                {item.dayChangePercent >= 0 ? '+' : ''}{item.dayChangePercent.toFixed(2)}%
                            </div>
                        </>
                    )}
                </td>

                {/* Actions Column */}
                <td className="px-3 md:px-6 lg:px-8 py-4 md:py-6 text-center">
                    <div className="flex items-center justify-center gap-1 md:gap-2 relative">
                        <button
                            onClick={handleToggleExpand}
                            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-300 hover:text-indigo-600 active:bg-indigo-50 rounded-lg transition-colors touch-manipulation"
                            title="View History"
                        >
                            {isExpanded ? <ChevronUp size={16} /> : <History size={16} />}
                        </button>
                        <div className="relative asset-menu-container">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleMenuToggle(e);
                                }}
                                className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-300 hover:text-slate-600 active:bg-slate-50 rounded-lg transition-colors touch-manipulation"
                                title="More Options"
                            >
                                <MoreVertical size={16} />
                            </button>
                            {assetMenuOpen === item.id && (
                                <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 min-w-[160px] overflow-hidden">
                                    <button
                                        onClick={handleDeleteClick}
                                        className="w-full px-4 py-3 min-h-[44px] text-left text-sm font-bold text-rose-600 hover:bg-rose-50 active:bg-rose-100 flex items-center gap-2 transition-colors touch-manipulation"
                                    >
                                        <Trash2 size={16} />
                                        Delete Asset
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </td>
            </tr>

            {/* Expanded Content Row */}
            {isExpanded && (
                <tr className="bg-slate-50/50">
                    <td colSpan="5" className="px-3 md:px-6 lg:px-8 py-3 md:py-4 border-b border-slate-100">
                        <div className="space-y-3 md:space-y-4">
                            {/* Summary Section */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4 mb-4 md:mb-6">
                                <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                        Invested
                                    </p>
                                    <p className="text-base md:text-lg font-black text-slate-800">
                                        {formatCurrency(item.investedValue)}
                                    </p>
                                </div>
                                <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                        Current
                                    </p>
                                    <p className="text-base md:text-lg font-black text-indigo-600">
                                        {formatCurrency(item.currentValue)}
                                    </p>
                                </div>
                                <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                        Returns
                                    </p>
                                    <p className={`text-base md:text-lg font-black ${
                                        item.absReturn >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                    }`}>
                                        {item.absReturn >= 0 ? '+' : ''}{formatCurrency(item.absReturn)}
                                    </p>
                                    <p className={`text-[10px] font-bold mt-1 ${
                                        item.absReturnPercent >= 0 ? 'text-emerald-500' : 'text-rose-500'
                                    }`}>
                                        {item.absReturnPercent >= 0 ? '+' : ''}{item.absReturnPercent.toFixed(2)}%
                                    </p>
                                </div>
                                <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                        XIRR
                                    </p>
                                    {item.xirr !== null && item.xirr !== undefined ? (
                                        <p className={`text-base md:text-lg font-black ${
                                            item.xirr >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                        }`}>
                                            {item.xirr >= 0 ? '+' : ''}{item.xirr.toFixed(2)}%
                                        </p>
                                    ) : (
                                        <div>
                                            <p className="text-sm font-bold text-slate-400">N/A</p>
                                            <p className="text-[8px] text-slate-300 mt-1">
                                                <span className="hidden md:inline">Check console</span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                        Tax Info
                                    </p>
                                    {item.capitalGains ? (
                                        <div className="space-y-1">
                                            <p className="text-xs font-black text-rose-500">
                                                STCG: {formatCurrency(item.capitalGains.stcg)}
                                            </p>
                                            <p className="text-xs font-black text-emerald-500">
                                                LTCG: {formatCurrency(item.capitalGains.ltcg)}
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-sm font-bold text-slate-400">No gains</p>
                                    )}
                                    {item.totalDividends > 0 && (
                                        <p className="text-xs font-black text-indigo-500 mt-1">
                                            Div: {formatCurrencyWithDecimals(item.totalDividends)}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* TAX INTELLIGENCE Section */}
                            <div className="bg-slate-50 p-3 md:p-4 rounded-xl border border-slate-200 shadow-sm mb-3 md:mb-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <ShieldAlert className="text-indigo-600" size={14} />
                                    <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                                        Tax Intelligence <span className="hidden md:inline">(India-Specific)</span>
                                    </h4>
                                </div>
                                <p className="text-[8px] font-bold text-slate-500 uppercase mb-2">
                                    Tax if sold today:
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {/* STCG Card */}
                                    {item.capitalGains && item.capitalGains.stcg > 0 ? (
                                        <div className="bg-white p-2.5 rounded-lg border border-orange-200">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <p className="text-[8px] font-black text-orange-600 uppercase">STCG</p>
                                                <p className="text-[7px] text-slate-400 font-bold">20%</p>
                                            </div>
                                            <p className="text-sm font-black text-orange-700">
                                                {formatCurrency(item.capitalGains.stcg * 0.20)}
                                            </p>
                                            <p className="text-[8px] text-slate-500 font-bold mt-0.5">
                                                Gain: {formatCurrency(item.capitalGains.stcg)}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <p className="text-[8px] font-black text-slate-400 uppercase">STCG</p>
                                                <p className="text-[7px] text-slate-300 font-bold">20%</p>
                                            </div>
                                            <p className="text-sm font-black text-slate-300">₹0</p>
                                            <p className="text-[8px] text-slate-400 font-bold mt-0.5">No gains</p>
                                        </div>
                                    )}

                                    {/* LTCG Card */}
                                    {item.capitalGains && item.capitalGains.ltcg > 0 ? (
                                        <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <p className="text-[8px] font-black text-emerald-600 uppercase">LTCG</p>
                                                <p className="text-[7px] text-slate-400 font-bold">12.5%</p>
                                            </div>
                                            {(() => {
                                                const ltcgExemption = 125000;
                                                const taxableLTCG = Math.max(0, item.capitalGains.ltcg - ltcgExemption);
                                                const ltcgTax = taxableLTCG * 0.125;
                                                const exemptionLeft = Math.max(0, ltcgExemption - item.capitalGains.ltcg);
                                                return (
                                                    <>
                                                        <p className="text-sm font-black text-emerald-700">
                                                            {formatCurrency(ltcgTax)}
                                                        </p>
                                                        <p className="text-[8px] text-slate-500 font-bold mt-0.5">
                                                            Gain: {formatCurrency(item.capitalGains.ltcg)}
                                                        </p>
                                                        {exemptionLeft > 0 ? (
                                                            <p className="text-[8px] text-emerald-600 font-bold mt-0.5">
                                                                Exempt: {formatCurrency(exemptionLeft)}
                                                            </p>
                                                        ) : (
                                                            <p className="text-[8px] text-slate-400 font-bold mt-0.5">
                                                                Exempt used
                                                            </p>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    ) : (
                                        <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <p className="text-[8px] font-black text-slate-400 uppercase">LTCG</p>
                                                <p className="text-[7px] text-slate-300 font-bold">12.5%</p>
                                            </div>
                                            <p className="text-sm font-black text-slate-300">₹0</p>
                                            <p className="text-[8px] text-slate-400 font-bold mt-0.5">No gains</p>
                                            <p className="text-[8px] text-emerald-600 font-bold mt-0.5">
                                                Exempt: ₹1,25,000
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Transaction History Header + Add Button */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-3">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    Transaction History ({item.transactions.length} {item.transactions.length === 1 ? 'transaction' : 'transactions'})
                                </p>
                                <button
                                    onClick={handleAddTransaction}
                                    className="px-3 py-1.5 min-h-[36px] bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase hover:bg-indigo-700 active:bg-indigo-800 transition-colors touch-manipulation flex items-center gap-1"
                                >
                                    <Plus size={12} />
                                    <span>Add Transaction</span>
                                </button>
                            </div>

                            {/* Transaction Table - CRITICAL: Horizontal scroll on mobile */}
                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                                    <table className="w-full min-w-[600px] text-left">
                                        <thead className="bg-slate-50 sticky top-0 z-10">
                                            <tr>
                                                <th className="px-3 md:px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                                    Date
                                                </th>
                                                <th className="px-3 md:px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">
                                                    Quantity
                                                </th>
                                                <th className="px-3 md:px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">
                                                    Buy Price
                                                </th>
                                                <th className="px-3 md:px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">
                                                    Invested
                                                </th>
                                                <th className="px-3 md:px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">
                                                    <span className="hidden sm:inline">Current Value</span>
                                                    <span className="sm:hidden">Value</span>
                                                </th>
                                                <th className="px-3 md:px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">
                                                    P&L
                                                </th>
                                                <th className="px-3 md:px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center w-20 whitespace-nowrap">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {/* Pending New Transaction Row */}
                                            {editingTransaction?.isPending && (
                                                <tr className="bg-indigo-50/50">
                                                    <td colSpan="7" className="px-3 md:px-4 py-4">
                                                        {/* Transaction Type Selector - Prominent at top */}
                                                        <div className="mb-3">
                                                            <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wide mb-2">
                                                                Transaction Type *
                                                            </label>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        e.preventDefault();
                                                                        setEditingTransaction({ ...editingTransaction, type: 'BUY' });
                                                                    }}
                                                                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all active:scale-95 min-h-[44px] ${
                                                                        (editingTransaction.type || 'BUY') === 'BUY'
                                                                            ? 'bg-teal-500 text-white shadow-md'
                                                                            : 'bg-white text-slate-600 border-2 border-slate-300 hover:border-teal-400 hover:bg-teal-50'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center justify-center gap-1.5">
                                                                        <TrendingUp size={14} />
                                                                        <span>Buy</span>
                                                                    </div>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        e.preventDefault();
                                                                        setEditingTransaction({ ...editingTransaction, type: 'SELL' });
                                                                    }}
                                                                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all active:scale-95 min-h-[44px] ${
                                                                        editingTransaction.type === 'SELL'
                                                                            ? 'bg-rose-500 text-white shadow-md'
                                                                            : 'bg-white text-slate-600 border-2 border-slate-300 hover:border-rose-400 hover:bg-rose-50'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center justify-center gap-1.5">
                                                                        <TrendingDown size={14} />
                                                                        <span>Sell</span>
                                                                    </div>
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Form Fields */}
                                                        <div className="space-y-3 bg-white p-4 rounded-lg border-2 border-slate-300 shadow-sm">

                                                            {/* Show holdings warning for sells */}
                                                            {editingTransaction.type === 'SELL' && (
                                                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
                                                                    <p className="text-[9px] font-bold text-amber-700">
                                                                        Current Holdings: <span className="font-black">{item.totalQty?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || 0}</span> units
                                                                    </p>
                                                                </div>
                                                            )}

                                                            <div className="grid grid-cols-3 gap-2">
                                                                <input
                                                                    type="date"
                                                                    value={editingTransaction.date}
                                                                    max={new Date().toISOString().split('T')[0]}
                                                                    onChange={e => setEditingTransaction({
                                                                        ...editingTransaction,
                                                                        date: e.target.value
                                                                    })}
                                                                    className="w-full min-h-[36px] px-2 py-1 text-[10px] border border-indigo-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 touch-manipulation bg-white"
                                                                />
                                                                <input
                                                                    type="number"
                                                                    inputMode="decimal"
                                                                    placeholder="Quantity"
                                                                    value={editingTransaction.quantity || ''}
                                                                    onChange={e => setEditingTransaction({
                                                                        ...editingTransaction,
                                                                        quantity: e.target.value
                                                                    })}
                                                                    className="w-full min-h-[36px] px-2 py-1 text-[10px] border border-indigo-300 rounded text-right focus:outline-none focus:ring-1 focus:ring-indigo-500 touch-manipulation bg-white"
                                                                />
                                                                <input
                                                                    type="number"
                                                                    inputMode="decimal"
                                                                    placeholder="Price"
                                                                    value={editingTransaction.price || ''}
                                                                    onChange={e => setEditingTransaction({
                                                                        ...editingTransaction,
                                                                        price: e.target.value
                                                                    })}
                                                                    className="w-full min-h-[36px] px-2 py-1 text-[10px] border border-indigo-300 rounded text-right focus:outline-none focus:ring-1 focus:ring-indigo-500 touch-manipulation bg-white"
                                                                />
                                                            </div>

                                                            {/* Preview for sells */}
                                                            {editingTransaction.type === 'SELL' && editingTransaction.quantity && editingTransaction.price && item.avgPrice && (
                                                                <div className="bg-white rounded-lg p-2 border border-slate-200">
                                                                    <p className="text-[9px] text-slate-500">Est. Realized P&L: </p>
                                                                    <p className={`text-xs font-black ${
                                                                        ((parseFloat(editingTransaction.price) - item.avgPrice) * (parseFloat(editingTransaction.quantity) || 0)) >= 0
                                                                            ? 'text-emerald-600'
                                                                            : 'text-rose-600'
                                                                    }`}>
                                                                        {((parseFloat(editingTransaction.price) - item.avgPrice) * (parseFloat(editingTransaction.quantity) || 0)) >= 0 ? '+' : ''}
                                                                        {formatCurrency((parseFloat(editingTransaction.price) - item.avgPrice) * (parseFloat(editingTransaction.quantity) || 0))}
                                                                    </p>
                                                                </div>
                                                            )}

                                                            <div className="flex gap-2 justify-end">
                                                                <button
                                                                    onClick={() => handleSaveTransaction(editingTransaction)}
                                                                    className="px-3 py-1 min-h-[36px] bg-emerald-600 text-white rounded text-[9px] font-bold hover:bg-emerald-700 touch-manipulation"
                                                                >
                                                                    Save
                                                                </button>
                                                                <button
                                                                    onClick={() => setEditingTransaction(null)}
                                                                    className="px-3 py-1 min-h-[36px] bg-slate-200 text-slate-600 rounded text-[9px] font-bold hover:bg-slate-300 touch-manipulation"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                            {/* Existing Transactions */}
                                            {[...item.transactions]
                                                .sort((a, b) => new Date(b.date) - new Date(a.date))
                                                .map((tx, idx) => {
                                                    const txType = tx.type || 'BUY';
                                                    const isSell = txType === 'SELL';
                                                    
                                                    // For BUY: unrealized P&L, For SELL: realized P&L
                                                    let txPnl, txPnlPercent;
                                                    if (isSell) {
                                                        // Find realized gain for this sell transaction
                                                        const realizedGainData = item.realizedGainsPerTransaction?.find(rg => rg.transaction.id === tx.id);
                                                        txPnl = realizedGainData?.realizedGain || 0;
                                                        txPnlPercent = tx.price > 0 ? ((tx.price - item.avgPrice) / item.avgPrice) * 100 : 0;
                                                    } else {
                                                        // BUY transaction - show unrealized P&L
                                                        txPnl = (item.currentPrice - tx.price) * tx.quantity;
                                                        txPnlPercent = tx.price > 0 ? ((item.currentPrice - tx.price) / tx.price) * 100 : 0;
                                                    }
                                                    
                                                    const invested = tx.quantity * tx.price;
                                                    const currentVal = isSell ? invested : (item.currentPrice * tx.quantity); // For sells, show sale value

                                                    return (
                                                        <tr key={tx.id || idx} className={`hover:bg-slate-50/50 transition-colors ${
                                                            isSell ? 'bg-rose-50/30' : ''
                                                        }`}>
                                                            {editingTransaction?.id === tx.id && !editingTransaction?.isPending ? (
                                                                <>
                                                                    <td colSpan="7" className="px-3 md:px-4 py-3">
                                                                        <div className="space-y-2">
                                                                            {/* Transaction Type Display (Read-only) */}
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-wide">
                                                                                    Transaction Type:
                                                                                </span>
                                                                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                                                    (tx.type || 'BUY') === 'SELL'
                                                                                        ? 'bg-rose-500 text-white'
                                                                                        : 'bg-teal-500 text-white'
                                                                                }`}>
                                                                                    {(tx.type || 'BUY') === 'SELL' ? 'SELL' : 'BUY'}
                                                                                </span>
                                                                            </div>

                                                                            {(tx.type || 'BUY') === 'SELL' && (
                                                                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
                                                                                    <p className="text-[9px] font-bold text-amber-700">
                                                                                        Current Holdings: <span className="font-black">{item.totalQty?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || 0}</span> units
                                                                                    </p>
                                                                                </div>
                                                                            )}

                                                                            <div className="grid grid-cols-3 gap-2">
                                                                                <input
                                                                                    type="date"
                                                                                    value={editingTransaction.date}
                                                                                    max={new Date().toISOString().split('T')[0]}
                                                                                    onChange={e => setEditingTransaction({
                                                                                        ...editingTransaction,
                                                                                        date: e.target.value
                                                                                    })}
                                                                                    className="w-full min-h-[36px] px-2 py-1 text-[10px] border border-indigo-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 touch-manipulation"
                                                                                />
                                                                                <input
                                                                                    type="number"
                                                                                    placeholder="Qty"
                                                                                    value={editingTransaction.quantity}
                                                                                    onChange={e => setEditingTransaction({
                                                                                        ...editingTransaction,
                                                                                        quantity: parseFloat(e.target.value) || 0
                                                                                    })}
                                                                                    className="w-full min-h-[36px] px-2 py-1 text-[10px] border border-indigo-300 rounded text-right focus:outline-none focus:ring-1 focus:ring-indigo-500 touch-manipulation"
                                                                                />
                                                                                <input
                                                                                    type="number"
                                                                                    placeholder="Price"
                                                                                    value={editingTransaction.price}
                                                                                    onChange={e => setEditingTransaction({
                                                                                        ...editingTransaction,
                                                                                        price: parseFloat(e.target.value) || 0
                                                                                    })}
                                                                                    className="w-full min-h-[36px] px-2 py-1 text-[10px] border border-indigo-300 rounded text-right focus:outline-none focus:ring-1 focus:ring-indigo-500 touch-manipulation"
                                                                                />
                                                                            </div>

                                                                            <div className="flex gap-2 justify-end">
                                                                                <button
                                                                                    onClick={() => handleSaveTransaction(tx)}
                                                                                    className="px-3 py-1 min-h-[36px] bg-emerald-600 text-white rounded text-[9px] font-bold hover:bg-emerald-700 touch-manipulation"
                                                                                >
                                                                                    Save
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => setEditingTransaction(null)}
                                                                                    className="px-3 py-1 min-h-[36px] bg-slate-200 text-slate-600 rounded text-[9px] font-bold hover:bg-slate-300 touch-manipulation"
                                                                                >
                                                                                    Cancel
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => handleDeleteTransaction(tx)}
                                                                                    className="px-3 py-1 min-h-[36px] bg-rose-500 text-white rounded text-[9px] font-bold hover:bg-rose-600 touch-manipulation flex items-center gap-1"
                                                                                >
                                                                                    <Trash2 size={12} />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <td className="px-3 md:px-4 py-2.5">
                                                                        <div className="flex items-center gap-1.5">
                                                                            {isSell && (
                                                                                <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[8px] font-black rounded">
                                                                                    SELL
                                                                                </span>
                                                                            )}
                                                                            <p className="text-xs font-bold text-slate-700 whitespace-nowrap">
                                                                                {new Date(tx.date).toLocaleDateString('en-IN', {
                                                                                    day: '2-digit',
                                                                                    month: 'short',
                                                                                    year: 'numeric'
                                                                                })}
                                                                            </p>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-3 md:px-4 py-2.5 text-right">
                                                                        <p className="text-xs font-black text-slate-800 tabular-nums">
                                                                            {tx.quantity.toLocaleString('en-IN', { maximumFractionDigits: 3 })}
                                                                        </p>
                                                                    </td>
                                                                    <td className="px-3 md:px-4 py-2.5 text-right">
                                                                        <p className="text-xs font-black text-slate-800 tabular-nums">
                                                                            ₹{tx.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                                                        </p>
                                                                    </td>
                                                                    <td className="px-3 md:px-4 py-2.5 text-right">
                                                                        <p className="text-xs font-black text-slate-700 tabular-nums">
                                                                            {formatCurrency(invested)}
                                                                        </p>
                                                                    </td>
                                                                    <td className="px-3 md:px-4 py-2.5 text-right">
                                                                        <p className={`text-xs font-black tabular-nums ${
                                                                            isSell ? 'text-rose-600' : 'text-indigo-600'
                                                                        }`}>
                                                                            {formatCurrency(currentVal)}
                                                                        </p>
                                                                        {isSell && (
                                                                            <p className="text-[8px] text-rose-500 font-bold mt-0.5">
                                                                                Realized: {txPnl >= 0 ? '+' : ''}{formatCurrency(txPnl)}
                                                                            </p>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-3 md:px-4 py-2.5 text-right">
                                                                        <div className="flex flex-col items-end">
                                                                            <p className={`text-xs font-black tabular-nums ${
                                                                                txPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                                                            }`}>
                                                                                {txPnl >= 0 ? '+' : ''}{formatCurrency(txPnl)}
                                                                            </p>
                                                                            {!isSell && (
                                                                                <p className={`text-[9px] font-bold ${
                                                                                    txPnlPercent >= 0 ? 'text-emerald-500' : 'text-rose-500'
                                                                                }`}>
                                                                                    {txPnlPercent >= 0 ? '+' : ''}{txPnlPercent.toFixed(2)}%
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-3 md:px-4 py-2.5 text-center">
                                                                        <button
                                                                            onClick={() => setEditingTransaction({ ...tx, type: tx.type || 'BUY' })}
                                                                            className="p-1.5 min-w-[36px] min-h-[36px] text-slate-300 hover:text-indigo-600 transition-colors inline-flex items-center justify-center touch-manipulation"
                                                                            title="Edit Transaction"
                                                                        >
                                                                            <Edit3 size={14} />
                                                                        </button>
                                                                    </td>
                                                                </>
                                                            )}
                                                        </tr>
                                                    );
                                                })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Dividends Section */}
                            {((item.dividends && item.dividends.length > 0) || editingTransaction?.isPendingDividend) && (
                                <div className="mt-4">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                        Dividends
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                                        {/* Pending New Dividend */}
                                        {editingTransaction?.isPendingDividend && (
                                            <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-200">
                                                <div className="space-y-2">
                                                    <input
                                                        type="date"
                                                        value={editingTransaction.date}
                                                        max={new Date().toISOString().split('T')[0]}
                                                        onChange={e => setEditingTransaction({
                                                            ...editingTransaction,
                                                            date: e.target.value
                                                        })}
                                                        className="w-full min-h-[36px] px-2 py-1 text-[10px] border border-indigo-300 rounded touch-manipulation bg-white"
                                                    />
                                                    <input
                                                        type="number"
                                                        inputMode="decimal"
                                                        step="0.01"
                                                        min="0"
                                                        placeholder="Amount (e.g. 15.50)"
                                                        value={editingTransaction.amount}
                                                        onChange={e => setEditingTransaction({
                                                            ...editingTransaction,
                                                            amount: e.target.value
                                                        })}
                                                        className="w-full min-h-[36px] px-2 py-1 text-[10px] border border-indigo-300 rounded touch-manipulation bg-white"
                                                    />
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleSaveDividend(editingTransaction)}
                                                            className="flex-1 px-2 py-1 min-h-[36px] bg-emerald-600 text-white rounded text-[9px] font-bold touch-manipulation"
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingTransaction(null)}
                                                            className="flex-1 px-2 py-1 min-h-[36px] bg-slate-200 text-slate-600 rounded text-[9px] font-bold touch-manipulation"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {/* Existing Dividends */}
                                        {(item.dividends || []).map((div, idx) => (
                                            <div key={div.id || idx} className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                                                {editingTransaction?.divId === div.id && !editingTransaction?.isPendingDividend ? (
                                                    <div className="space-y-2">
                                                        <input
                                                            type="date"
                                                            value={editingTransaction.date}
                                                            max={new Date().toISOString().split('T')[0]}
                                                            onChange={e => setEditingTransaction({
                                                                ...editingTransaction,
                                                                date: e.target.value
                                                            })}
                                                            className="w-full min-h-[36px] px-2 py-1 text-[10px] border rounded touch-manipulation bg-white"
                                                        />
                                                        <input
                                                            type="number"
                                                            inputMode="decimal"
                                                            step="0.01"
                                                            min="0"
                                                            placeholder="Amount (e.g. 15.50)"
                                                            value={editingTransaction.amount === '' || editingTransaction.amount === undefined
                                                                ? ''
                                                                : editingTransaction.amount
                                                            }
                                                            onChange={e => {
                                                                const val = e.target.value;
                                                                setEditingTransaction({
                                                                    ...editingTransaction,
                                                                    amount: val === '' ? '' : val
                                                                });
                                                            }}
                                                            className="w-full min-h-[36px] px-2 py-1 text-[10px] border rounded touch-manipulation bg-white"
                                                        />
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleSaveDividend(div)}
                                                                className="flex-1 px-2 py-1 min-h-[36px] bg-emerald-600 text-white rounded text-[9px] font-bold touch-manipulation"
                                                            >
                                                                Save
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingTransaction(null)}
                                                                className="flex-1 px-2 py-1 min-h-[36px] bg-slate-200 text-slate-600 rounded text-[9px] font-bold touch-manipulation"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteDividend(div)}
                                                                className="px-2 py-1 min-h-[36px] bg-rose-500 text-white rounded text-[9px] font-bold touch-manipulation flex items-center justify-center"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <p className="text-[10px] text-emerald-600 font-bold">
                                                                {div.date}
                                                            </p>
                                                            <p className="text-xs font-black text-emerald-700">
                                                                {formatCurrencyWithDecimals(div.amount)}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => setEditingTransaction({ ...div, divId: div.id })}
                                                            className="p-1 min-w-[36px] min-h-[36px] text-emerald-300 hover:text-indigo-600 flex items-center justify-center touch-manipulation"
                                                        >
                                                            <Edit3 size={14} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Add Dividend Button */}
                            <button
                                onClick={handleAddDividend}
                                className="px-4 py-2 min-h-[44px] bg-emerald-100 text-emerald-700 rounded-xl text-[9px] font-black uppercase hover:bg-emerald-200 active:bg-emerald-300 transition-colors touch-manipulation flex items-center gap-2"
                            >
                                <Plus size={12} />
                                <span>Add Dividend</span>
                            </button>
                        </div>
                    </td>
                </tr>
            )}
        </React.Fragment>
    );
};

export default AssetRow;
