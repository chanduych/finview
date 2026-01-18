import React, { useState } from 'react';
import {
    X,
    Plus,
    RefreshCw,
    SearchIcon,
    Loader2,
    Building2,
    Activity
} from 'lucide-react';
import { useSearch } from '../hooks/useSearch';
import { verifySymbol, handleSelectResult as handleSelectResultService } from '../services/marketDataService';
import { ASSET_TYPES } from '../constants/assetTypes';

/**
 * AddAssetModal Component
 *
 * Modal for adding new investments to the portfolio.
 * Features:
 * - Asset type selection (STOCK, MF, ETF, CASH)
 * - Live search with dropdown results
 * - Symbol verification with price preview
 * - Form fields for quantity, buy price, date, and sector
 * - Mobile-responsive design with proper touch targets
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Callback to close the modal
 * @param {Function} props.onAdd - Callback when user adds an asset (receives asset data)
 * @param {Array<string>} props.accounts - List of available accounts/wallets
 * @param {string} props.selectedAccount - Currently selected account
 * @param {Function} props.setSelectedAccount - Setter for selectedAccount
 */
const AddAssetModal = ({
    isOpen,
    onClose,
    onAdd,
    accounts,
    selectedAccount,
    setSelectedAccount
}) => {
    // Form state
    const [selectedAssetType, setSelectedAssetType] = useState('STOCK');
    const [selectedAssetName, setSelectedAssetName] = useState('');
    const [buyPrice, setBuyPrice] = useState('');
    const [quantity, setQuantity] = useState('');
    const [buyDate, setBuyDate] = useState(new Date().toISOString().split('T')[0]);
    const [sector, setSector] = useState('');
    const [addStatus, setAddStatus] = useState('idle'); // 'idle', 'loading', 'success'
    const [verifyLoading, setVerifyLoading] = useState(false);
    const [previewPrice, setPreviewPrice] = useState(null);

    // Search hook
    const {
        searchQuery,
        setSearchQuery,
        searchResults,
        setSearchResults,
        isSearching
    } = useSearch(selectedAssetType);

    if (!isOpen) return null;

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
        try {
            const resultData = await handleSelectResultService(result);

            setSearchQuery(resultData.symbol);
            setSelectedAssetName(resultData.name);
            setSelectedAssetType(resultData.type);
            setSearchResults([]);

            if (resultData.data) {
                setPreviewPrice(resultData.data.price);
                setBuyPrice(resultData.data.price.toString());
            }
        } catch (error) {
            console.error('Select result error:', error);
        }
    };

    // Handle add asset
    const handleAddAsset = () => {
        if (!searchQuery || !buyPrice || !quantity) return;

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

        // Call parent's onAdd callback
        onAdd(assetData);

        setAddStatus('success');
        setTimeout(() => {
            resetForm();
            onClose();
        }, 500);
    };

    // Reset form to initial state
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

    // Handle modal close
    const handleClose = () => {
        resetForm();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
            <div className="bg-white w-full max-w-full sm:max-w-md rounded-2xl md:rounded-[3.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-4 md:p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight leading-none">
                        Add Investment
                    </h2>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                        aria-label="Close modal"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="p-4 md:p-8 space-y-4 md:space-y-6 overflow-y-auto flex-1">
                    {/* Account Selection */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                            Account Wallet
                        </label>
                        <select
                            className="w-full px-4 md:px-5 py-3 md:py-4 bg-slate-50 rounded-xl md:rounded-2xl font-bold outline-none border border-slate-200 focus:border-indigo-300 appearance-none text-slate-700 text-sm md:text-base min-h-[44px]"
                            value={selectedAccount}
                            onChange={e => setSelectedAccount(e.target.value)}
                        >
                            {accounts.map(acc => (
                                <option key={acc} value={acc}>{acc}</option>
                            ))}
                        </select>
                    </div>

                    {/* Asset Type Selection */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                            Asset Type
                        </label>
                        <select
                            className="w-full px-4 md:px-5 py-3 md:py-4 bg-slate-50 rounded-xl md:rounded-2xl font-bold outline-none border border-slate-200 focus:border-indigo-300 appearance-none text-slate-700 text-sm md:text-base min-h-[44px]"
                            value={selectedAssetType}
                            onChange={e => {
                                setSelectedAssetType(e.target.value);
                                setSearchQuery('');
                                setSearchResults([]);
                                setSelectedAssetName('');
                                setPreviewPrice(null);
                            }}
                        >
                            <option value="STOCK">Stock</option>
                            <option value="MF">Mutual Fund</option>
                            <option value="ETF">ETF</option>
                            <option value="CASH">Cash</option>
                        </select>
                    </div>

                    {/* Symbol Search */}
                    <div className="space-y-1 relative">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                            Symbol / Asset Search
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    placeholder={
                                        selectedAssetType === 'STOCK' ? 'Search stocks (e.g. RELIANCE, TCS...)' :
                                        selectedAssetType === 'ETF' ? 'Search ETFs (e.g. NIFTYBEES...)' :
                                        selectedAssetType === 'MF' ? 'Search MFs (e.g. Quant, Parag...)' :
                                        'Search asset name or symbol'
                                    }
                                    className="w-full px-4 md:px-5 py-3 md:py-4 bg-slate-50 rounded-xl md:rounded-2xl outline-none border border-slate-200 focus:border-indigo-300 font-bold uppercase pr-10 text-sm md:text-base min-h-[44px]"
                                    value={searchQuery}
                                    onChange={e => {
                                        const value = e.target.value;
                                        setSearchQuery(value);
                                        if (value === '') {
                                            setSelectedAssetName('');
                                            setSearchResults([]);
                                        }
                                    }}
                                />
                                {isSearching && (
                                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-slate-400" size={16} />
                                )}
                                {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" title="No results found">
                                        <SearchIcon size={16} />
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => handleVerifySymbol()}
                                disabled={verifyLoading || !searchQuery}
                                className="px-3 md:px-4 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-xl md:rounded-2xl hover:bg-indigo-100 transition-all disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                                aria-label="Verify symbol"
                            >
                                {verifyLoading ? (
                                    <Loader2 className="animate-spin" size={18} />
                                ) : (
                                    <SearchIcon size={18} />
                                )}
                            </button>
                        </div>

                        {/* Search Results Dropdown */}
                        {searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-indigo-200 rounded-xl md:rounded-2xl shadow-2xl z-[200] overflow-hidden max-h-64 overflow-y-auto">
                                <div className="p-2 bg-indigo-50 border-b border-indigo-100">
                                    <p className="text-[9px] font-black text-indigo-600 uppercase">
                                        {searchResults.length} result{searchResults.length > 1 ? 's' : ''} found
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
                                        className="w-full px-4 md:px-5 py-3 text-left hover:bg-indigo-50 active:bg-indigo-100 flex items-center gap-3 border-b border-slate-100 last:border-0 transition-colors cursor-pointer min-h-[52px] touch-manipulation"
                                    >
                                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                            result.searchType === 'MF'
                                                ? 'bg-emerald-100 text-emerald-600'
                                                : 'bg-indigo-100 text-indigo-600'
                                        }`}>
                                            {result.searchType === 'MF' ? <Building2 size={18} /> : <Activity size={18} />}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs md:text-sm font-black text-slate-800 truncate leading-tight">
                                                {result.schemeName || result.name || 'Unknown'}
                                            </p>
                                            <p className="text-[9px] md:text-[10px] text-slate-500 font-bold tracking-widest mt-0.5 uppercase">
                                                {result.searchType === 'MF'
                                                    ? `Code: ${result.schemeCode}`
                                                    : `Symbol: ${result.symbol}`}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* No Results Message */}
                        {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl md:rounded-2xl shadow-lg z-[200] p-4">
                                <p className="text-xs text-slate-400 text-center">
                                    No results found. Try a different search term.
                                </p>
                            </div>
                        )}

                        {/* Selected Asset Display */}
                        {selectedAssetName && (
                            <div className="mt-2 bg-indigo-50 border border-indigo-100 p-2 rounded-xl">
                                <p className="text-[10px] font-black text-indigo-600 uppercase leading-tight">
                                    Selected: {selectedAssetName}
                                </p>
                            </div>
                        )}

                        {/* Preview Price Display */}
                        {previewPrice && (
                            <p className={`text-[10px] mt-2 font-black uppercase px-2 py-1 rounded-md w-fit ${
                                previewPrice === 'Invalid'
                                    ? 'bg-rose-100 text-rose-600'
                                    : 'bg-emerald-100 text-emerald-600'
                            }`}>
                                {previewPrice === 'Invalid'
                                    ? 'Ticker Not Found'
                                    : `Current Price/NAV: ₹${previewPrice}`}
                            </p>
                        )}
                    </div>

                    {/* Quantity and Buy Price */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                                Quantity
                            </label>
                            <input
                                type="number"
                                placeholder="0"
                                className="w-full px-4 md:px-5 py-3 md:py-4 bg-slate-50 rounded-xl md:rounded-2xl outline-none border border-slate-200 focus:border-indigo-300 font-bold text-sm md:text-base min-h-[44px]"
                                value={quantity}
                                onChange={e => setQuantity(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                                Buy Price (₹)
                            </label>
                            <input
                                type="number"
                                placeholder="0"
                                className="w-full px-4 md:px-5 py-3 md:py-4 bg-slate-50 rounded-xl md:rounded-2xl outline-none border border-slate-200 focus:border-indigo-300 font-bold text-sm md:text-base min-h-[44px]"
                                value={buyPrice}
                                onChange={e => setBuyPrice(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Buy Date */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                            Date
                        </label>
                        <input
                            type="date"
                            className="w-full px-4 md:px-5 py-3 md:py-4 bg-slate-50 rounded-xl md:rounded-2xl outline-none border border-slate-200 focus:border-indigo-300 font-bold text-sm md:text-base min-h-[44px]"
                            value={buyDate}
                            onChange={e => setBuyDate(e.target.value)}
                        />
                    </div>

                    {/* Sector (Only for Stocks) */}
                    {selectedAssetType === 'STOCK' && (
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                                Sector (Optional)
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. IT, Banking, Pharma..."
                                className="w-full px-4 md:px-5 py-3 md:py-4 bg-slate-50 rounded-xl md:rounded-2xl outline-none border border-slate-200 focus:border-indigo-300 font-bold text-sm md:text-base min-h-[44px]"
                                value={sector}
                                onChange={e => setSector(e.target.value)}
                            />
                        </div>
                    )}

                    {/* Add Button */}
                    <button
                        onClick={handleAddAsset}
                        disabled={addStatus === 'loading' || !searchQuery || !buyPrice || !quantity}
                        className={`w-full py-4 md:py-5 rounded-2xl md:rounded-[2rem] font-black text-white shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2 min-h-[52px] touch-manipulation ${
                            addStatus === 'success'
                                ? 'bg-emerald-500'
                                : 'bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed'
                        }`}
                    >
                        {addStatus === 'loading' ? (
                            <>
                                <RefreshCw className="animate-spin" size={20} />
                                <span className="text-sm md:text-base">Adding...</span>
                            </>
                        ) : addStatus === 'success' ? (
                            <>
                                <Plus size={20} />
                                <span className="text-sm md:text-base">Added Successfully</span>
                            </>
                        ) : (
                            <>
                                <Plus size={20} />
                                <span className="text-sm md:text-base">Add to Portfolio</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddAssetModal;
