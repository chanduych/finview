import React from 'react';
import { TrendingUp, PlusCircle, Sparkles } from 'lucide-react';

/**
 * MobileEmptyState - Displayed when user has no holdings
 * Encourages user to add their first investment
 */
const MobileEmptyState = ({ onAddAsset }) => {
    return (
        <div className="flex flex-col items-center justify-center text-center px-6 py-16 min-h-[60vh]">
            {/* Icon */}
            <div className="relative mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-full flex items-center justify-center">
                    <TrendingUp size={40} className="text-indigo-600" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center animate-pulse">
                    <Sparkles size={16} className="text-white" />
                </div>
            </div>

            {/* Heading */}
            <h2 className="text-xl font-black text-slate-800 mb-2">
                Start Your Investment Journey
            </h2>
            <p className="text-sm text-slate-500 mb-8 max-w-sm">
                Track your stocks, mutual funds, and ETFs in one place. Get real-time updates, tax insights, and performance analytics.
            </p>

            {/* CTA Button */}
            <button
                onClick={onAddAsset}
                className="w-full max-w-xs px-6 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-2xl font-black shadow-lg shadow-indigo-200 flex items-center justify-center gap-3 active:scale-95 transition-transform"
            >
                <PlusCircle size={24} />
                Add First Investment
            </button>

            {/* Features */}
            <div className="mt-12 space-y-3 max-w-sm text-left">
                <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-emerald-600 font-black text-xs">✓</span>
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-700">Real-Time Tracking</p>
                        <p className="text-[10px] text-slate-500 font-medium">
                            Live prices from NSE, BSE & mutual funds
                        </p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-indigo-600 font-black text-xs">✓</span>
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-700">Tax Intelligence</p>
                        <p className="text-[10px] text-slate-500 font-medium">
                            STCG & LTCG calculations with exemptions
                        </p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-amber-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-amber-600 font-black text-xs">✓</span>
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-700">XIRR Returns</p>
                        <p className="text-[10px] text-slate-500 font-medium">
                            Accurate returns considering all transactions
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MobileEmptyState;
