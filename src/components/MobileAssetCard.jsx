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
            {/* Card Header - Always Visible */}
            <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-12 h-12 rounded-xl ${
                            item.type === 'STOCK' ? 'bg-indigo-100 text-indigo-600' :
                            item.type === 'MF' ? 'bg-emerald-100 text-emerald-600' :
                            item.type === 'ETF' ? 'bg-purple-100 text-purple-600' :
                            'bg-amber-100 text-amber-600'
                        } flex items-center justify-center font-black text-sm shrink-0`}>
                            {item.symbol.substring(0, 2)}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="font-black text-slate-800 text-sm truncate">
                                {item.name || item.symbol}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-[9px] text-slate-400 font-bold uppercase">
                                    {item.account}
                                </span>
                                <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                <span className="text-[8px] text-slate-300 font-black uppercase">
                                    {item.symbol}
                                </span>
                            </div>
                            {/* Performance Badges */}
                            <div className="flex gap-1.5 mt-2">
                                <span className={`px-2 py-0.5 rounded-md text-[8px] font-black ${
                                    item.absReturnPercent >= 0
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-rose-100 text-rose-700'
                                }`}>
                                    {item.absReturnPercent >= 0 ? '↑' : '↓'} {Math.abs(item.absReturnPercent).toFixed(1)}%
                                </span>
                                {item.xirr !== null && item.xirr !== undefined && (
                                    <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-[8px] font-black">
                                        XIRR: {item.xirr.toFixed(1)}%
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="relative flex items-center gap-2" ref={menuRef}>
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 active:bg-slate-50 rounded-lg transition-colors"
                        >
                            <MoreVertical size={18} />
                        </button>
                        {showMenu && (
                            <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 min-w-[160px] overflow-hidden">
                                <button
                                    onClick={() => {
                                        onDeleteAsset(item);
                                        setShowMenu(false);
                                    }}
                                    className="w-full px-4 py-3 min-h-[44px] text-left text-sm font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                >
                                    <Trash2 size={16} />
                                    Delete Asset
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Key Metrics - Compact View */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                    {/* Quantity & Avg */}
                    <div className="bg-slate-50 p-3 rounded-xl">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">
                            Holdings
                        </p>
                        <p className="font-black text-slate-800 text-sm">
                            {item.totalQty} Units
                        </p>
                        <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                            @ ₹{item.avgPrice.toFixed(2)}
                        </p>
                    </div>

                    {/* Current Price */}
                    <div className="bg-slate-50 p-3 rounded-xl">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">
                            LTP
                        </p>
                        {editingPrice ? (
                            <div className="flex items-center gap-2">
                                <input
                                    autoFocus
                                    type="number"
                                    className="w-20 px-2 py-1 min-h-[32px] bg-white border border-indigo-300 rounded-lg text-sm font-bold"
                                    value={priceValue}
                                    onChange={(e) => setPriceValue(e.target.value)}
                                />
                                <button
                                    onClick={handleSavePrice}
                                    className="text-indigo-600 p-1 min-w-[32px] min-h-[32px]"
                                >
                                    <Save size={16} />
                                </button>
                            </div>
                        ) : (
                            <div onClick={() => setEditingPrice(true)}>
                                <p className="font-black text-slate-800 text-sm flex items-center gap-1">
                                    ₹{item.currentPrice?.toFixed(2)}
                                    <Edit3 size={12} className="text-slate-300" />
                                </p>
                                <p className={`text-[10px] font-black mt-0.5 ${
                                    item.dayChangePercent >= 0 ? 'text-emerald-500' : 'text-rose-500'
                                }`}>
                                    {item.dayChangePercent >= 0 ? '+' : ''}{item.dayChangePercent.toFixed(2)}%
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Returns - Prominent */}
                <div className={`p-4 rounded-xl ${
                    item.absReturn >= 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'
                }`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[9px] font-black text-slate-500 uppercase mb-1">
                                Total Returns
                            </p>
                            <p className={`text-xl font-black ${
                                item.absReturn >= 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}>
                                {item.absReturn >= 0 ? '+' : ''}{formatCurrency(item.absReturn)}
                            </p>
                            <p className={`text-xs font-bold mt-1 ${
                                item.absReturnPercent >= 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}>
                                {item.absReturnPercent >= 0 ? '+' : ''}{item.absReturnPercent.toFixed(2)}% ROI
                            </p>
                        </div>
                        {item.absReturn >= 0 ? (
                            <TrendingUp size={32} className="text-emerald-400" />
                        ) : (
                            <TrendingDown size={32} className="text-rose-400" />
                        )}
                    </div>
                </div>

                {/* Expand/Collapse Button */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full mt-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-center gap-2 text-slate-600 font-bold text-xs transition-colors min-h-[44px]"
                >
                    {isExpanded ? (
                        <>
                            <ChevronUp size={16} />
                            Hide Details
                        </>
                    ) : (
                        <>
                            <ChevronDown size={16} />
                            View Details
                        </>
                    )}
                </button>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="border-t border-slate-200 bg-slate-50 p-4 space-y-4">
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
