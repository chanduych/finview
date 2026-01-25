import React, { useState, useEffect } from 'react';
import {
    X,
    Plus,
    RefreshCw,
    Search,
    Loader2,
    Building2,
    TrendingUp,
    ChevronDown,
    Check,
    Wallet,
    Calendar,
    Hash,
    IndianRupee,
    Layers,
    BarChart3,
    PieChart
} from 'lucide-react';
import { useSearch } from '../hooks/useSearch';
import { verifySymbol, handleSelectResult as handleSelectResultService } from '../services/marketDataService';
import { useDarkModeContext } from './MobileLayout';

// Handle mobile keyboard - scroll focused input into view
const handleInputFocus = (e) => {
    setTimeout(() => {
        e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
};

// Asset type config with icons and colors
const ASSET_TYPE_CONFIG = {
    STOCK: { 
        icon: BarChart3, 
        label: 'Stock', 
        color: 'teal',
        bgClass: 'bg-teal-500',
        lightBgClass: 'bg-teal-50',
        textClass: 'text-teal-600',
        borderClass: 'border-teal-500'
    },
    MF: { 
        icon: PieChart, 
        label: 'Mutual Fund', 
        color: 'teal',
        bgClass: 'bg-teal-500',
        lightBgClass: 'bg-teal-50',
        textClass: 'text-teal-600',
        borderClass: 'border-teal-500'
    },
    ETF: { 
        icon: Layers, 
        label: 'ETF', 
        color: 'amber',
        bgClass: 'bg-amber-500',
        lightBgClass: 'bg-amber-50',
        textClass: 'text-amber-600',
        borderClass: 'border-amber-500'
    }
};

/**
 * AddAssetModal Component - Mobile-first bottom sheet design
 */
const AddAssetModal = ({
    isOpen,
    onClose,
    onAdd,
    accounts,
    selectedAccount,
    setSelectedAccount
}) => {
    // Dark mode context
    const darkModeContext = useDarkModeContext();
    const isDarkMode = darkModeContext?.isDarkMode || false;
    
    // Form state
    const [selectedAssetType, setSelectedAssetType] = useState('STOCK');
    const [selectedAssetName, setSelectedAssetName] = useState('');
    const [buyPrice, setBuyPrice] = useState('');
    const [quantity, setQuantity] = useState('');
    const [buyDate, setBuyDate] = useState(new Date().toISOString().split('T')[0]);
    const [sector, setSector] = useState('');
    const [addStatus, setAddStatus] = useState('idle');
    const [verifyLoading, setVerifyLoading] = useState(false);
    const [previewPrice, setPreviewPrice] = useState(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const [showAccountPicker, setShowAccountPicker] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    // Search hook
    const {
        searchQuery,
        setSearchQuery,
        searchResults,
        setSearchResults,
        isSearching
    } = useSearch(selectedAssetType, isSelecting);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const assetConfig = ASSET_TYPE_CONFIG[selectedAssetType];

    // Handle symbol verification
    const handleVerifySymbol = async (customSymbol = null) => {
        let symbol = (customSymbol || searchQuery).toUpperCase().trim();
        if (!symbol) return;

        setVerifyLoading(true);
        let type = selectedAssetType;
        if (type === 'STOCK' && /^\d+$/.test(symbol)) type = 'MF';

        try {
            const data = await verifySymbol(symbol, type);
            if (data) {
                setPreviewPrice(data.price);
                setBuyPrice(data.price.toString());
                if (data.name) setSelectedAssetName(data.name);
            } else {
                setPreviewPrice('Invalid');
            }
        } catch (error) {
            console.error('Verify symbol error:', error);
            setPreviewPrice('Invalid');
        } finally {
            setVerifyLoading(false);
        }
    };

    // Handle search result selection
    const handleSelectResult = async (result) => {
        setSearchResults([]);
        try {
            setIsSelecting(true);
            const resultData = await handleSelectResultService(result);
            setSearchQuery(resultData.symbol);
            setSelectedAssetName(resultData.name);
            setSelectedAssetType(resultData.type);
            if (resultData.data) {
                setPreviewPrice(resultData.data.price);
                setBuyPrice(resultData.data.price.toString());
            }
            setTimeout(() => setIsSelecting(false), 1000);
        } catch (error) {
            console.error('Select result error:', error);
            setSearchResults([]);
            setIsSelecting(false);
        }
    };

    // Handle add asset
    const handleAddAsset = () => {
        if (!searchQuery || !buyPrice || !quantity) return;
        
        const txDate = new Date(buyDate);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (txDate > today) {
            alert('Transaction date cannot be in the future');
            return;
        }

        setAddStatus('loading');

        const symbol = searchQuery.toUpperCase().trim();
        let type = selectedAssetType;
        if (type === 'STOCK' && /^\d+$/.test(symbol)) type = 'MF';

        const assetData = {
            symbol,
            name: selectedAssetName || symbol,
            type,
            account: selectedAccount,
            sector: sector || '',
            transaction: {
                price: parseFloat(buyPrice),
                quantity: parseFloat(quantity),
                date: buyDate,
                id: Date.now()
            }
        };

        onAdd(assetData);
        setAddStatus('success');
        setTimeout(() => {
            resetForm();
            handleClose();
        }, 600);
    };

    // Reset form
    const resetForm = () => {
        setAddStatus('idle');
        setSearchQuery('');
        setSelectedAssetName('');
        setBuyPrice('');
        setQuantity('');
        setPreviewPrice(null);
        setSector('');
        setSelectedAssetType('STOCK');
        setSearchResults([]);
    };

    // Handle close with animation
    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            resetForm();
            onClose();
        }, 200);
    };

    const isFormValid = searchQuery && buyPrice && quantity;

    return (
        <div 
            className={`fixed inset-0 z-[100] flex items-end justify-center transition-all duration-200 ${
                isClosing ? 'bg-black/0' : 'bg-black/60'
            }`}
            onClick={(e) => {
                if (e.target === e.currentTarget) handleClose();
            }}
        >
            {/* Bottom Sheet */}
            <div 
                className={`w-full rounded-t-[28px] shadow-2xl flex flex-col transition-transform duration-200 ${
                    isClosing ? 'translate-y-full' : 'translate-y-0'
                } ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}
                style={{ maxHeight: '95dvh', height: 'auto' }}
            >
                {/* Drag Handle */}
                <div className="flex justify-center pt-3 pb-2">
                    <div className={`w-10 h-1 rounded-full ${isDarkMode ? 'bg-slate-600' : 'bg-slate-300'}`} />
                </div>

                {/* Header */}
                <div className="px-5 pb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${assetConfig.bgClass} flex items-center justify-center`}>
                            <Plus size={22} className="text-white" strokeWidth={3} />
                        </div>
                        <div>
                            <h2 className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                                Add Investment
                            </h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                {assetConfig.label}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className={`w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-transform ${
                            isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
                        }`}
                    >
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-5 pb-8 space-y-5 overscroll-contain">
                    
                    {/* Asset Type Pills */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">
                            Asset Type
                        </label>
                        <div className="flex gap-2">
                            {Object.entries(ASSET_TYPE_CONFIG).map(([type, config]) => {
                                const Icon = config.icon;
                                const isActive = selectedAssetType === type;
                                return (
                                    <button
                                        key={type}
                                        onClick={() => {
                                            setSelectedAssetType(type);
                                            setSearchQuery('');
                                            setSearchResults([]);
                                            setSelectedAssetName('');
                                            setPreviewPrice(null);
                                        }}
                                        className={`flex-1 py-3 px-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 ${
                                            isActive 
                                                ? `${config.bgClass} text-white shadow-lg` 
                                                : isDarkMode 
                                                    ? 'bg-slate-800 text-slate-400' 
                                                    : 'bg-slate-100 text-slate-600'
                                        }`}
                                    >
                                        <Icon size={16} strokeWidth={2.5} />
                                        <span className="text-xs font-black">{config.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Account Selector */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide flex items-center gap-1">
                            <Wallet size={12} /> Account
                        </label>
                        <button
                            onClick={() => setShowAccountPicker(true)}
                            className={`w-full px-4 py-3.5 rounded-xl flex items-center justify-between border active:bg-slate-100 ${
                                isDarkMode 
                                    ? 'bg-slate-800 border-slate-700' 
                                    : 'bg-slate-50 border-slate-200'
                            }`}
                        >
                            <span className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{selectedAccount}</span>
                            <ChevronDown size={18} className="text-slate-400" />
                        </button>
                    </div>

                    {/* Symbol Search */}
                    <div className="space-y-2 relative">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide flex items-center gap-1">
                            <Search size={12} /> Search {assetConfig.label}
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    placeholder={`Search ${assetConfig.label.toLowerCase()}s...`}
                                    className={`w-full px-4 py-3.5 rounded-xl border font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent uppercase text-sm ${
                                        isDarkMode 
                                            ? 'bg-slate-800 border-slate-700 text-white' 
                                            : 'bg-slate-50 border-slate-200 text-slate-800'
                                    }`}
                                    value={searchQuery}
                                    onChange={e => {
                                        const value = e.target.value;
                                        setSearchQuery(value);
                                        if (value === '') {
                                            setSelectedAssetName('');
                                            setSearchResults([]);
                                        }
                                    }}
                                    onFocus={handleInputFocus}
                                />
                                {isSearching && (
                                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-teal-500" size={18} />
                                )}
                            </div>
                            <button
                                onClick={() => handleVerifySymbol()}
                                disabled={verifyLoading || !searchQuery}
                                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 ${assetConfig.lightBgClass} ${assetConfig.textClass} border ${assetConfig.borderClass}`}
                            >
                                {verifyLoading ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <Search size={20} />
                                )}
                            </button>
                        </div>

                        {/* Search Results */}
                        {searchResults.length > 0 && (
                            <div className={`absolute top-full left-0 right-0 mt-2 border rounded-2xl shadow-2xl z-[200] overflow-hidden max-h-60 overflow-y-auto ${
                                isDarkMode 
                                    ? 'bg-slate-800 border-slate-700' 
                                    : 'bg-white border-slate-200'
                            }`}>
                                <div className={`px-4 py-2 border-b ${
                                    isDarkMode 
                                        ? 'bg-slate-900 border-slate-700' 
                                        : 'bg-slate-50 border-slate-100'
                                }`}>
                                    <p className="text-[10px] font-black text-slate-500 uppercase">
                                        {searchResults.length} results
                                    </p>
                                </div>
                                {searchResults.map((result, idx) => (
                                    <button
                                        key={result.schemeCode || result.symbol || `result-${idx}`}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleSelectResult(result);
                                        }}
                                        className={`w-full px-4 py-3 text-left flex items-center gap-3 border-b last:border-0 ${
                                            isDarkMode 
                                                ? 'border-slate-700 active:bg-slate-700' 
                                                : 'border-slate-100 active:bg-slate-50'
                                        }`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                            result.searchType === 'MF'
                                                ? 'bg-teal-100 text-teal-600'
                                                : 'bg-teal-100 text-teal-600'
                                        }`}>
                                            {result.searchType === 'MF' ? <Building2 size={18} /> : <TrendingUp size={18} />}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className={`text-sm font-bold truncate ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                                                {result.schemeName || result.name || 'Unknown'}
                                            </p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase">
                                                {result.searchType === 'MF' ? `Code: ${result.schemeCode}` : result.symbol}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Selected Asset */}
                        {selectedAssetName && (
                            <div className={`mt-2 p-3 rounded-xl ${assetConfig.lightBgClass} border ${assetConfig.borderClass}/30`}>
                                <div className="flex items-center gap-2">
                                    <Check size={14} className={assetConfig.textClass} />
                                    <p className={`text-xs font-bold ${assetConfig.textClass} truncate`}>
                                        {selectedAssetName}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Price Preview */}
                        {previewPrice && (
                            <div className={`flex items-center gap-2 mt-2 px-3 py-2 rounded-lg w-fit ${
                                previewPrice === 'Invalid'
                                    ? 'bg-rose-100 text-rose-600'
                                    : 'bg-emerald-100 text-emerald-600'
                            }`}>
                                <IndianRupee size={12} />
                                <span className="text-xs font-black">
                                    {previewPrice === 'Invalid' ? 'Not Found' : `₹${previewPrice}`}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Quantity & Price Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide flex items-center gap-1">
                                <Hash size={12} /> Quantity
                            </label>
                            <input
                                type="number"
                                inputMode="decimal"
                                placeholder="0"
                                className={`w-full px-4 py-3.5 rounded-xl border font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 text-base ${
                                    isDarkMode 
                                        ? 'bg-slate-800 border-slate-700 text-white' 
                                        : 'bg-slate-50 border-slate-200 text-slate-800'
                                }`}
                                value={quantity}
                                onChange={e => setQuantity(e.target.value)}
                                onFocus={handleInputFocus}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide flex items-center gap-1">
                                <IndianRupee size={12} /> Buy Price
                            </label>
                            <input
                                type="number"
                                inputMode="decimal"
                                placeholder="0.00"
                                className={`w-full px-4 py-3.5 rounded-xl border font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 text-base ${
                                    isDarkMode 
                                        ? 'bg-slate-800 border-slate-700 text-white' 
                                        : 'bg-slate-50 border-slate-200 text-slate-800'
                                }`}
                                value={buyPrice}
                                onChange={e => setBuyPrice(e.target.value)}
                                onFocus={handleInputFocus}
                            />
                        </div>
                    </div>

                    {/* Date */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide flex items-center gap-1">
                            <Calendar size={12} /> Purchase Date
                        </label>
                        <input
                            type="date"
                            max={new Date().toISOString().split('T')[0]}
                            className={`w-full px-4 py-3.5 rounded-xl border font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                                isDarkMode 
                                    ? 'bg-slate-800 border-slate-700 text-white' 
                                    : 'bg-slate-50 border-slate-200 text-slate-800'
                            }`}
                            value={buyDate}
                            onChange={e => setBuyDate(e.target.value)}
                            onFocus={handleInputFocus}
                        />
                    </div>

                    {/* Sector (Stocks only) */}
                    {selectedAssetType === 'STOCK' && (
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">
                                Sector (Optional)
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. IT, Banking, Pharma..."
                                className={`w-full px-4 py-3.5 rounded-xl border font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                                    isDarkMode 
                                        ? 'bg-slate-800 border-slate-700 text-white' 
                                        : 'bg-slate-50 border-slate-200 text-slate-800'
                                }`}
                                value={sector}
                                onChange={e => setSector(e.target.value)}
                                onFocus={handleInputFocus}
                            />
                        </div>
                    )}

                    {/* Investment Summary */}
                    {quantity && buyPrice && (
                        <div className="p-4 bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl text-white">
                            <p className="text-[10px] font-bold uppercase opacity-80 mb-1">Total Investment</p>
                            <p className="text-2xl font-black tabular-nums">
                                ₹{(parseFloat(quantity || 0) * parseFloat(buyPrice || 0)).toLocaleString('en-IN', { 
                                    minimumFractionDigits: 2, 
                                    maximumFractionDigits: 2 
                                })}
                            </p>
                        </div>
                    )}

                    {/* Add Button */}
                    <button
                        onClick={handleAddAsset}
                        disabled={addStatus === 'loading' || !isFormValid}
                        className={`w-full py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg ${
                            addStatus === 'success'
                                ? 'bg-emerald-500 shadow-emerald-200'
                                : isFormValid
                                    ? 'bg-gradient-to-r from-teal-500 to-teal-600 shadow-teal-200'
                                    : isDarkMode 
                                        ? 'bg-slate-700 shadow-none' 
                                        : 'bg-slate-300 shadow-none'
                        }`}
                    >
                        {addStatus === 'loading' ? (
                            <>
                                <RefreshCw className="animate-spin" size={20} />
                                <span>Adding...</span>
                            </>
                        ) : addStatus === 'success' ? (
                            <>
                                <Check size={20} strokeWidth={3} />
                                <span>Added!</span>
                            </>
                        ) : (
                            <>
                                <Plus size={20} strokeWidth={3} />
                                <span>Add to Portfolio</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Account Picker Bottom Sheet */}
            {showAccountPicker && (
                <div 
                    className="fixed inset-0 z-[110] flex items-end justify-center bg-black/40"
                    onClick={() => setShowAccountPicker(false)}
                >
                    <div 
                        className={`w-full rounded-t-[28px] shadow-2xl overflow-hidden ${
                            isDarkMode ? 'bg-slate-900' : 'bg-white'
                        }`}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-center pt-3 pb-2">
                            <div className={`w-10 h-1 rounded-full ${isDarkMode ? 'bg-slate-600' : 'bg-slate-300'}`} />
                        </div>
                        <div className="px-5 pb-2">
                            <h3 className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Select Account</h3>
                        </div>
                        <div className="px-3 pb-6 max-h-60 overflow-y-auto">
                            {accounts.map(acc => (
                                <button
                                    key={acc}
                                    onClick={() => {
                                        setSelectedAccount(acc);
                                        setShowAccountPicker(false);
                                    }}
                                    className={`w-full px-4 py-3.5 rounded-xl flex items-center justify-between mb-1 transition-all ${
                                        selectedAccount === acc 
                                            ? isDarkMode 
                                                ? 'bg-teal-900/30 text-teal-400' 
                                                : 'bg-teal-50 text-teal-600'
                                            : isDarkMode 
                                                ? 'text-slate-300 active:bg-slate-800' 
                                                : 'text-slate-700 active:bg-slate-50'
                                    }`}
                                >
                                    <span className="font-bold">{acc}</span>
                                    {selectedAccount === acc && <Check size={18} className="text-teal-500" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddAssetModal;
