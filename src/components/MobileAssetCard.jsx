import React, { useState, useRef, useEffect } from 'react';
import {
    ChevronDown, Plus, Trash2,
    TrendingUp, TrendingDown, ShieldAlert, BarChart3, Briefcase, Layers,
    Calendar, Clock, Coins, X, Check, AlertCircle, Edit3
} from 'lucide-react';
import { formatCurrency, formatCurrencyWithDecimals } from '../utils/formatters';

// Asset type icon component
const AssetTypeIcon = ({ type, size = 18 }) => {
    const icons = {
        STOCK: BarChart3,
        MF: Briefcase,
        ETF: Layers
    };
    const Icon = icons[type] || BarChart3;
    return <Icon size={size} strokeWidth={2.5} />;
};

// Handle mobile keyboard - scroll focused input into view
const handleInputFocus = (e) => {
    setTimeout(() => {
        e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
};

// Calculate days held
const getDaysHeld = (date) => {
    const txDate = new Date(date);
    const today = new Date();
    const diffTime = Math.abs(today - txDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Format holding period
const formatHoldingPeriod = (days) => {
    if (days < 30) return `${days}d`;
    if (days < 365) return `${Math.floor(days / 30)}m`;
    const years = Math.floor(days / 365);
    const months = Math.floor((days % 365) / 30);
    return months > 0 ? `${years}y ${months}m` : `${years}y`;
};

// Check if LTCG (> 1 year)
const isLTCG = (date, assetType) => {
    const days = getDaysHeld(date);
    // For stocks/ETFs: 1 year, for MF: 1 year for equity, 3 years for debt (simplified to 1 year)
    return days > 365;
};

/**
 * MobileAssetCard Component - Mobile-optimized card layout for assets
 */
const MobileAssetCard = ({
    item,
    pnlView = 'total',
    onUpdateAsset,
    onDeleteAsset,
    onAddTransaction,
    onUpdateTransaction,
    onDeleteTransaction,
    onAddDividend,
    onDeleteDividend
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [showTransactions, setShowTransactions] = useState(true);
    const [showDividends, setShowDividends] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null);

    const handleAddTransaction = () => {
        const pendingTx = {
            id: `pending-${Date.now()}`,
            price: item.currentPrice || 0,
            quantity: '',
            date: new Date().toISOString().split('T')[0],
            isPending: true
        };
        setEditingTransaction(pendingTx);
        setShowTransactions(true);
    };

    const handleSaveTransaction = () => {
        if (!editingTransaction) return;
        
        const quantity = parseFloat(editingTransaction.quantity) || 0;
        const price = parseFloat(editingTransaction.price) || 0;
        
        if (quantity <= 0 || price <= 0) {
            alert('Please enter valid quantity and price');
            return;
        }

        const txDate = new Date(editingTransaction.date);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (txDate > today) {
            alert('Date cannot be in the future');
            return;
        }

        const transactionData = {
            id: editingTransaction.isPending ? Date.now() : editingTransaction.id,
            price,
            quantity,
            date: editingTransaction.date
        };

        if (editingTransaction.isPending) {
            onAddTransaction(item, transactionData);
        } else {
            onUpdateTransaction(item, transactionData);
        }
        setEditingTransaction(null);
    };

    const handleDeleteTransaction = (txId, tx) => {
        setConfirmDelete({ type: 'transaction', id: txId, data: tx });
    };

    const handleConfirmDelete = () => {
        if (!confirmDelete) return;
        if (confirmDelete.type === 'transaction') {
            onDeleteTransaction(item, confirmDelete.id, confirmDelete.data);
        } else if (confirmDelete.type === 'dividend') {
            onDeleteDividend(item, confirmDelete.id, confirmDelete.data);
        }
        setConfirmDelete(null);
        setEditingTransaction(null);
    };

    const handleAddDividend = () => {
        const pendingDiv = {
            id: `pending-div-${Date.now()}`,
            amount: '',
            date: new Date().toISOString().split('T')[0],
            isPendingDividend: true
        };
        setEditingTransaction(pendingDiv);
        setShowDividends(true);
    };

    const handleSaveDividend = () => {
        if (!editingTransaction || !editingTransaction.isPendingDividend) return;

        const amount = parseFloat(editingTransaction.amount) || 0;
        if (amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        const divDate = new Date(editingTransaction.date);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (divDate > today) {
            alert('Date cannot be in the future');
            return;
        }

        onAddDividend(item, {
            id: Date.now(),
            amount,
            date: editingTransaction.date
        });
        setEditingTransaction(null);
    };

    // Calculate totals
    const totalInvested = (item.transactions || []).reduce((sum, tx) => sum + (tx.price * tx.quantity), 0);
    const totalDividends = (item.dividends || []).reduce((sum, div) => sum + div.amount, 0);
    const dividendYield = totalInvested > 0 ? (totalDividends / totalInvested) * 100 : 0;

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-300">
            {/* Confirmation Modal */}
            {confirmDelete && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 w-full max-w-sm shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                                <AlertCircle size={20} className="text-rose-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-white">Delete {confirmDelete.type}?</h3>
                                <p className="text-xs text-slate-500">This action cannot be undone</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setConfirmDelete(null)}
                                className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="flex-1 py-3 rounded-xl bg-rose-500 text-white font-bold"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Card Header - Clickable - Compact Layout */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-3 active:bg-slate-50 dark:active:bg-slate-700/50 transition-colors"
            >
                <div className="flex items-center gap-2.5">
                    {/* Compact Asset Icon */}
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        item.type === 'STOCK' ? 'bg-gradient-to-br from-teal-400 to-teal-600' :
                        item.type === 'MF' ? 'bg-gradient-to-br from-violet-400 to-violet-600' :
                        'bg-gradient-to-br from-amber-400 to-amber-600'
                    } text-white`}>
                        <AssetTypeIcon type={item.type} size={16} />
                        </div>

                    {/* Asset Info - Compact */}
                    <div className="flex-1 min-w-0">
                        {/* Row 1: Name - Full width for visibility */}
                        <p className="text-[13px] font-bold text-slate-800 dark:text-white truncate">
                                {item.name || item.symbol}
                        </p>
                        {/* Row 2: Units @ Avg Price */}
                        <p className="text-[10px] text-slate-400">
                            {item.totalQty} units @ ₹{item.avgPrice?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </p>
                    </div>

                    {/* Price/P&L - Compact */}
                    <div className="text-right flex-shrink-0">
                        {pnlView === 'total' ? (
                            <>
                                <p className="text-[13px] font-bold tabular-nums text-slate-800 dark:text-white">
                                    ₹{item.currentPrice?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                </p>
                                <p className={`text-[9px] font-semibold tabular-nums ${
                                    (item.absReturn || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                }`}>
                                    {(item.absReturn || 0) >= 0 ? '+' : ''}{formatCurrency(item.absReturn || 0)} ({(item.absReturnPercent || 0) >= 0 ? '+' : ''}{(item.absReturnPercent || 0).toFixed(1)}%)
                                </p>
                            </>
                        ) : (
                            <>
                                <p className={`text-[13px] font-bold tabular-nums ${
                                    item.dayChange >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                }`}>
                                    {item.dayChange >= 0 ? '+' : ''}{formatCurrency(item.dayChange)}
                                </p>
                                <p className={`text-[9px] font-semibold tabular-nums ${
                                    item.dayChangePercent >= 0 ? 'text-emerald-500' : 'text-rose-500'
                                }`}>
                                    {item.dayChangePercent >= 0 ? '+' : ''}{item.dayChangePercent?.toFixed(2)}%
                                </p>
                            </>
                        )}
                    </div>

                    {/* Account Badge + Expand Indicator */}
                    <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                        {item.account && (
                            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-[7px] font-bold text-slate-500 dark:text-slate-400 rounded">
                                {item.account}
                            </span>
                        )}
                        <div className={`text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                            <ChevronDown size={18} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-4 space-y-4 animate-fade-slide-in">
                    
                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-3 gap-2">
                        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                            <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Invested</p>
                            <p className="text-sm font-black text-slate-800 dark:text-white tabular-nums">
                                {formatCurrency(totalInvested)}
                            </p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                            <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Current</p>
                            <p className="text-sm font-black text-teal-600 tabular-nums">
                                {formatCurrency(item.currentValue)}
                            </p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                            <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">XIRR</p>
                            {item.xirr !== null && item.xirr !== undefined ? (
                                <p className={`text-sm font-black tabular-nums ${item.xirr >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {item.xirr >= 0 ? '+' : ''}{item.xirr.toFixed(1)}%
                                </p>
                            ) : (
                                <p className="text-sm font-bold text-slate-400">N/A</p>
                            )}
                        </div>
                                </div>

                    {/* Transactions Section */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        {/* Section Header */}
                        <button
                            onClick={() => setShowTransactions(!showTransactions)}
                            className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700"
                        >
                            <div className="flex items-center gap-2">
                                <Clock size={14} className="text-teal-500" />
                                <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase">
                                    Transactions
                                </span>
                                <span className="px-2 py-0.5 bg-teal-100 dark:bg-teal-900/50 text-teal-600 text-[10px] font-black rounded-full">
                                    {item.transactions?.length || 0}
                                </span>
                            </div>
                            <ChevronDown size={16} className={`text-slate-400 transition-transform ${showTransactions ? 'rotate-180' : ''}`} />
                        </button>

                        {showTransactions && (
                            <div className="p-3 space-y-2">
                                {/* Add Transaction Button */}
                                <button
                                    onClick={handleAddTransaction}
                                    className="w-full py-2.5 rounded-xl border-2 border-dashed border-teal-300 dark:border-teal-700 text-teal-600 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-teal-50 dark:hover:bg-teal-900/20"
                                >
                                    <Plus size={14} /> Add Transaction
                                </button>

                                {/* Pending Transaction Form */}
                                {editingTransaction?.isPending && (
                                    <div className="bg-teal-50 dark:bg-teal-900/30 p-4 rounded-xl border border-teal-200 dark:border-teal-800 space-y-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Plus size={14} className="text-teal-600" />
                                            <span className="text-xs font-black text-teal-700 uppercase">New Transaction</span>
                                        </div>
                                        <input
                                            type="date"
                                            value={editingTransaction.date}
                                            max={new Date().toISOString().split('T')[0]}
                                            onChange={(e) => setEditingTransaction({ ...editingTransaction, date: e.target.value })}
                                            onFocus={handleInputFocus}
                                            className="w-full px-4 py-3 border border-teal-200 dark:border-teal-700 rounded-xl text-base bg-white dark:bg-slate-800"
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                type="number"
                                                inputMode="decimal"
                                                placeholder="Quantity"
                                                value={editingTransaction.quantity}
                                                onChange={(e) => setEditingTransaction({ ...editingTransaction, quantity: e.target.value })}
                                                onFocus={handleInputFocus}
                                                className="px-4 py-3 border border-teal-200 dark:border-teal-700 rounded-xl text-base bg-white dark:bg-slate-800"
                                            />
                                            <input
                                                type="number"
                                                inputMode="decimal"
                                                placeholder="Price ₹"
                                                value={editingTransaction.price}
                                                onChange={(e) => setEditingTransaction({ ...editingTransaction, price: e.target.value })}
                                                onFocus={handleInputFocus}
                                                className="px-4 py-3 border border-teal-200 dark:border-teal-700 rounded-xl text-base bg-white dark:bg-slate-800"
                                            />
                                        </div>
                                        {/* Preview */}
                                        {editingTransaction.quantity && editingTransaction.price && (
                                            <div className="bg-white dark:bg-slate-800 rounded-lg p-2 text-center">
                                                <span className="text-xs text-slate-500">Total: </span>
                                                <span className="text-sm font-black text-slate-800 dark:text-white">
                                                    {formatCurrency((parseFloat(editingTransaction.quantity) || 0) * (parseFloat(editingTransaction.price) || 0))}
                                                </span>
                                    </div>
                                )}
                                        <div className="flex gap-2">
                                            <button onClick={handleSaveTransaction} className="flex-1 py-3 bg-teal-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-1">
                                                <Check size={16} /> Save
                                            </button>
                                            <button onClick={() => setEditingTransaction(null)} className="flex-1 py-3 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold">
                                                Cancel
                                            </button>
                            </div>
                        </div>
                    )}

                                {/* Transaction List - Timeline Style */}
                                {item.transactions && item.transactions.length > 0 && (
                                    <div className="relative">
                                        {/* Timeline Line */}
                                        <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-slate-200 dark:bg-slate-700" />

                        <div className="space-y-2">
                                            {[...item.transactions]
                                .sort((a, b) => new Date(b.date) - new Date(a.date))
                                                .map((tx, index) => {
                                    const txPnl = (item.currentPrice - tx.price) * tx.quantity;
                                    const txPnlPercent = tx.price > 0 ? ((item.currentPrice - tx.price) / tx.price) * 100 : 0;
                                                    const daysHeld = getDaysHeld(tx.date);
                                                    const isLongTerm = isLTCG(tx.date, item.type);
                                                    const isEditing = editingTransaction?.id === tx.id && !editingTransaction?.isPending;

                                                    if (isEditing) {
                                        return (
                                                            <div key={tx.id} className="ml-8 bg-amber-50 dark:bg-amber-900/30 p-4 rounded-xl border border-amber-200 dark:border-amber-800 space-y-3">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <Edit3 size={14} className="text-amber-600" />
                                                                    <span className="text-xs font-black text-amber-700 uppercase">Edit Transaction</span>
                                                                </div>
                                                <input
                                                    type="date"
                                                    value={editingTransaction.date}
                                                                    max={new Date().toISOString().split('T')[0]}
                                                                    onChange={(e) => setEditingTransaction({ ...editingTransaction, date: e.target.value })}
                                                                    onFocus={handleInputFocus}
                                                                    className="w-full px-4 py-3 border border-amber-200 dark:border-amber-700 rounded-xl text-base bg-white dark:bg-slate-800"
                                                />
                                                <div className="grid grid-cols-2 gap-2">
                                                    <input
                                                        type="number"
                                                                        inputMode="decimal"
                                                                        placeholder="Qty"
                                                        value={editingTransaction.quantity}
                                                                        onChange={(e) => setEditingTransaction({ ...editingTransaction, quantity: parseFloat(e.target.value) || 0 })}
                                                                        onFocus={handleInputFocus}
                                                                        className="px-4 py-3 border border-amber-200 dark:border-amber-700 rounded-xl text-base bg-white dark:bg-slate-800"
                                                    />
                                                    <input
                                                        type="number"
                                                                        inputMode="decimal"
                                                                        placeholder="Price ₹"
                                                        value={editingTransaction.price}
                                                                        onChange={(e) => setEditingTransaction({ ...editingTransaction, price: parseFloat(e.target.value) || 0 })}
                                                                        onFocus={handleInputFocus}
                                                                        className="px-4 py-3 border border-amber-200 dark:border-amber-700 rounded-xl text-base bg-white dark:bg-slate-800"
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                                    <button onClick={handleSaveTransaction} className="flex-1 py-3 bg-amber-500 text-white rounded-xl text-sm font-bold">
                                                        Save
                                                    </button>
                                                                    <button onClick={() => setEditingTransaction(null)} className="flex-1 py-3 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold">
                                                        Cancel
                                                    </button>
                                                                    <button onClick={() => handleDeleteTransaction(tx.id, tx)} className="px-4 py-3 bg-rose-500 text-white rounded-xl">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div
                                            key={tx.id}
                                            onClick={() => setEditingTransaction({ ...tx })}
                                                            className="relative flex items-start gap-3 pl-1 cursor-pointer group"
                                                        >
                                                            {/* Timeline Dot */}
                                                            <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                                                isLongTerm 
                                                                    ? 'bg-emerald-100 border-2 border-emerald-400' 
                                                                    : 'bg-orange-100 border-2 border-orange-400'
                                                            }`}>
                                                                <Calendar size={12} className={isLongTerm ? 'text-emerald-600' : 'text-orange-600'} />
                                                            </div>

                                                            {/* Transaction Card */}
                                                            <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 group-active:bg-slate-100 dark:group-active:bg-slate-700/50 transition-colors">
                                                                <div className="flex justify-between items-start">
                                                <div>
                                                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                                            {new Date(tx.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                        </p>
                                                                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                                                                            {tx.quantity} × ₹{tx.price.toFixed(2)}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                                        <p className={`text-sm font-black tabular-nums ${txPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                        {txPnl >= 0 ? '+' : ''}{formatCurrency(txPnl)}
                                                    </p>
                                                                        <p className={`text-[10px] font-bold ${txPnlPercent >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                            {txPnlPercent >= 0 ? '+' : ''}{txPnlPercent.toFixed(1)}%
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                {/* Holding Period Badge */}
                                                                <div className="flex items-center gap-2 mt-2">
                                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold ${
                                                                        isLongTerm 
                                                                            ? 'bg-emerald-100 text-emerald-700' 
                                                                            : 'bg-orange-100 text-orange-700'
                                                                    }`}>
                                                                        {isLongTerm ? 'LTCG' : 'STCG'} • {formatHoldingPeriod(daysHeld)}
                                                                    </span>
                                                                    <span className="text-[9px] text-slate-400">
                                                                        ₹{formatCurrency(tx.quantity * tx.price).replace('₹', '')} invested
                                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                                    </div>
                                )}

                                {/* Empty State - Compact */}
                                {(!item.transactions || item.transactions.length === 0) && !editingTransaction?.isPending && (
                                    <p className="text-center py-3 text-[10px] text-slate-400">No transactions yet</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Dividends Section */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        {/* Section Header */}
                        <button
                            onClick={() => setShowDividends(!showDividends)}
                            className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700"
                        >
                            <div className="flex items-center gap-2">
                                <Coins size={14} className="text-emerald-500" />
                                <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase">
                                    Dividends
                                </span>
                                {totalDividends > 0 && (
                                    <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 text-[10px] font-black rounded-full">
                                        {formatCurrency(totalDividends)}
                                    </span>
                                )}
                            </div>
                            <ChevronDown size={16} className={`text-slate-400 transition-transform ${showDividends ? 'rotate-180' : ''}`} />
                        </button>

                        {showDividends && (
                            <div className="p-3 space-y-2">
                                {/* Add Dividend Button */}
                                <button
                                    onClick={handleAddDividend}
                                    className="w-full py-2.5 rounded-xl border-2 border-dashed border-emerald-300 dark:border-emerald-700 text-emerald-600 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                >
                                    <Plus size={14} /> Add Dividend
                                </button>

                                {/* Pending Dividend Form */}
                                {editingTransaction?.isPendingDividend && (
                                    <div className="bg-emerald-50 dark:bg-emerald-900/30 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Plus size={14} className="text-emerald-600" />
                                            <span className="text-xs font-black text-emerald-700 uppercase">New Dividend</span>
                                        </div>
                                        <input
                                            type="date"
                                            value={editingTransaction.date}
                                            max={new Date().toISOString().split('T')[0]}
                                            onChange={(e) => setEditingTransaction({ ...editingTransaction, date: e.target.value })}
                                            onFocus={handleInputFocus}
                                            className="w-full px-4 py-3 border border-emerald-200 dark:border-emerald-700 rounded-xl text-base bg-white dark:bg-slate-800"
                                        />
                                        <input
                                            type="number"
                                            inputMode="decimal"
                                            placeholder="Amount ₹"
                                            value={editingTransaction.amount}
                                            onChange={(e) => setEditingTransaction({ ...editingTransaction, amount: e.target.value })}
                                            onFocus={handleInputFocus}
                                            className="w-full px-4 py-3 border border-emerald-200 dark:border-emerald-700 rounded-xl text-base bg-white dark:bg-slate-800"
                                        />
                                        <div className="flex gap-2">
                                            <button onClick={handleSaveDividend} className="flex-1 py-3 bg-emerald-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-1">
                                                <Check size={16} /> Save
                                            </button>
                                            <button onClick={() => setEditingTransaction(null)} className="flex-1 py-3 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold">
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Dividend List - Compact */}
                    {item.dividends && item.dividends.length > 0 && (
                            <div className="space-y-1.5">
                                        {[...item.dividends]
                                            .sort((a, b) => new Date(b.date) - new Date(a.date))
                                            .map((div) => (
                                                <div
                                                    key={div.id}
                                                    className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-2 rounded-lg"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Coins size={12} className="text-emerald-500" />
                                                        <span className="text-xs font-black text-emerald-600">+{formatCurrencyWithDecimals(div.amount)}</span>
                                                        <span className="text-[9px] text-emerald-500/70">
                                                            {new Date(div.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => setConfirmDelete({ type: 'dividend', id: div.id, data: div })}
                                                        className="p-1.5 text-rose-400 hover:text-rose-600 rounded transition-colors"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        
                                        {/* Dividend Yield Summary - Compact */}
                                        {dividendYield > 0 && (
                                            <div className="flex items-center justify-between bg-emerald-100/50 dark:bg-emerald-900/30 px-3 py-2 rounded-lg">
                                                <span className="text-[10px] text-emerald-600 font-bold">Yield</span>
                                                <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">{dividendYield.toFixed(2)}%</span>
                                            </div>
                                        )}
                                        </div>
                                )}

                                {/* Empty State - Compact */}
                                {(!item.dividends || item.dividends.length === 0) && !editingTransaction?.isPendingDividend && (
                                    <p className="text-center py-3 text-[10px] text-slate-400">No dividends yet</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Capital Gains & Tax - Compact */}
                    {item.capitalGains && (item.capitalGains.stcg > 0 || item.capitalGains.ltcg > 0) && (
                        <div className="space-y-1.5">
                            <p className="text-[9px] font-bold text-slate-400 uppercase px-1">Tax if Sold Today</p>
                            <div className="flex gap-2">
                                {/* STCG Card */}
                                {item.capitalGains.stcg > 0 && (
                                    <div className="flex-1 bg-orange-50 dark:bg-orange-900/20 px-2.5 py-2 rounded-lg border border-orange-200 dark:border-orange-800">
                                        <p className="text-[8px] font-bold text-orange-400 uppercase">Short Term</p>
                                        <p className="text-xs font-black text-orange-600">{formatCurrency(item.capitalGains.stcg)}</p>
                                        <p className="text-[9px] text-orange-500">Tax: {formatCurrency(item.capitalGains.stcg * 0.20)}</p>
                                    </div>
                                )}
                                {/* LTCG Card */}
                                {item.capitalGains.ltcg > 0 && (
                                    <div className="flex-1 bg-teal-50 dark:bg-teal-900/20 px-2.5 py-2 rounded-lg border border-teal-200 dark:border-teal-800">
                                        <p className="text-[8px] font-bold text-teal-400 uppercase">Long Term</p>
                                        <p className="text-xs font-black text-teal-600">{formatCurrency(item.capitalGains.ltcg)}</p>
                                        <p className="text-[9px] text-teal-500">Tax: {formatCurrency(Math.max(0, item.capitalGains.ltcg - 125000) * 0.125)}</p>
                                        <p className="text-[8px] text-teal-400">₹1.25L exempt • ₹{Math.max(0, 125000 - item.capitalGains.ltcg).toLocaleString('en-IN')} left</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Delete Asset - Subtle at bottom */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onDeleteAsset(item); }}
                        className="w-full py-2 text-[10px] font-medium text-slate-400 hover:text-rose-500 transition-colors flex items-center justify-center gap-1"
                    >
                        <Trash2 size={10} /> Remove this asset
                    </button>
                </div>
            )}
        </div>
    );
};

export default MobileAssetCard;
