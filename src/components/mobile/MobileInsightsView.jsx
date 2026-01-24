import React, { useState } from 'react';
import { Filter, X, Check, Lightbulb } from 'lucide-react';
import PortfolioInsights from '../PortfolioInsights';

/**
 * MobileInsightsView - Full-screen insights view for mobile
 * Shows aggregated insights based on wallet and asset type filters
 */
const MobileInsightsView = ({ 
    insights, 
    accounts = [], 
    activeAccounts = [], 
    setActiveAccounts,
    activeAssetTypes = ['STOCK', 'MF', 'ETF'],
    setActiveAssetTypes
}) => {
    const [showFilterSheet, setShowFilterSheet] = useState(false);

    // Calculate active filter count (wallets + asset types)
    const walletFilterCount = accounts.length - activeAccounts.length;
    const assetFilterCount = 3 - activeAssetTypes.length;
    const activeFilterCount = walletFilterCount + assetFilterCount;

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
            {/* Header - Enhanced */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 p-4 sticky top-0 z-30 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
                            <Lightbulb size={20} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-black text-slate-800 dark:text-white heading-display">
                                Insights
                            </h1>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                Smart Analysis
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowFilterSheet(true)}
                        className={`p-3 rounded-xl border transition-all relative press-effect ${
                            activeFilterCount > 0
                                ? 'bg-teal-600 text-white border-teal-600'
                                : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600'
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

            {/* Insights Content */}
            <div className="flex-1 overflow-y-auto px-3 py-4 overscroll-contain">
                <div className="max-w-full overflow-hidden">
                    <PortfolioInsights insights={insights} />
                </div>
            </div>

            {/* Filter Bottom Sheet - Wallet and Asset Type Filters */}
            {showFilterSheet && (
                <div className="fixed inset-0 z-[200] flex items-end bg-slate-900/60 backdrop-blur-md animate-in fade-in">
                    <div className="bg-white dark:bg-slate-800 w-full rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-shrink-0">
                            <h2 className="text-xl font-black text-slate-800 dark:text-white">Filter Portfolio</h2>
                            <button
                                onClick={() => setShowFilterSheet(false)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-600 dark:text-slate-300"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Asset Types Section */}
                            <div>
                                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase mb-4">
                                    Asset Types
                                </h3>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { value: 'STOCK', label: 'Stocks' },
                                        { value: 'MF', label: 'Mutual Funds' },
                                        { value: 'ETF', label: 'ETFs' }
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
                                                        ? 'bg-teal-50 dark:bg-teal-900/30 border-teal-500 text-teal-700 dark:text-teal-300' 
                                                        : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400'
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
                                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase mb-4">
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
                                                        ? 'bg-teal-50 dark:bg-teal-900/30 border-teal-500' 
                                                        : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600'
                                                }`}
                                            >
                                                <span className={`text-sm font-bold ${isSelected ? 'text-teal-700 dark:text-teal-300' : 'text-slate-600 dark:text-slate-400'}`}>
                                                    {account}
                                                </span>
                                                {isSelected && (
                                                    <div className="w-5 h-5 bg-teal-600 rounded flex items-center justify-center">
                                                        <Check size={14} className="text-white" />
                                                    </div>
                                                )}
                                                {!isSelected && (
                                                    <div className="w-5 h-5 border-2 border-slate-300 dark:border-slate-500 rounded" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 border-t border-slate-200 dark:border-slate-700 space-y-3 flex-shrink-0">
                            <button
                                onClick={() => {
                                    setShowFilterSheet(false);
                                }}
                                className="w-full py-4 bg-teal-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-teal-200 dark:shadow-none active:bg-teal-700 transition-all"
                            >
                                Done
                            </button>
                            <button
                                onClick={() => {
                                    if (setActiveAccounts) {
                                        setActiveAccounts([...accounts]);
                                    }
                                    if (setActiveAssetTypes) {
                                        setActiveAssetTypes(['STOCK', 'MF', 'ETF']);
                                    }
                                    setShowFilterSheet(false);
                                }}
                                className="w-full py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm active:bg-slate-200 dark:active:bg-slate-600 transition-all"
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

export default MobileInsightsView;
