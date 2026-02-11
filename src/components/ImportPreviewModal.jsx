import React, { useState, useMemo } from 'react';
import {
    X,
    Check,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    Trash2,
    Calendar,
    Wallet,
    TrendingUp,
    TrendingDown,
    Hash,
    IndianRupee,
    FileText,
    CheckCircle2,
    XCircle
} from 'lucide-react';

/**
 * ImportPreviewModal - Interactive preview and editing before final import
 *
 * Features:
 * - Review all detected assets
 * - Edit individual fields (date, wallet, quantity, price)
 * - Accept/Reject each asset
 * - Bulk operations
 * - Validation feedback
 */
const ImportPreviewModal = ({
    isOpen,
    onClose,
    previewAssets,
    stats,
    accounts,
    onConfirmImport,
    isImporting = false
}) => {
    const [assets, setAssets] = useState(previewAssets);
    const [expandedAsset, setExpandedAsset] = useState(null);
    const [selectedWalletFilter, setSelectedWalletFilter] = useState('all');

    if (!isOpen) return null;

    // Compute statistics
    const acceptedCount = assets.filter(a => a.accepted).length;
    const rejectedCount = assets.filter(a => !a.accepted).length;
    const totalValue = assets
        .filter(a => a.accepted)
        .reduce((sum, a) => sum + (a.quantity * a.price), 0);

    // Update asset field
    const updateAsset = (id, field, value) => {
        setAssets(prev => prev.map(asset =>
            asset.id === id ? { ...asset, [field]: value } : asset
        ));
    };

    // Toggle asset acceptance
    const toggleAccept = (id) => {
        setAssets(prev => prev.map(asset =>
            asset.id === id ? { ...asset, accepted: !asset.accepted } : asset
        ));
    };

    // Bulk accept all
    const acceptAll = () => {
        setAssets(prev => prev.map(asset => ({ ...asset, accepted: true })));
    };

    // Bulk reject all
    const rejectAll = () => {
        setAssets(prev => prev.map(asset => ({ ...asset, accepted: false })));
    };

    // Assign wallet to all accepted assets
    const assignWalletToAll = (wallet) => {
        setAssets(prev => prev.map(asset =>
            asset.accepted ? { ...asset, account: wallet } : asset
        ));
    };

    // Handle confirm import
    const handleConfirm = () => {
        const acceptedAssets = assets.filter(a => a.accepted);
        onConfirmImport(acceptedAssets);
    };

    // Filter assets
    const filteredAssets = useMemo(() => {
        if (selectedWalletFilter === 'all') return assets;
        return assets.filter(a => a.account === selectedWalletFilter);
    }, [assets, selectedWalletFilter]);

    // Get unique wallets
    const uniqueWallets = [...new Set(assets.map(a => a.account))];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800">Import Preview</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Review and edit assets before importing
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                    >
                        <X size={20} className="text-slate-600" />
                    </button>
                </div>

                {/* Stats Bar */}
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                            <p className="text-xs font-bold text-slate-400 uppercase">Total Assets</p>
                            <p className="text-2xl font-black text-slate-800 mt-1">{assets.length}</p>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-emerald-200">
                            <p className="text-xs font-bold text-emerald-600 uppercase">Accepted</p>
                            <p className="text-2xl font-black text-emerald-600 mt-1">{acceptedCount}</p>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-rose-200">
                            <p className="text-xs font-bold text-rose-600 uppercase">Rejected</p>
                            <p className="text-2xl font-black text-rose-600 mt-1">{rejectedCount}</p>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-indigo-200">
                            <p className="text-xs font-bold text-indigo-600 uppercase">Total Value</p>
                            <p className="text-2xl font-black text-indigo-600 mt-1">₹{totalValue.toLocaleString('en-IN')}</p>
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="px-6 py-3 border-b border-slate-200 flex flex-wrap items-center gap-3">
                    <button
                        onClick={acceptAll}
                        className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-colors"
                    >
                        <CheckCircle2 size={14} />
                        Accept All
                    </button>
                    <button
                        onClick={rejectAll}
                        className="px-3 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-colors"
                    >
                        <XCircle size={14} />
                        Reject All
                    </button>

                    <div className="ml-auto flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500">Assign wallet to all:</span>
                        <select
                            onChange={(e) => assignWalletToAll(e.target.value)}
                            className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold bg-white"
                            value=""
                        >
                            <option value="">Select wallet...</option>
                            {accounts.map(acc => (
                                <option key={acc} value={acc}>{acc}</option>
                            ))}
                        </select>
                    </div>

                    <select
                        value={selectedWalletFilter}
                        onChange={(e) => setSelectedWalletFilter(e.target.value)}
                        className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold bg-white"
                    >
                        <option value="all">All Wallets</option>
                        {uniqueWallets.map(wallet => (
                            <option key={wallet} value={wallet}>{wallet}</option>
                        ))}
                    </select>
                </div>

                {/* Assets List */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                    {filteredAssets.map((asset) => (
                        <AssetPreviewCard
                            key={asset.id}
                            asset={asset}
                            accounts={accounts}
                            isExpanded={expandedAsset === asset.id}
                            onToggleExpand={() => setExpandedAsset(expandedAsset === asset.id ? null : asset.id)}
                            onUpdate={updateAsset}
                            onToggleAccept={toggleAccept}
                        />
                    ))}

                    {filteredAssets.length === 0 && (
                        <div className="text-center py-12">
                            <FileText size={48} className="text-slate-200 mx-auto mb-3" />
                            <p className="text-slate-400 font-bold">No assets to display</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={acceptedCount === 0 || isImporting}
                        className="px-8 py-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-xl font-black shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                    >
                        {isImporting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Importing...
                            </>
                        ) : (
                            <>
                                <Check size={20} />
                                Import {acceptedCount} Assets
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

/**
 * Individual Asset Preview Card with inline editing
 */
const AssetPreviewCard = ({
    asset,
    accounts,
    isExpanded,
    onToggleExpand,
    onUpdate,
    onToggleAccept
}) => {
    const totalValue = asset.quantity * asset.price;

    return (
        <div
            className={`border-2 rounded-xl transition-all ${
                asset.accepted
                    ? 'border-emerald-200 bg-emerald-50/50'
                    : 'border-slate-200 bg-slate-50 opacity-60'
            }`}
        >
            {/* Card Header */}
            <div className="p-4 flex items-center gap-4">
                {/* Accept/Reject Checkbox */}
                <button
                    onClick={() => onToggleAccept(asset.id)}
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                        asset.accepted
                            ? 'bg-emerald-500 border-emerald-500'
                            : 'bg-white border-slate-300 hover:border-slate-400'
                    }`}
                >
                    {asset.accepted && <Check size={16} className="text-white" strokeWidth={3} />}
                </button>

                {/* Asset Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-black text-slate-800 text-base">{asset.symbol}</h4>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            asset.type === 'STOCK' ? 'bg-indigo-100 text-indigo-600' :
                            asset.type === 'MF' ? 'bg-emerald-100 text-emerald-600' :
                            'bg-purple-100 text-purple-600'
                        }`}>
                            {asset.type}
                        </span>
                        {asset.transactionType === 'SELL' && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-rose-100 text-rose-600">
                                SELL
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-slate-600">{asset.name}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs">
                        <span className="text-slate-500">
                            <span className="font-bold">Qty:</span> {asset.quantity}
                        </span>
                        <span className="text-slate-500">
                            <span className="font-bold">Price:</span> ₹{asset.price.toFixed(2)}
                        </span>
                        <span className="font-bold text-indigo-600">
                            Total: ₹{totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>

                {/* Expand Button */}
                <button
                    onClick={onToggleExpand}
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
            </div>

            {/* Expanded Editor */}
            {isExpanded && (
                <div className="px-4 pb-4 border-t border-slate-200 pt-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Quantity */}
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1">
                                <Hash size={12} /> Quantity
                            </label>
                            <input
                                type="number"
                                value={asset.quantity}
                                onChange={(e) => onUpdate(asset.id, 'quantity', parseFloat(e.target.value))}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold"
                            />
                        </div>

                        {/* Price */}
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1">
                                <IndianRupee size={12} /> Price
                            </label>
                            <input
                                type="number"
                                value={asset.price}
                                onChange={(e) => onUpdate(asset.id, 'price', parseFloat(e.target.value))}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold"
                            />
                        </div>

                        {/* Date */}
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1">
                                <Calendar size={12} /> Date
                            </label>
                            <input
                                type="date"
                                value={asset.date}
                                onChange={(e) => onUpdate(asset.id, 'date', e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold"
                            />
                        </div>

                        {/* Wallet */}
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1">
                                <Wallet size={12} /> Wallet
                            </label>
                            <select
                                value={asset.account}
                                onChange={(e) => onUpdate(asset.id, 'account', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold"
                            >
                                {accounts.map(acc => (
                                    <option key={acc} value={acc}>{acc}</option>
                                ))}
                            </select>
                        </div>

                        {/* Transaction Type */}
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-1">Transaction Type</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onUpdate(asset.id, 'transactionType', 'BUY')}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 ${
                                        asset.transactionType === 'BUY'
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-slate-100 text-slate-600'
                                    }`}
                                >
                                    <TrendingUp size={14} /> BUY
                                </button>
                                <button
                                    onClick={() => onUpdate(asset.id, 'transactionType', 'SELL')}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 ${
                                        asset.transactionType === 'SELL'
                                            ? 'bg-rose-500 text-white'
                                            : 'bg-slate-100 text-slate-600'
                                    }`}
                                >
                                    <TrendingDown size={14} /> SELL
                                </button>
                            </div>
                        </div>

                        {/* Sector (for stocks) */}
                        {asset.type === 'STOCK' && (
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase mb-1">Sector</label>
                                <input
                                    type="text"
                                    value={asset.sector || ''}
                                    onChange={(e) => onUpdate(asset.id, 'sector', e.target.value)}
                                    placeholder="e.g. IT, Banking..."
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold"
                                />
                            </div>
                        )}
                    </div>

                    {/* Errors */}
                    {asset.errors && asset.errors.length > 0 && (
                        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-rose-600 mb-2">
                                <AlertCircle size={16} />
                                <span className="text-xs font-bold uppercase">Validation Errors</span>
                            </div>
                            <ul className="text-xs text-rose-600 space-y-1">
                                {asset.errors.map((err, idx) => (
                                    <li key={idx}>• {err}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ImportPreviewModal;
