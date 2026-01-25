import React from 'react';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import AnimatedNumber from '../AnimatedNumber';

/**
 * MobilePortfolioSummaryCard - Overview card showing total portfolio stats
 * Displayed at the top of the mobile portfolio view
 */
const MobilePortfolioSummaryCard = ({ stats }) => {
    return (
        <div className="premium-gradient rounded-2xl p-5 text-white shadow-xl animate-fade-slide-in">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <Wallet size={18} className="text-white" />
                </div>
                <h2 className="text-xs font-black uppercase tracking-wider text-white/80">
                    Portfolio Summary
                </h2>
            </div>

            {/* Main Value */}
            <div className="mb-4">
                <p className="text-[10px] font-bold text-white/60 uppercase mb-1">
                    Total Value
                </p>
                <p className="text-3xl font-black mb-2 tracking-tight">
                    <AnimatedNumber 
                        value={stats.current || 0} 
                        format="currency" 
                        duration={1000}
                        className="text-white"
                    />
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${
                        (stats.absReturn || 0) >= 0
                            ? 'bg-emerald-400/20 border border-emerald-400/30'
                            : 'bg-rose-400/20 border border-rose-400/30'
                    }`}>
                        {(stats.absReturn || 0) >= 0 ? (
                            <TrendingUp size={14} className="text-emerald-300" />
                        ) : (
                            <TrendingDown size={14} className="text-rose-300" />
                        )}
                        <span className={`text-xs font-black ${
                            (stats.absReturn || 0) >= 0 ? 'text-emerald-200' : 'text-rose-200'
                        }`}>
                            <AnimatedNumber 
                                value={stats.absReturn || 0} 
                                format="currency" 
                                duration={800}
                            />
                        </span>
                    </div>
                    <span className={`text-sm font-black ${
                        (stats.absReturnPct || 0) >= 0 ? 'text-emerald-300' : 'text-rose-300'
                    }`}>
                        {(stats.absReturnPct || 0) >= 0 ? '↑' : '↓'} 
                        <AnimatedNumber 
                            value={Math.abs(stats.absReturnPct || 0)} 
                            format="number" 
                            duration={800}
                        />%
                    </span>
                </div>
            </div>

            {/* Stats Grid - 2x2 layout */}
            <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/5">
                    <p className="text-[8px] font-black text-white/50 uppercase mb-1 tracking-wide">
                        Invested
                    </p>
                    <p className="text-sm font-black truncate">
                        <AnimatedNumber 
                            value={stats.invested || 0} 
                            format="currency" 
                            duration={800}
                            className="text-white"
                        />
                    </p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/5">
                    <p className="text-[8px] font-black text-white/50 uppercase mb-1 tracking-wide">
                        Today
                    </p>
                    <p className="text-sm font-black truncate">
                        {(stats.dayChange || 0) >= 0 ? '+' : ''}
                        <AnimatedNumber 
                            value={stats.dayChange || 0} 
                            format="currency" 
                            duration={800}
                            className={(stats.dayChange || 0) >= 0 ? 'text-emerald-300' : 'text-rose-300'}
                        />
                    </p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/5">
                    <p className="text-[8px] font-black text-white/50 uppercase mb-1 tracking-wide">
                        XIRR
                    </p>
                    {stats.portfolioXIRR !== null && stats.portfolioXIRR !== undefined ? (
                        <p className="text-sm font-black">
                            {stats.portfolioXIRR >= 0 ? '+' : ''}
                            <AnimatedNumber 
                                value={stats.portfolioXIRR} 
                                format="percent" 
                                duration={800}
                                decimals={1}
                                className={stats.portfolioXIRR >= 0 ? 'text-emerald-300' : 'text-rose-300'}
                            />
                        </p>
                    ) : (
                        <p className="text-sm font-bold text-white/40">—</p>
                    )}
                </div>
                <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/5">
                    <p className="text-[8px] font-black text-white/50 uppercase mb-1 tracking-wide">
                        Dividends
                    </p>
                    <p className="text-sm font-black text-emerald-300 truncate">
                        +<AnimatedNumber 
                            value={stats.totalDividends || 0} 
                            format="currency" 
                            duration={800}
                        />
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MobilePortfolioSummaryCard;
