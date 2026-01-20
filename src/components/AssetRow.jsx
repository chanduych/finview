import React, { useEffect, useRef } from 'react';
import {
    History, ChevronUp, MoreVertical, Trash2, Edit3, Save,
    Plus, ShieldAlert
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
 */
const AssetRow = ({
    item,
    pnlView = 'total',
    expandedAsset,
    setExpandedAsset,
    marketPrices,
    setMarketPrices,
    editingId,
    setEditingId,
    editValue,
    setEditValue,
    assetMenuOpen,
    setAssetMenuOpen,
    onDeleteAsset,
    editingTransaction,
    setEditingTransaction,
    portfolio,
    setPortfolio
}) => {
    const isExpanded = expandedAsset === item.id;

    const handleToggleExpand = () => {
        setExpandedAsset(isExpanded ? null : item.id);
    };

    const handleEditPrice = () => {
        setEditingId(item.id);
        setEditValue(item.currentPrice);
    };

    const handleSavePrice = () => {
        setMarketPrices(prev => ({
            ...prev,
            [item.symbol]: {
                price: parseFloat(editValue),
                change: 0,
                changePercent: 0
            }
        }));
        setEditingId(null);
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
        const newTx = {
            id: Date.now(),
            price: item.currentPrice,
            quantity: 0,
            date: new Date().toISOString().split('T')[0]
        };
        setPortfolio(prev => prev.map(a =>
            a.id === item.id
                ? { ...a, transactions: [...a.transactions, newTx] }
                : a
        ));
        setEditingTransaction(newTx);
    };

    const handleSaveTransaction = (tx) => {
        setPortfolio(prev => prev.map(a =>
            a.id === item.id
                ? {
                    ...a,
                    transactions: a.transactions.map(t =>
                        t.id === tx.id ? editingTransaction : t
                    )
                }
                : a
        ));
        setEditingTransaction(null);
    };

    const handleDeleteTransaction = (tx) => {
        setPortfolio(prev => prev.map(a =>
            a.id === item.id
                ? {
                    ...a,
                    transactions: a.transactions.filter(t => t.id !== tx.id)
                }
                : a
        ));
        setEditingTransaction(null);
    };

    const handleAddDividend = () => {
        const newDiv = {
            id: Date.now(),
            amount: 0,
            date: new Date().toISOString().split('T')[0]
        };
        setPortfolio(prev => prev.map(a =>
            a.id === item.id
                ? { ...a, dividends: [...(a.dividends || []), newDiv] }
                : a
        ));
        setEditingTransaction({ ...newDiv, divId: newDiv.id, amount: '' });
    };

    const handleSaveDividend = (div) => {
        const amount = typeof editingTransaction.amount === 'string'
            ? parseFloat(editingTransaction.amount) || 0
            : editingTransaction.amount;

        setPortfolio(prev => prev.map(a =>
            a.id === item.id
                ? {
                    ...a,
                    dividends: a.dividends.map(d =>
                        d.id === div.id
                            ? { id: div.id, date: editingTransaction.date, amount: amount }
                            : d
                    )
                }
                : a
        ));
        setEditingTransaction(null);
    };

    const handleDeleteDividend = (div) => {
        setPortfolio(prev => prev.map(a =>
            a.id === item.id
                ? {
                    ...a,
                    dividends: a.dividends.filter(d => d.id !== div.id)
                }
                : a
        ));
        setEditingTransaction(null);
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

                {/* LTP (Edit) Column */}
                <td className="px-3 md:px-6 py-4 md:py-6 text-right tabular-nums">
                    {editingId === item.id ? (
                        <div className="flex items-center justify-end gap-2">
                            <input
                                autoFocus
                                type="number"
                                className="w-20 md:w-24 px-2 py-1 min-h-[36px] bg-white border border-indigo-300 rounded-lg text-right text-xs font-bold outline-none touch-manipulation"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSavePrice()}
                            />
                            <button
                                onClick={handleSavePrice}
                                className="text-indigo-600 p-2 min-w-[36px] min-h-[36px] flex items-center justify-center touch-manipulation"
                            >
                                <Save size={16} />
                            </button>
                        </div>
                    ) : (
                        <div
                            className="cursor-pointer group/price inline-block"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleEditPrice();
                            }}
                        >
                            <div className="font-black text-slate-800 flex items-center gap-1 justify-end text-xs md:text-sm">
                                ₹{item.currentPrice?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                <Edit3 size={14} className="text-slate-300 opacity-0 group-hover/price:opacity-100" />
                            </div>
                            <div className={`text-[10px] font-black ${
                                item.dayChangePercent >= 0 ? 'text-emerald-500' : 'text-rose-500'
                            }`}>
                                {item.dayChangePercent >= 0 ? '+' : ''}{item.dayChangePercent.toFixed(2)}%
                            </div>
                        </div>
                    )}
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
                                            {[...item.transactions]
                                                .sort((a, b) => new Date(b.date) - new Date(a.date))
                                                .map((tx, idx) => {
                                                    const txPnl = (item.currentPrice - tx.price) * tx.quantity;
                                                    const txPnlPercent = tx.price > 0 ? ((item.currentPrice - tx.price) / tx.price) * 100 : 0;
                                                    const invested = tx.quantity * tx.price;
                                                    const currentVal = item.currentPrice * tx.quantity;

                                                    return (
                                                        <tr key={tx.id || idx} className="hover:bg-slate-50/50 transition-colors">
                                                            {editingTransaction?.id === tx.id ? (
                                                                <>
                                                                    <td className="px-3 md:px-4 py-2.5">
                                                                        <input
                                                                            type="date"
                                                                            value={editingTransaction.date}
                                                                            onChange={e => setEditingTransaction({
                                                                                ...editingTransaction,
                                                                                date: e.target.value
                                                                            })}
                                                                            className="w-full min-h-[36px] px-2 py-1 text-[10px] border border-indigo-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 touch-manipulation"
                                                                        />
                                                                    </td>
                                                                    <td className="px-3 md:px-4 py-2.5">
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
                                                                    </td>
                                                                    <td className="px-3 md:px-4 py-2.5">
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
                                                                    </td>
                                                                    <td colSpan="4" className="px-3 md:px-4 py-2.5">
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
                                                                    </td>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <td className="px-3 md:px-4 py-2.5">
                                                                        <p className="text-xs font-bold text-slate-700 whitespace-nowrap">
                                                                            {new Date(tx.date).toLocaleDateString('en-IN', {
                                                                                day: '2-digit',
                                                                                month: 'short',
                                                                                year: 'numeric'
                                                                            })}
                                                                        </p>
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
                                                                        <p className="text-xs font-black text-indigo-600 tabular-nums">
                                                                            {formatCurrency(currentVal)}
                                                                        </p>
                                                                    </td>
                                                                    <td className="px-3 md:px-4 py-2.5 text-right">
                                                                        <div className="flex flex-col items-end">
                                                                            <p className={`text-xs font-black tabular-nums ${
                                                                                txPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                                                            }`}>
                                                                                {txPnl >= 0 ? '+' : ''}{formatCurrency(txPnl)}
                                                                            </p>
                                                                            <p className={`text-[9px] font-bold ${
                                                                                txPnlPercent >= 0 ? 'text-emerald-500' : 'text-rose-500'
                                                                            }`}>
                                                                                {txPnlPercent >= 0 ? '+' : ''}{txPnlPercent.toFixed(2)}%
                                                                            </p>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-3 md:px-4 py-2.5 text-center">
                                                                        <button
                                                                            onClick={() => setEditingTransaction({ ...tx })}
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
                            {(item.dividends && item.dividends.length > 0) && (
                                <div className="mt-4">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                        Dividends
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                                        {item.dividends.map((div, idx) => (
                                            <div key={div.id || idx} className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                                                {editingTransaction?.divId === div.id ? (
                                                    <div className="space-y-2">
                                                        <input
                                                            type="date"
                                                            value={editingTransaction.date}
                                                            onChange={e => setEditingTransaction({
                                                                ...editingTransaction,
                                                                date: e.target.value
                                                            })}
                                                            className="w-full min-h-[36px] px-2 py-1 text-[10px] border rounded touch-manipulation"
                                                        />
                                                        <input
                                                            type="number"
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
                                                                    amount: val === '' ? '' : (parseFloat(val) || 0)
                                                                });
                                                            }}
                                                            className="w-full min-h-[36px] px-2 py-1 text-[10px] border rounded touch-manipulation"
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
