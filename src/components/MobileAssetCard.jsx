import React, { useState, useRef, useEffect } from 'react';
import {
    ChevronDown, Plus, Trash2,
    TrendingUp, TrendingDown, ShieldAlert, BarChart3, Briefcase, Layers, Globe,
    Calendar, Clock, Coins, X, Check, AlertCircle, Edit3, Loader2, Wallet
} from 'lucide-react';
import { formatCurrency, formatCurrencyWithDecimals, formatUSD, inrToUSD } from '../utils/formatters';
import { useDarkModeContext } from './MobileLayout';

// Asset type icon component
const AssetTypeIcon = ({ type, size = 18 }) => {
    const icons = {
        STOCK: BarChart3,
        MF: Briefcase,
        ETF: Layers,
        US_STOCK: Globe
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
    // Dark mode context
    const darkModeContext = useDarkModeContext();
    const isDarkMode = darkModeContext?.isDarkMode || false;
    
    const [isExpanded, setIsExpanded] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [showTransactions, setShowTransactions] = useState(true);
    const [showDividends, setShowDividends] = useState(false);
    const [showInvestmentDetails, setShowInvestmentDetails] = useState(false); // Collapsible investment summary
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [saving, setSaving] = useState(false); // Loading state for save operations

    const handleAddTransaction = () => {
        const pendingTx = {
            id: `pending-${Date.now()}`,
            type: 'BUY', // Default to BUY
            price: item.currentPrice || 0,
            quantity: '',
            date: new Date().toISOString().split('T')[0],
            isPending: true
        };
        setEditingTransaction(pendingTx);
        setShowTransactions(true);
    };

    const handleSaveTransaction = async () => {
        if (!editingTransaction || saving) return;
        
        const quantity = parseFloat(editingTransaction.quantity) || 0;
        const price = parseFloat(editingTransaction.price) || 0;
        // Preserve original transaction type when editing (don't allow changing type)
        const txType = editingTransaction.isPending 
            ? (editingTransaction.type || 'BUY') 
            : (editingTransaction.originalType || editingTransaction.type || 'BUY');
        
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

        const txDate = new Date(editingTransaction.date);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (txDate > today) {
            alert('Date cannot be in the future');
            return;
        }

        setSaving(true);
        
        try {
            const transactionData = {
                id: editingTransaction.isPending ? Date.now() : editingTransaction.id,
                type: txType,
                price,
                quantity,
                date: editingTransaction.date
            };

            if (editingTransaction.isPending) {
                await Promise.resolve(onAddTransaction(item, transactionData));
            } else {
                await Promise.resolve(onUpdateTransaction(item, transactionData));
            }
            setEditingTransaction(null);
        } catch (error) {
            console.error('Error saving transaction:', error);
            alert(error?.message || 'Failed to save transaction. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteTransaction = (txId, tx) => {
        setConfirmDelete({ type: 'transaction', id: txId, data: tx });
    };

    const handleConfirmDelete = async () => {
        if (!confirmDelete || saving) return;
        
        setSaving(true);
        try {
            if (confirmDelete.type === 'transaction') {
                await Promise.resolve(onDeleteTransaction(item, confirmDelete.id, confirmDelete.data));
            } else if (confirmDelete.type === 'dividend') {
                await Promise.resolve(onDeleteDividend(item, confirmDelete.id, confirmDelete.data));
            }
            setConfirmDelete(null);
            setEditingTransaction(null);
        } catch (error) {
            console.error('Error deleting:', error);
            alert(error?.message || 'Failed to delete. Please try again.');
        } finally {
            setSaving(false);
        }
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

    const handleSaveDividend = async () => {
        if (!editingTransaction || !editingTransaction.isPendingDividend || saving) return;

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

        setSaving(true);
        
        try {
            await Promise.resolve(onAddDividend(item, {
                id: Date.now(),
                amount,
                date: editingTransaction.date
            }));
            setEditingTransaction(null);
        } catch (error) {
            console.error('Error saving dividend:', error);
            alert(error?.message || 'Failed to save dividend. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // ✅ GOLDEN RULE: Invested = cost of UN-SOLD buy lots only (open positions)
    const invested = item.investedValue || 0; // Cost of capital still deployed (from FIFO buyQueue)
    // Current holdings cost is the same as invested (cost of remaining lots)
    const currentHoldingsCost = invested; // Same as invested for current holdings
    const unrealizedGains = item.unrealizedGains || 0;
    const isFullySold = item.isFullySold || (item.totalQty || 0) <= 0; // ✅ Check if fully sold
    // Calculate percentage with proper error handling
    let unrealizedGainsPercent = 0;
    if (currentHoldingsCost > 0 && !isNaN(unrealizedGains) && isFinite(unrealizedGains)) {
        unrealizedGainsPercent = (unrealizedGains / currentHoldingsCost) * 100;
        if (!isFinite(unrealizedGainsPercent)) unrealizedGainsPercent = 0;
    }
    const totalDividends = (item.dividends || []).reduce((sum, div) => sum + (div.amount || 0), 0);
    const dividendYield = invested > 0 ? (totalDividends / invested) * 100 : 0;

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl card-shadow border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-300">
            {/* Confirmation Modal */}
            {confirmDelete && (
                <div 
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
                    onClick={() => !saving && setConfirmDelete(null)}
                >
                    <div 
                        className="bg-white dark:bg-slate-800 rounded-2xl p-5 w-full max-w-sm shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
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
                                disabled={saving}
                                className={`flex-1 py-3 rounded-xl text-white font-bold flex items-center justify-center gap-1 transition-all ${
                                    saving 
                                        ? 'bg-rose-400 cursor-not-allowed' 
                                        : 'bg-rose-500 active:scale-95'
                                }`}
                            >
                                {saving ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" /> Deleting...
                                    </>
                                ) : (
                                    'Delete'
                                )}
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
                    {/* Compact Asset Icon with Pattern */}
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-white ${
                        item.type === 'STOCK' ? 'asset-pattern-stock' :
                        item.type === 'MF' ? 'asset-pattern-mf' :
                        item.type === 'US_STOCK' ? 'asset-pattern-usstock' :
                        'asset-pattern-etf'
                    }`}>
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
                                    <p className="text-[13px] font-bold tabular-nums text-slate-800 dark:text-white" title={item.type === 'US_STOCK' && item.priceUSD != null ? formatUSD(item.priceUSD) : undefined}>
                                        ₹{(item.currentPrice || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                        {item.type === 'US_STOCK' && item.priceUSD != null && (
                                            <span className="block text-[9px] font-semibold text-slate-500 dark:text-slate-400">{formatUSD(item.priceUSD)}</span>
                                        )}
                                    </p>
                                <p className={`text-[9px] font-semibold tabular-nums ${
                                    unrealizedGains >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                }`}>
                                    {unrealizedGains >= 0 ? '+' : ''}{formatCurrency(unrealizedGains)} ({unrealizedGainsPercent >= 0 ? '+' : ''}{isFinite(unrealizedGainsPercent) ? unrealizedGainsPercent.toFixed(1) : '0.0'}%)
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

            {/* Expanded Content - Smooth expand/collapse */}
            <div className={`expand-section overflow-hidden ${isExpanded ? 'open' : ''}`}>
                <div className="expand-content">
                <div className="border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-4 space-y-4">
                    
                    {/* Investment Summary - Collapsible Single Section */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        {/* Collapsible Header */}
                        <button
                            onClick={() => setShowInvestmentDetails(!showInvestmentDetails)}
                            className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700"
                        >
                            <div className="flex items-center gap-2">
                                <Wallet size={14} className="text-indigo-500" />
                                <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase">
                                    Investment Details
                                </span>
                            </div>
                            <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${showInvestmentDetails ? 'rotate-180' : ''}`} />
                        </button>

                        <div className={`expand-section overflow-hidden ${showInvestmentDetails ? 'open' : ''}`}>
                            <div className="expand-content">
                            <div className="p-4 space-y-3">
                                {/* Section 1: Total Investment Overview */}
                                <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-2">Total Investment</p>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Invested</span>
                                            <span className="text-right">
                                                <span className="text-sm font-black text-slate-800 dark:text-white tabular-nums">{formatCurrency(invested)}</span>
                                                {item.type === 'US_STOCK' && inrToUSD(invested, item.priceUSD, item.currentPrice) != null && (
                                                    <span className="block text-[9px] font-semibold text-slate-500 dark:text-slate-400">{formatUSD(inrToUSD(invested, item.priceUSD, item.currentPrice))}</span>
                                                )}
                                            </span>
                                        </div>
                                        {(item.totalRealized || 0) > 0 && (
                                            <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-700">
                                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Sold Proceeds</span>
                                                <span className="text-right">
                                                    <span className="text-sm font-black text-slate-600 dark:text-slate-300 tabular-nums">{formatCurrency(item.totalRealized || 0)}</span>
                                                    {item.type === 'US_STOCK' && inrToUSD(item.totalRealized, item.priceUSD, item.currentPrice) != null && (
                                                        <span className="block text-[9px] font-semibold text-slate-500 dark:text-slate-400">{formatUSD(inrToUSD(item.totalRealized, item.priceUSD, item.currentPrice))}</span>
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Section 2: Current Holdings (Open) or Exit Details (Closed) */}
                                {isFullySold ? (
                                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-2">Exit Details</p>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Exit Proceeds</span>
                                                <span className="text-right">
                                                    <span className="text-sm font-black text-teal-600 dark:text-teal-400 tabular-nums">{formatCurrency(item.totalRealized || 0)}</span>
                                                    {item.type === 'US_STOCK' && inrToUSD(item.totalRealized, item.priceUSD, item.currentPrice) != null && (
                                                        <span className="block text-[9px] font-semibold text-slate-500 dark:text-slate-400">{formatUSD(inrToUSD(item.totalRealized, item.priceUSD, item.currentPrice))}</span>
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-2">Current Holdings</p>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Cost Basis</span>
                                                <span className="text-right">
                                                    <span className="text-sm font-black text-slate-700 dark:text-slate-300 tabular-nums">{formatCurrency(invested)}</span>
                                                    {item.type === 'US_STOCK' && inrToUSD(invested, item.priceUSD, item.currentPrice) != null && (
                                                        <span className="block text-[9px] font-semibold text-slate-500 dark:text-slate-400">{formatUSD(inrToUSD(invested, item.priceUSD, item.currentPrice))}</span>
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Market Value</span>
                                                <span className="text-right" title={item.type === 'US_STOCK' && item.priceUSD != null ? formatUSD((item.totalQty || 0) * item.priceUSD) : undefined}>
                                                    <span className="text-sm font-black text-teal-600 dark:text-teal-400 tabular-nums">
                                                        {formatCurrency(item.currentValue || 0)}
                                                    </span>
                                                    {item.type === 'US_STOCK' && item.priceUSD != null && (
                                                        <span className="block text-[9px] font-semibold text-slate-500 dark:text-slate-400">{formatUSD((item.totalQty || 0) * item.priceUSD)}</span>
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-700">
                                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Unrealized P&L</span>
                                                <span className="text-right">
                                                    <span className={`text-sm font-black tabular-nums ${
                                                        (item.unrealizedGains || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                                    }`}>
                                                        {(item.unrealizedGains || 0) >= 0 ? '+' : ''}{formatCurrency(item.unrealizedGains || 0)}
                                                    </span>
                                                    {item.type === 'US_STOCK' && inrToUSD(item.unrealizedGains, item.priceUSD, item.currentPrice) != null && (
                                                        <span className={`block text-[9px] font-semibold ${(item.unrealizedGains || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                            {(item.unrealizedGains || 0) >= 0 ? '+' : ''}{formatUSD(inrToUSD(item.unrealizedGains, item.priceUSD, item.currentPrice))}
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Section 3: P&L Summary */}
                                <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-2">Profit & Loss</p>
                                    {isFullySold ? (
                                        // ✅ MUST-FIX: For fully sold assets, show only Realized P&L
                                        <div className={`p-2.5 rounded-lg ${
                                            (item.realizedGains || 0) >= 0 
                                                ? 'bg-emerald-50 dark:bg-emerald-900/20' 
                                                : 'bg-rose-50 dark:bg-rose-900/20'
                                        }`}>
                                            <p className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Realized P&L</p>
                                            <p className={`text-sm font-black tabular-nums ${
                                                (item.realizedGains || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                            }`}>
                                                {(item.realizedGains || 0) >= 0 ? '+' : ''}{formatCurrency(item.realizedGains || 0)}
                                            </p>
                                            {item.type === 'US_STOCK' && inrToUSD(item.realizedGains, item.priceUSD, item.currentPrice) != null && (
                                                <p className="text-[9px] font-semibold text-slate-500 dark:text-slate-400">{(item.realizedGains || 0) >= 0 ? '+' : ''}{formatUSD(inrToUSD(item.realizedGains, item.priceUSD, item.currentPrice))}</p>
                                            )}
                                            <p className="text-[8px] text-slate-500 dark:text-slate-400 mt-0.5">From exit</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className={`p-2.5 rounded-lg ${
                                                    (item.realizedGains || 0) >= 0 
                                                        ? 'bg-emerald-50 dark:bg-emerald-900/20' 
                                                        : 'bg-rose-50 dark:bg-rose-900/20'
                                                }`}>
                                                    <p className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Realized</p>
                                                    <p className={`text-sm font-black tabular-nums ${
                                                        (item.realizedGains || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                                    }`}>
                                                        {(item.realizedGains || 0) >= 0 ? '+' : ''}{formatCurrency(item.realizedGains || 0)}
                                                    </p>
                                                    {item.type === 'US_STOCK' && inrToUSD(item.realizedGains, item.priceUSD, item.currentPrice) != null && (
                                                        <p className="text-[9px] font-semibold text-slate-500 dark:text-slate-400">{(item.realizedGains || 0) >= 0 ? '+' : ''}{formatUSD(inrToUSD(item.realizedGains, item.priceUSD, item.currentPrice))}</p>
                                                    )}
                                                    <p className="text-[8px] text-slate-500 dark:text-slate-400 mt-0.5">From sells</p>
                                                </div>
                                                <div className={`p-2.5 rounded-lg ${
                                                    (item.unrealizedGains || 0) >= 0 
                                                        ? 'bg-emerald-50 dark:bg-emerald-900/20' 
                                                        : 'bg-rose-50 dark:bg-rose-900/20'
                                                }`}>
                                                    <p className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Unrealized</p>
                                                    <p className={`text-sm font-black tabular-nums ${
                                                        (item.unrealizedGains || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                                    }`}>
                                                        {(item.unrealizedGains || 0) >= 0 ? '+' : ''}{formatCurrency(item.unrealizedGains || 0)}
                                                    </p>
                                                    {item.type === 'US_STOCK' && inrToUSD(item.unrealizedGains, item.priceUSD, item.currentPrice) != null && (
                                                        <p className="text-[9px] font-semibold text-slate-500 dark:text-slate-400">{(item.unrealizedGains || 0) >= 0 ? '+' : ''}{formatUSD(inrToUSD(item.unrealizedGains, item.priceUSD, item.currentPrice))}</p>
                                                    )}
                                                    <p className="text-[8px] text-slate-500 dark:text-slate-400 mt-0.5">On holdings</p>
                                                </div>
                                            </div>
                                            {/* Total P&L */}
                                            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">Total P&L</span>
                                                    <span className="text-right">
                                                        <span className={`text-base font-black tabular-nums ${
                                                            (item.absReturn || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                                        }`}>
                                                            {(item.absReturn || 0) >= 0 ? '+' : ''}{formatCurrency(item.absReturn || 0)}
                                                        </span>
                                                        {item.type === 'US_STOCK' && inrToUSD(item.absReturn, item.priceUSD, item.currentPrice) != null && (
                                                            <span className={`block text-[9px] font-semibold ${(item.absReturn || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                {(item.absReturn || 0) >= 0 ? '+' : ''}{formatUSD(inrToUSD(item.absReturn, item.priceUSD, item.currentPrice))}
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Section 4: Performance Metrics */}
                                <div className="pt-3 border-t border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-2">
                                    <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">XIRR</p>
                                        {item.xirr !== null && item.xirr !== undefined ? (
                                            <p className={`text-sm font-black tabular-nums ${item.xirr >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                {item.xirr >= 0 ? '+' : ''}{item.xirr.toFixed(1)}%
                                            </p>
                                        ) : (
                                            <p className="text-sm font-bold text-slate-400">N/A</p>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Return %</p>
                                        <p className={`text-sm font-black tabular-nums ${(item.absReturnPercent || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                            {(item.absReturnPercent || 0) >= 0 ? '+' : ''}{(item.absReturnPercent || 0).toFixed(1)}%
                                        </p>
                                    </div>
                                </div>
                            </div>
                            </div>
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
                                        
                                        {/* Transaction Type Selector */}
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
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
                                                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 min-h-[44px] ${
                                                        (editingTransaction.type || 'BUY') === 'BUY'
                                                            ? 'bg-teal-500 text-white shadow-lg'
                                                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-2 border-slate-300 dark:border-slate-700 hover:border-teal-400'
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
                                                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 min-h-[44px] ${
                                                        editingTransaction.type === 'SELL'
                                                            ? 'bg-rose-500 text-white shadow-lg'
                                                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-2 border-slate-300 dark:border-slate-700 hover:border-rose-400'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <TrendingDown size={14} />
                                                        <span>Sell</span>
                                                    </div>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Show holdings warning for sells */}
                                        {editingTransaction.type === 'SELL' && (
                                            <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-2">
                                                <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                                                    Current Holdings: <span className="font-black">{item.totalQty?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || 0}</span> units
                                                </p>
                                            </div>
                                        )}

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
                                            <div className="bg-white dark:bg-slate-800 rounded-lg p-2.5 space-y-1">
                                                <div className="text-center">
                                                    <span className="text-xs text-slate-500">Total Value: </span>
                                                    <span className="text-sm font-black text-slate-800 dark:text-white">
                                                        {formatCurrency((parseFloat(editingTransaction.quantity) || 0) * (parseFloat(editingTransaction.price) || 0))}
                                                    </span>
                                                </div>
                                                {/* Show realized P&L preview for sells */}
                                                {editingTransaction.type === 'SELL' && item.avgPrice && (
                                                    <div className="text-center pt-1 border-t border-slate-200 dark:border-slate-700">
                                                        <span className="text-xs text-slate-500">Est. Realized P&L: </span>
                                                        <span className={`text-xs font-black ${
                                                            ((parseFloat(editingTransaction.price) - item.avgPrice) * (parseFloat(editingTransaction.quantity) || 0)) >= 0
                                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                                : 'text-rose-600 dark:text-rose-400'
                                                        }`}>
                                                            {((parseFloat(editingTransaction.price) - item.avgPrice) * (parseFloat(editingTransaction.quantity) || 0)) >= 0 ? '+' : ''}
                                                            {formatCurrency((parseFloat(editingTransaction.price) - item.avgPrice) * (parseFloat(editingTransaction.quantity) || 0))}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={handleSaveTransaction} 
                                                disabled={saving}
                                                className={`flex-1 py-3 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-1 transition-all ${
                                                    saving 
                                                        ? 'bg-teal-400 cursor-not-allowed' 
                                                        : 'bg-teal-500 active:scale-95'
                                                }`}
                                            >
                                                {saving ? (
                                                    <>
                                                        <Loader2 size={16} className="animate-spin" /> Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Check size={16} /> Save
                                                    </>
                                                )}
                                            </button>
                                            <button 
                                                onClick={() => setEditingTransaction(null)} 
                                                disabled={saving}
                                                className={`flex-1 py-3 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold transition-all ${
                                                    saving ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'
                                                }`}
                                            >
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
                                                
                                                {/* Transaction Type Display (Read-only) */}
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wide">
                                                        Transaction Type:
                                                    </span>
                                                    <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                                                        (tx.type || 'BUY') === 'SELL'
                                                            ? 'bg-rose-500 text-white'
                                                            : 'bg-teal-500 text-white'
                                                    }`}>
                                                        {(tx.type || 'BUY') === 'SELL' ? 'SELL' : 'BUY'}
                                                    </span>
                                                </div>

                                                {(tx.type || 'BUY') === 'SELL' && (
                                                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2.5">
                                                        <div className="text-xs font-bold text-amber-700 dark:text-amber-300">
                                                            Current Holdings: <span className="font-black">{item.totalQty?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || 0}</span> units
                                                        </div>
                                                    </div>
                                                )}

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
                                                                    <button 
                                                                        onClick={handleSaveTransaction} 
                                                                        disabled={saving}
                                                                        className={`flex-1 py-3 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-1 transition-all ${
                                                                            saving 
                                                                                ? 'bg-amber-400 cursor-not-allowed' 
                                                                                : 'bg-amber-500 active:scale-95'
                                                                        }`}
                                                                    >
                                                                        {saving ? (
                                                                            <>
                                                                                <Loader2 size={14} className="animate-spin" /> Saving...
                                                                            </>
                                                                        ) : (
                                                                            'Save'
                                                                        )}
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => setEditingTransaction(null)} 
                                                                        disabled={saving}
                                                                        className={`flex-1 py-3 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold transition-all ${
                                                                            saving ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'
                                                                        }`}
                                                                    >
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
                                            onClick={() => setEditingTransaction({ ...tx, originalType: tx.type || 'BUY', type: tx.type || 'BUY' })}
                                                            className="relative flex items-start gap-3 pl-1 cursor-pointer group"
                                                        >
                                                            {/* Timeline Dot */}
                                                            <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                                                isSell
                                                                    ? 'bg-rose-100 border-2 border-rose-400'
                                                                    : isLongTerm 
                                                                        ? 'bg-emerald-100 border-2 border-emerald-400' 
                                                                        : 'bg-orange-100 border-2 border-orange-400'
                                                            }`}>
                                                                {isSell ? (
                                                                    <TrendingDown size={12} className="text-rose-600" />
                                                                ) : (
                                                                    <TrendingUp size={12} className={isLongTerm ? 'text-emerald-600' : 'text-orange-600'} />
                                                                )}
                                                            </div>

                                                            {/* Transaction Card */}
                                                            <div className={`flex-1 rounded-xl p-3 group-active:opacity-80 transition-colors ${
                                                                isSell
                                                                    ? 'bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800'
                                                                    : 'bg-slate-50 dark:bg-slate-900/50'
                                                            }`}>
                                                                <div className="flex justify-between items-start">
                                                <div>
                                                                        <div className="flex items-center gap-1.5 mb-0.5">
                                                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                                                {new Date(tx.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                            </p>
                                                                            {isSell && (
                                                                                <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[9px] font-black rounded">
                                                                                    SELL
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <p className="text-[10px] text-slate-500 font-medium">
                                                                            {tx.quantity} × ₹{tx.price.toFixed(2)}
                                                                            {item.type === 'US_STOCK' && item.priceUSD != null && item.currentPrice > 0 && (
                                                                                <span className="block text-[9px] text-slate-400">{formatUSD(inrToUSD(tx.quantity * tx.price, item.priceUSD, item.currentPrice))}</span>
                                                                            )}
                                                                        </p>
                                                </div>
                                                <div className="text-right">
                                                                        {!isSell && (
                                                                            <>
                                                                                <p className={`text-sm font-black tabular-nums ${txPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                                                    {txPnl >= 0 ? '+' : ''}{formatCurrency(txPnl)}
                                                                                </p>
                                                                                {item.type === 'US_STOCK' && inrToUSD(txPnl, item.priceUSD, item.currentPrice) != null && (
                                                                                    <p className="text-[9px] font-semibold text-slate-500">{txPnl >= 0 ? '+' : ''}{formatUSD(inrToUSD(txPnl, item.priceUSD, item.currentPrice))}</p>
                                                                                )}
                                                                                <p className={`text-[10px] font-bold ${txPnlPercent >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                                    {txPnlPercent >= 0 ? '+' : ''}{txPnlPercent.toFixed(1)}%
                                                                                </p>
                                                                            </>
                                                                        )}
                                                                        {/* ✅ MUST-FIX: SELL cards - show only realized, drop generic "+₹" */}
                                                                        {isSell && (
                                                                            <div>
                                                                                <p className="text-[8px] font-bold text-rose-500 dark:text-rose-400 uppercase mb-0.5">
                                                                                    Realized
                                                                                </p>
                                                                                <p className={`text-sm font-black tabular-nums ${txPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                                                    {txPnl >= 0 ? '+' : ''}{formatCurrency(txPnl)}
                                                                                </p>
                                                                                {item.type === 'US_STOCK' && inrToUSD(txPnl, item.priceUSD, item.currentPrice) != null && (
                                                                                    <p className="text-[9px] font-semibold text-slate-500">{txPnl >= 0 ? '+' : ''}{formatUSD(inrToUSD(txPnl, item.priceUSD, item.currentPrice))}</p>
                                                                                )}
                                                                            </div>
                                                                        )}
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
                                                                        {item.type === 'US_STOCK' && inrToUSD(tx.quantity * tx.price, item.priceUSD, item.currentPrice) != null && (
                                                                            <span className="ml-1">({formatUSD(inrToUSD(tx.quantity * tx.price, item.priceUSD, item.currentPrice))})</span>
                                                                        )}
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

                    {/* ✅ SHOULD-FIX: Capital Gains & Tax - Moved between Transactions and Dividends */}
                    {item.capitalGains && (
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="p-3 space-y-2">
                                {/* Realized Gains (from sells) */}
                                {((item.capitalGains.realized?.stcg || 0) > 0 || (item.capitalGains.realized?.ltcg || 0) > 0) && (
                                    <div className="space-y-1.5">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase px-1">Realized Gains (Tax Paid)</p>
                                        <div className="flex gap-2">
                                            {/* Realized STCG */}
                                            {(item.capitalGains.realized?.stcg || 0) > 0 && (
                                                <div className="flex-1 bg-orange-50 dark:bg-orange-900/20 px-2.5 py-2 rounded-lg border border-orange-200 dark:border-orange-800">
                                                    <p className="text-[8px] font-bold text-orange-400 uppercase">Short Term</p>
                                                    <p className="text-xs font-black text-orange-600 dark:text-orange-400 tabular-nums">
                                                        {formatCurrency(item.capitalGains.realized.stcg)}
                                                    </p>
                                                    <p className="text-[8px] text-orange-500 dark:text-orange-400 mt-0.5">
                                                        Tax: {formatCurrency(item.capitalGains.realized.stcg * 0.15)}
                                                    </p>
                                                </div>
                                            )}
                                            {/* Realized LTCG */}
                                            {(item.capitalGains.realized?.ltcg || 0) > 0 && (
                                                <div className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                                    <p className="text-[8px] font-bold text-emerald-400 uppercase">Long Term</p>
                                                    <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                                                        {formatCurrency(item.capitalGains.realized.ltcg)}
                                                    </p>
                                                    <p className="text-[8px] text-emerald-500 dark:text-emerald-400 mt-0.5">
                                                        ₹1.25L exempt • {formatCurrency(Math.max(0, item.capitalGains.realized.ltcg - 125000) * 0.10)}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Unrealized Gains (if sold today) - Only show for open positions */}
                                {!isFullySold && ((item.capitalGains.unrealized?.stcg || 0) > 0 || (item.capitalGains.unrealized?.ltcg || 0) > 0) && (
                                    <div className="space-y-1.5">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase px-1">Tax if Sold Today</p>
                                        <div className="flex gap-2">
                                            {/* Unrealized STCG */}
                                            {(item.capitalGains.unrealized?.stcg || 0) > 0 && (
                                                <div className="flex-1 bg-orange-50 dark:bg-orange-900/20 px-2.5 py-2 rounded-lg border border-orange-200 dark:border-orange-800">
                                                    <p className="text-[8px] font-bold text-orange-400 uppercase">Short Term</p>
                                                    <p className="text-xs font-black text-orange-600 dark:text-orange-400 tabular-nums">
                                                        {formatCurrency(item.capitalGains.unrealized.stcg)}
                                                    </p>
                                                    <p className="text-[8px] text-orange-500 dark:text-orange-400 mt-0.5">
                                                        Tax: {formatCurrency(item.capitalGains.unrealized.stcg * 0.15)}
                                                    </p>
                                                </div>
                                            )}
                                            {/* Unrealized LTCG */}
                                            {(item.capitalGains.unrealized?.ltcg || 0) > 0 && (
                                                <div className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                                    <p className="text-[8px] font-bold text-emerald-400 uppercase">Long Term</p>
                                                    <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                                                        {formatCurrency(item.capitalGains.unrealized.ltcg)}
                                                    </p>
                                                    <p className="text-[8px] text-emerald-500 dark:text-emerald-400 mt-0.5">
                                                        ₹1.25L exempt • {formatCurrency(Math.max(0, item.capitalGains.unrealized.ltcg - 125000) * 0.10)}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

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
                                            <button 
                                                onClick={handleSaveDividend} 
                                                disabled={saving}
                                                className={`flex-1 py-3 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-1 transition-all ${
                                                    saving 
                                                        ? 'bg-emerald-400 cursor-not-allowed' 
                                                        : 'bg-emerald-500 active:scale-95'
                                                }`}
                                            >
                                                {saving ? (
                                                    <>
                                                        <Loader2 size={16} className="animate-spin" /> Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Check size={16} /> Save
                                                    </>
                                                )}
                                            </button>
                                            <button 
                                                onClick={() => setEditingTransaction(null)} 
                                                disabled={saving}
                                                className={`flex-1 py-3 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold transition-all ${
                                                    saving ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'
                                                }`}
                                            >
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


                    {/* Delete Asset - Subtle at bottom */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onDeleteAsset(item); }}
                        className="w-full py-2 text-[10px] font-medium text-slate-400 hover:text-rose-500 transition-colors flex items-center justify-center gap-1"
                    >
                        <Trash2 size={10} /> Remove this asset
                    </button>
                </div>
                </div>
            </div>
        </div>
    );
};

export default MobileAssetCard;
