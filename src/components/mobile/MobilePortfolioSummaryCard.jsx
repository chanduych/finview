import React from 'react';
import { TrendingUp, TrendingDown, Wallet, Target } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

/**
 * MobilePortfolioSummaryCard - Overview card showing total portfolio stats
 * Displayed at the top of the mobile portfolio view
 */
const MobilePortfolioSummaryCard = ({ stats }) => {
    return (
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-5 text-white shadow-xl">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <Wallet size={20} className="text-indigo-200" />
                <h2 className="text-xs font-black uppercase tracking-wider text-indigo-200">
                    Portfolio Summary
                </h2>
            </div>

            {/* Main Value */}
            <div className="mb-4">
                <p className="text-[10px] font-bold text-indigo-200 uppercase mb-1">
                    Total Value
                </p>
                <p className="text-3xl font-black mb-2">
                    {formatCurrency(stats.current || 0)}
                </p>
                <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                        (stats.absReturn || 0) >= 0
                            ? 'bg-emerald-500/20 text-emerald-100'
                            : 'bg-rose-500/20 text-rose-100'
                    }`}>
                        {(stats.absReturn || 0) >= 0 ? (
                            <TrendingUp size={14} />
                        ) : (
                            <TrendingDown size={14} />
                        )}
                        <span className="text-xs font-black">
                            {(stats.absReturn || 0) >= 0 ? '+' : ''}{formatCurrency(stats.absReturn || 0)}
                        </span>
                    </div>
                    <span className={`text-sm font-black ${
                        (stats.absReturnPct || 0) >= 0 ? 'text-emerald-200' : 'text-rose-200'
                    }`}>
                        {(stats.absReturnPct || 0) >= 0 ? '+' : ''}{(stats.absReturnPct || 0).toFixed(2)}%
                    </span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                    <p className="text-[8px] font-black text-indigo-200 uppercase mb-1">
                        Invested
                    </p>
                    <p className="text-sm font-black">
                        {formatCurrency(stats.invested || 0)}
                    </p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                    <p className="text-[8px] font-black text-indigo-200 uppercase mb-1">
                        Today
                    </p>
                    <p className={`text-sm font-black ${
                        (stats.dayChange || 0) >= 0 ? 'text-emerald-200' : 'text-rose-200'
                    }`}>
                        {(stats.dayChange || 0) >= 0 ? '+' : ''}{formatCurrency(stats.dayChange || 0)}
                    </p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                    <p className="text-[8px] font-black text-indigo-200 uppercase mb-1">
                        XIRR
                    </p>
                    {stats.portfolioXIRR !== null && stats.portfolioXIRR !== undefined ? (
                        <p className={`text-sm font-black ${
                            stats.portfolioXIRR >= 0 ? 'text-emerald-200' : 'text-rose-200'
                        }`}>
                            {stats.portfolioXIRR >= 0 ? '+' : ''}{stats.portfolioXIRR.toFixed(1)}%
                        </p>
                    ) : (
                        <p className="text-sm font-bold text-indigo-300">N/A</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MobilePortfolioSummaryCard;
