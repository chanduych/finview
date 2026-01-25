import React from 'react';
import { TrendingUp, PlusCircle, Sparkles } from 'lucide-react';

/**
 * MobileEmptyState - Displayed when user has no holdings
 * Encourages user to add their first investment
 */
const MobileEmptyState = ({ onAddAsset }) => {
    return (
        <div className="flex flex-col items-center justify-center text-center px-6 py-16 min-h-[60vh]">
            {/* Custom Illustration */}
            <div className="relative mb-6">
                <svg width="120" height="120" viewBox="0 0 120 120" className="mx-auto">
                    {/* Background Circle */}
                    <circle cx="60" cy="60" r="55" fill="url(#gradient1)" opacity="0.2" />
                    {/* Chart Bars */}
                    <rect x="30" y="70" width="12" height="20" rx="2" fill="#14B8A6" opacity="0.8" />
                    <rect x="48" y="50" width="12" height="40" rx="2" fill="#14B8A6" opacity="0.9" />
                    <rect x="66" y="40" width="12" height="50" rx="2" fill="#14B8A6" />
                    <rect x="84" y="60" width="12" height="30" rx="2" fill="#14B8A6" opacity="0.7" />
                    {/* Trend Line */}
                    <path d="M 30 70 L 48 50 L 66 40 L 84 60" stroke="#14B8A6" strokeWidth="3" fill="none" strokeLinecap="round" />
                    {/* Sparkle Points */}
                    <circle cx="66" cy="40" r="4" fill="#FBBF24" className="animate-pulse" />
                    <circle cx="48" cy="50" r="3" fill="#FBBF24" opacity="0.7" className="animate-pulse" style={{ animationDelay: '0.2s' }} />
                    {/* Gradient Definition */}
                    <defs>
                        <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#14B8A6" />
                            <stop offset="100%" stopColor="#0D9488" />
                        </linearGradient>
                    </defs>
                </svg>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse shadow-md">
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
                className="w-full max-w-xs px-6 py-4 bg-gradient-to-r from-teal-500 to-teal-700 text-white rounded-2xl font-black shadow-lg shadow-teal-200 flex items-center justify-center gap-3 active:scale-95 transition-transform press-effect"
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
                    <div className="w-6 h-6 bg-teal-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-teal-600 font-black text-xs">✓</span>
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
