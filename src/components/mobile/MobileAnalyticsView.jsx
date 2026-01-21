import React, { useState } from 'react';
import { Filter, X, Check } from 'lucide-react';
import ChartSection from '../ChartSection';

/**
 * MobileAnalyticsView - Charts and analytics for mobile
 */
const MobileAnalyticsView = ({ stats, accounts = [], activeAccounts = [], setActiveAccounts, selectedView, setSelectedView }) => {
    const [showFilterSheet, setShowFilterSheet] = useState(false);

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 p-4 sticky top-0 z-30">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-black text-slate-800">
                            Analytics
                        </h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            Charts & Breakdown
                        </p>
                    </div>
                    <button
                        onClick={() => setShowFilterSheet(true)}
                        className={`p-3 rounded-xl border transition-all ${
                            (activeAccounts.length < accounts.length) || (selectedView !== 'ALL')
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                    >
                        <Filter size={20} />
                    </button>
                </div>
            </div>

            {/* Charts Content */}
            <div className="flex-1 overflow-y-auto p-4">
                <ChartSection stats={stats} />
            </div>

            {/* Filter Bottom Sheet - Same as MobileInsightsView */}
            {showFilterSheet && (
                <div className="fixed inset-0 z-[200] flex items-end bg-slate-900/60 backdrop-blur-md animate-in fade-in">
                    <div className="bg-white w-full rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom">
                        <div className="p-6 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
                            <h2 className="text-xl font-black text-slate-800">Filter Portfolio</h2>
                            <button
                                onClick={() => setShowFilterSheet(false)}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div>
                                <h3 className="text-sm font-black text-slate-800 uppercase mb-4">Wallets</h3>
                                <div className="space-y-3">
                                    {accounts.map((account) => {
                                        const isSelected = activeAccounts.includes(account);
                                        return (
                                            <button
                                                key={account}
                                                onClick={() => {
                                                    if (setActiveAccounts) {
                                                        if (isSelected) {
                                                            setActiveAccounts(prev => prev.filter(a => a !== account));
                                                        } else {
                                                            setActiveAccounts(prev => [...prev, account]);
                                                        }
                                                    }
                                                }}
                                                className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-xl border-2 transition-all active:bg-slate-100"
                                                style={{ borderColor: isSelected ? '#4f46e5' : '#e2e8f0' }}
                                            >
                                                <span className="text-sm font-bold text-slate-800">{account}</span>
                                                {isSelected && (
                                                    <div className="w-5 h-5 bg-indigo-600 rounded flex items-center justify-center">
                                                        <Check size={14} className="text-white" />
                                                    </div>
                                                )}
                                                {!isSelected && (
                                                    <div className="w-5 h-5 border-2 border-slate-300 rounded" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-800 uppercase mb-4">Assets</h3>
                                <div className="space-y-3">
                                    {[
                                        { value: 'STOCK', label: 'Stocks' },
                                        { value: 'MF', label: 'Mutual Funds' },
                                        { value: 'ETF', label: 'ETFs' }
                                    ].map((asset) => {
                                        const isSelected = selectedView === asset.value || (selectedView === 'ALL' && asset.value !== 'ALL');
                                        return (
                                            <button
                                                key={asset.value}
                                                onClick={() => {
                                                    if (setSelectedView) {
                                                        setSelectedView(asset.value);
                                                    }
                                                }}
                                                className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-xl border-2 transition-all active:bg-slate-100"
                                                style={{ borderColor: isSelected ? '#4f46e5' : '#e2e8f0' }}
                                            >
                                                <span className="text-sm font-bold text-slate-800">{asset.label}</span>
                                                {isSelected && (
                                                    <div className="w-5 h-5 bg-indigo-600 rounded flex items-center justify-center">
                                                        <Check size={14} className="text-white" />
                                                    </div>
                                                )}
                                                {!isSelected && (
                                                    <div className="w-5 h-5 border-2 border-slate-300 rounded" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-200 space-y-3 flex-shrink-0">
                            <button
                                onClick={() => setShowFilterSheet(false)}
                                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-200 active:bg-indigo-700 transition-all"
                            >
                                Apply
                            </button>
                            <button
                                onClick={() => {
                                    if (setActiveAccounts) {
                                        setActiveAccounts(accounts);
                                    }
                                    if (setSelectedView) {
                                        setSelectedView('ALL');
                                    }
                                    setShowFilterSheet(false);
                                }}
                                className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm active:bg-slate-200 transition-all"
                            >
                                Clear filters
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MobileAnalyticsView;
