import React, { useState, useRef, useEffect } from 'react';
import {
    ChevronDown, ChevronUp, Edit3, Save, Plus, Trash2, MoreVertical,
    TrendingUp, TrendingDown, ShieldAlert
} from 'lucide-react';
import { formatCurrency, formatCurrencyWithDecimals } from '../utils/formatters';

/**
 * MobileAssetCard Component - Mobile-optimized card layout for assets
 *
 * This is a completely different UI from the desktop table view,
 * designed specifically for mobile screens with:
 * - Card-based layout instead of table rows
 * - Large touch targets
 * - Vertical information stacking
 * - Collapsible sections
 * - Easy-to-read typography
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
    const [editingPrice, setEditingPrice] = useState(false);
    const [priceValue, setPriceValue] = useState(item.currentPrice);
    const [showMenu, setShowMenu] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);

    const menuRef = useRef(null);

    // Click-outside to close menu
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [showMenu]);

    const handleSavePrice = () => {
        // Update price logic would go here
        setEditingPrice(false);
    };

    const handleAddTransaction = () => {
        const newTx = {
            id: Date.now(),
            price: item.currentPrice,
            quantity: 0,
            date: new Date().toISOString().split('T')[0]
        };
        onAddTransaction(item.id, newTx);
        setEditingTransaction(newTx);
    };

    const handleSaveTransaction = () => {
        if (editingTransaction) {
            onUpdateTransaction(item.id, editingTransaction.id, editingTransaction);
            setEditingTransaction(null);
        }
    };

    const handleDeleteTransaction = (txId) => {
        onDeleteTransaction(item.id, txId);
        setEditingTransaction(null);
    };

    const handleAddDividend = () => {
        const newDiv = {
            id: Date.now(),
            amount: 0,
            date: new Date().toISOString().split('T')[0]
        };
        onAddDividend(item.id, newDiv);
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden active:shadow-md transition-shadow">
            {/* Card Header - Compact, Always Visible */}
            <div
                className="p-3 cursor-pointer active:bg-slate-50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center justify-between gap-3">
                    {/* Asset Icon & Name */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-lg ${
                            item.type === 'STOCK' ? 'bg-indigo-100 text-indigo-600' :
                            item.type === 'MF' ? 'bg-emerald-100 text-emerald-600' :
                            item.type === 'ETF' ? 'bg-purple-100 text-purple-600' :
                            'bg-amber-100 text-amber-600'
                        } flex items-center justify-center font-black text-xs shrink-0`}>
                            {item.symbol.substring(0, 2)}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="font-black text-slate-800 text-sm truncate leading-tight">
                                {item.name || item.symbol}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] text-slate-400 font-bold">
                                    {item.totalQty} @ ₹{item.avgPrice.toFixed(2)}
                                </span>
                                <span className={`text-[9px] font-black ${
                                    item.absReturnPercent >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                }`}>
                                    {item.absReturnPercent >= 0 ? '↑' : '↓'} {Math.abs(item.absReturnPercent).toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Returns - Compact with Toggle */}
                    <div className="text-right flex flex-col items-end gap-1">
                        {pnlView === 'total' ? (
                            <>
                                <p className={`text-base font-black ${
                                    item.absReturn >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                }`}>
                                    {item.absReturn >= 0 ? '+' : ''}{formatCurrency(item.absReturn)}
                                </p>
                                <p className="text-[10px] text-slate-500 font-bold">
                                    ₹{item.currentPrice?.toFixed(2)}
                                </p>
                            </>
                        ) : (
                            <>
                                <p className={`text-base font-black ${
                                    item.dayChange >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                }`}>
                                    {item.dayChange >= 0 ? '+' : ''}{formatCurrency(item.dayChange)}
                                </p>
                                <p className={`text-[10px] font-bold ${
                                    item.dayChangePercent >= 0 ? 'text-emerald-500' : 'text-rose-500'
                                }`}>
                                    {item.dayChangePercent >= 0 ? '+' : ''}{item.dayChangePercent.toFixed(2)}%
                                </p>
                            </>
                        )}
                    </div>

                    {/* Expand Indicator */}
                    <div className="text-slate-400">
                        {isExpanded ? (
                            <ChevronUp size={18} />
                        ) : (
                            <ChevronDown size={18} />
                        )}
                    </div>
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="border-t border-slate-200 bg-slate-50 p-4 space-y-4">
                    {/* Quick Actions */}
                    <div className="flex gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setEditingPrice(true);
                            }}
                            className="flex-1 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold min-h-[36px] flex items-center justify-center gap-1"
                        >
                            <Edit3 size={14} />
                            Edit Price
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteAsset(item);
                            }}
                            className="px-4 py-2 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold min-h-[36px] flex items-center justify-center gap-1"
                        >
                            <Trash2 size={14} />
                            Delete
                        </button>
                    </div>

                    {/* Price Edit Mode */}
                    {editingPrice && (
                        <div className="bg-white p-3 rounded-xl border border-indigo-200 space-y-2">
                            <label className="text-[9px] font-black text-slate-500 uppercase">
                                Update Current Price
                            </label>
                            <div className="flex gap-2">
                                <input
                                    autoFocus
                                    type="number"
                                    className="flex-1 px-3 py-2 min-h-[44px] bg-white border border-indigo-300 rounded-lg text-sm font-bold"
                                    value={priceValue}
                                    onChange={(e) => setPriceValue(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSavePrice();
                                    }}
                                    className="px-4 py-2 min-h-[44px] bg-indigo-600 text-white rounded-lg font-bold"
                                >
                                    <Save size={16} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingPrice(false);
                                        setPriceValue(item.currentPrice);
                                    }}
                                    className="px-4 py-2 min-h-[44px] bg-slate-200 text-slate-600 rounded-lg font-bold"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Detailed Metrics */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">
                                Invested
                            </p>
                            <p className="text-base font-black text-slate-800">
                                {formatCurrency(item.investedValue)}
                            </p>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">
                                Current
                            </p>
                            <p className="text-base font-black text-indigo-600">
                                {formatCurrency(item.currentValue)}
                            </p>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">
                                XIRR
                            </p>
                            {item.xirr !== null && item.xirr !== undefined ? (
                                <p className={`text-base font-black ${
                                    item.xirr >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                }`}>
                                    {item.xirr >= 0 ? '+' : ''}{item.xirr.toFixed(2)}%
                                </p>
                            ) : (
                                <p className="text-sm font-bold text-slate-400">N/A</p>
                            )}
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">
                                Tax Info
                            </p>
                            {item.capitalGains && (item.capitalGains.stcg > 0 || item.capitalGains.ltcg > 0) ? (
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-black text-orange-600">
                                        STCG: {formatCurrency(item.capitalGains.stcg)}
                                    </p>
                                    <p className="text-[10px] font-black text-emerald-600">
                                        LTCG: {formatCurrency(item.capitalGains.ltcg)}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-sm font-bold text-slate-400">No gains</p>
                            )}
                        </div>
                    </div>

                    {/* Tax Intelligence */}
                    {item.capitalGains && (item.capitalGains.stcg > 0 || item.capitalGains.ltcg > 0) && (
                        <div className="bg-white p-4 rounded-xl border border-slate-200">
                            <div className="flex items-center gap-2 mb-3">
                                <ShieldAlert className="text-indigo-600" size={16} />
                                <h4 className="text-[10px] font-black text-slate-600 uppercase">
                                    Tax if Sold Today
                                </h4>
                            </div>
                            <div className="space-y-2">
                                {item.capitalGains.stcg > 0 && (
                                    <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="text-[9px] font-black text-orange-600 uppercase">
                                                STCG (20%)
                                            </p>
                                            <p className="text-sm font-black text-orange-700">
                                                {formatCurrency(item.capitalGains.stcg * 0.20)}
                                            </p>
                                        </div>
                                        <p className="text-[9px] text-slate-600 font-bold">
                                            Gain: {formatCurrency(item.capitalGains.stcg)}
                                        </p>
                                    </div>
                                )}
                                {item.capitalGains.ltcg > 0 && (
                                    <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="text-[9px] font-black text-emerald-600 uppercase">
                                                LTCG (12.5%)
                                            </p>
                                            <p className="text-sm font-black text-emerald-700">
                                                {formatCurrency(Math.max(0, item.capitalGains.ltcg - 125000) * 0.125)}
                                            </p>
                                        </div>
                                        <p className="text-[9px] text-slate-600 font-bold">
                                            Gain: {formatCurrency(item.capitalGains.ltcg)}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Transactions Section */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase">
                                Transactions ({item.transactions?.length || 0})
                            </h4>
                            <button
                                onClick={handleAddTransaction}
                                className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase flex items-center gap-1 min-h-[36px]"
                            >
                                <Plus size={12} />
                                Add
                            </button>
                        </div>

                        <div className="space-y-2">
                            {item.transactions && [...item.transactions]
                                .sort((a, b) => new Date(b.date) - new Date(a.date))
                                .map((tx) => {
                                    const txPnl = (item.currentPrice - tx.price) * tx.quantity;
                                    const txPnlPercent = tx.price > 0 ? ((item.currentPrice - tx.price) / tx.price) * 100 : 0;

                                    if (editingTransaction?.id === tx.id) {
                                        return (
                                            <div key={tx.id} className="bg-indigo-50 p-3 rounded-lg space-y-2">
                                                <input
                                                    type="date"
                                                    value={editingTransaction.date}
                                                    onChange={(e) => setEditingTransaction({
                                                        ...editingTransaction,
                                                        date: e.target.value
                                                    })}
                                                    className="w-full px-3 py-2 min-h-[44px] border border-indigo-300 rounded-lg text-sm"
                                                />
                                                <div className="grid grid-cols-2 gap-2">
                                                    <input
                                                        type="number"
                                                        placeholder="Quantity"
                                                        value={editingTransaction.quantity}
                                                        onChange={(e) => setEditingTransaction({
                                                            ...editingTransaction,
                                                            quantity: parseFloat(e.target.value) || 0
                                                        })}
                                                        className="px-3 py-2 min-h-[44px] border border-indigo-300 rounded-lg text-sm"
                                                    />
                                                    <input
                                                        type="number"
                                                        placeholder="Price"
                                                        value={editingTransaction.price}
                                                        onChange={(e) => setEditingTransaction({
                                                            ...editingTransaction,
                                                            price: parseFloat(e.target.value) || 0
                                                        })}
                                                        className="px-3 py-2 min-h-[44px] border border-indigo-300 rounded-lg text-sm"
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={handleSaveTransaction}
                                                        className="flex-1 py-2 min-h-[44px] bg-emerald-600 text-white rounded-lg text-xs font-bold"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingTransaction(null)}
                                                        className="flex-1 py-2 min-h-[44px] bg-slate-200 text-slate-600 rounded-lg text-xs font-bold"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteTransaction(tx.id)}
                                                        className="px-3 py-2 min-h-[44px] bg-rose-500 text-white rounded-lg"
                                                    >
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
                                            className="bg-slate-50 p-3 rounded-lg active:bg-slate-100 transition-colors"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="text-xs font-bold text-slate-700">
                                                        {new Date(tx.date).toLocaleDateString('en-IN', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                                                        {tx.quantity} @ ₹{tx.price.toFixed(2)}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-sm font-black ${
                                                        txPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                                    }`}>
                                                        {txPnl >= 0 ? '+' : ''}{formatCurrency(txPnl)}
                                                    </p>
                                                    <p className={`text-[10px] font-bold ${
                                                        txPnlPercent >= 0 ? 'text-emerald-500' : 'text-rose-500'
                                                    }`}>
                                                        {txPnlPercent >= 0 ? '+' : ''}{txPnlPercent.toFixed(2)}%
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>

                    {/* Dividends Section */}
                    {item.dividends && item.dividends.length > 0 && (
                        <div className="bg-white p-4 rounded-xl border border-slate-200">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase mb-3">
                                Dividends
                            </h4>
                            <div className="space-y-2">
                                {item.dividends.map((div) => (
                                    <div key={div.id} className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-[10px] text-emerald-600 font-bold">
                                                    {div.date}
                                                </p>
                                                <p className="text-sm font-black text-emerald-700">
                                                    {formatCurrencyWithDecimals(div.amount)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={handleAddDividend}
                                className="w-full mt-3 px-4 py-2 min-h-[44px] bg-emerald-100 text-emerald-700 rounded-lg text-[9px] font-black uppercase"
                            >
                                <Plus size={12} className="inline mr-1" />
                                Add Dividend
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MobileAssetCard;
