import React, { useState } from 'react';
import { Filter, X, Check, PieChart } from 'lucide-react';
import ChartSection from '../ChartSection';
import { useDarkModeContext } from '../MobileLayout';

/**
 * MobileAnalyticsView - Charts and analytics for mobile
 * Shows aggregated analytics based on wallet and asset type filters
 */
const MobileAnalyticsView = ({ 
    stats, 
    accounts = [], 
    activeAccounts = [], 
    setActiveAccounts,
    activeAssetTypes = ['STOCK', 'MF', 'ETF'],
    setActiveAssetTypes
}) => {
    const [showFilterSheet, setShowFilterSheet] = useState(false);
    const { isDarkMode } = useDarkModeContext();

    // Calculate active filter count (wallets + asset types)
    const walletFilterCount = accounts.length - activeAccounts.length;
    const assetFilterCount = 4 - activeAssetTypes.length;
    const activeFilterCount = walletFilterCount + assetFilterCount;

    return (
        <div className={`flex flex-col h-full ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
            {/* Header - Enhanced */}
            <div className={`border-b p-4 sticky top-0 z-30 shadow-sm ${
                isDarkMode 
                    ? 'bg-slate-800 border-slate-700' 
                    : 'bg-white border-slate-100'
            }`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-sm">
                            <PieChart size={20} className="text-white" />
                        </div>
                        <div>
                            <h1 className={`text-lg font-black heading-display ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                                Analytics
                            </h1>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                Visual Breakdown
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowFilterSheet(true)}
                        className={`p-3 rounded-xl border transition-all relative press-effect ${
                            activeFilterCount > 0
                                ? 'bg-teal-600 text-white border-teal-600'
                                : isDarkMode 
                                    ? 'bg-slate-700 text-slate-300 border-slate-600' 
                                    : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                    >
                        <Filter size={20} />
                        {/* Active filter count badge */}
                        {activeFilterCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-sm">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Charts Content */}
            <div className="flex-1 overflow-y-auto p-4">
                <ChartSection stats={stats} />
            </div>

            {/* Filter Bottom Sheet - Wallet and Asset Type Filters */}
            {showFilterSheet && (
                <div className="fixed inset-0 z-[200] flex items-end bg-slate-900/60 backdrop-blur-md animate-in fade-in">
                    <div className={`w-full rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom ${
                        isDarkMode ? 'bg-slate-800' : 'bg-white'
                    }`}>
                        {/* Header */}
                        <div className={`p-6 border-b flex items-center justify-between flex-shrink-0 ${
                            isDarkMode ? 'border-slate-700' : 'border-slate-200'
                        }`}>
                            <h2 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Filter Portfolio</h2>
                            <button
                                onClick={() => setShowFilterSheet(false)}
                                className={`p-2 rounded-full transition-colors ${
                                    isDarkMode 
                                        ? 'hover:bg-slate-700 text-slate-300' 
                                        : 'hover:bg-slate-100 text-slate-600'
                                }`}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Asset Types Section */}
                            <div>
                                <h3 className={`text-sm font-black uppercase mb-4 ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                                    Asset Types
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { value: 'STOCK', label: 'Stocks' },
                                        { value: 'MF', label: 'Mutual Funds' },
                                        { value: 'ETF', label: 'ETFs' },
                                        { value: 'US_STOCK', label: 'US Stocks' }
                                    ].map((asset) => {
                                        const isSelected = activeAssetTypes.includes(asset.value);
                                        return (
                                            <button
                                                key={asset.value}
                                                onClick={() => {
                                                    if (setActiveAssetTypes) {
                                                        if (isSelected) {
                                                            if (activeAssetTypes.length > 1) {
                                                                setActiveAssetTypes(prev => prev.filter(a => a !== asset.value));
                                                            }
                                                        } else {
                                                            setActiveAssetTypes(prev => [...prev, asset.value]);
                                                        }
                                                    }
                                                }}
                                                className={`p-3 rounded-xl border-2 transition-all text-center ${
                                                    isSelected 
                                                        ? isDarkMode 
                                                            ? 'bg-teal-900/30 border-teal-500 text-teal-300'
                                                            : 'bg-teal-50 border-teal-500 text-teal-700'
                                                        : isDarkMode 
                                                            ? 'bg-slate-700 border-slate-600 text-slate-400'
                                                            : 'bg-slate-50 border-slate-200 text-slate-600'
                                                }`}
                                            >
                                                <span className="text-xs font-bold">{asset.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Wallets Section */}
                            <div>
                                <h3 className={`text-sm font-black uppercase mb-4 ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                                    Wallets
                                </h3>
                                <div className="space-y-3">
                                    {accounts.map((account) => {
                                        const isSelected = activeAccounts.includes(account);
                                        return (
                                            <button
                                                key={account}
                                                onClick={() => {
                                                    if (setActiveAccounts) {
                                                        if (isSelected) {
                                                            if (activeAccounts.length > 1) {
                                                                setActiveAccounts(prev => prev.filter(a => a !== account));
                                                            }
                                                        } else {
                                                            setActiveAccounts(prev => [...prev, account]);
                                                        }
                                                    }
                                                }}
                                                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                                                    isSelected 
                                                        ? isDarkMode 
                                                            ? 'bg-teal-900/30 border-teal-500'
                                                            : 'bg-teal-50 border-teal-500'
                                                        : isDarkMode 
                                                            ? 'bg-slate-700 border-slate-600'
                                                            : 'bg-slate-50 border-slate-200'
                                                }`}
                                            >
                                                <span className={`text-sm font-bold ${
                                                    isSelected 
                                                        ? isDarkMode ? 'text-teal-300' : 'text-teal-700' 
                                                        : isDarkMode ? 'text-slate-400' : 'text-slate-600'
                                                }`}>
                                                    {account}
                                                </span>
                                                {isSelected && (
                                                    <div className="w-5 h-5 bg-teal-600 rounded flex items-center justify-center">
                                                        <Check size={14} className="text-white" />
                                                    </div>
                                                )}
                                                {!isSelected && (
                                                    <div className={`w-5 h-5 border-2 rounded ${
                                                        isDarkMode ? 'border-slate-500' : 'border-slate-300'
                                                    }`} />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className={`p-6 border-t space-y-3 flex-shrink-0 ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                            <button
                                onClick={() => {
                                    setShowFilterSheet(false);
                                }}
                                className={`w-full py-4 bg-teal-600 text-white rounded-2xl font-black text-sm active:bg-teal-700 transition-all ${
                                    isDarkMode ? '' : 'shadow-lg shadow-teal-200'
                                }`}
                            >
                                Done
                            </button>
                            <button
                                onClick={() => {
                                    if (setActiveAccounts) {
                                        setActiveAccounts([...accounts]);
                                    }
                                    if (setActiveAssetTypes) {
                                        setActiveAssetTypes(['STOCK', 'MF', 'ETF']); // US Stocks stay unchecked
                                    }
                                    setShowFilterSheet(false);
                                }}
                                className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                                    isDarkMode 
                                        ? 'bg-slate-700 text-slate-300 active:bg-slate-600' 
                                        : 'bg-slate-100 text-slate-600 active:bg-slate-200'
                                }`}
                            >
                                Clear All Filters
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MobileAnalyticsView;
