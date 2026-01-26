import React from 'react';
import { Wallet, Clock, PieChart as PieIcon } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

/**
 * StatsCards Component - Mobile-Responsive Dashboard Statistics Cards
 *
 * Features:
 * - Net Worth Card with absolute returns and XIRR
 * - Today's P&L Card with top gainer/loser insights
 * - Active Accounts Card with quick add button
 * - Fully responsive with optimized text sizes
 * - Touch-optimized button sizes
 * - Proper number formatting for all screen sizes
 *
 * @param {Object} props
 * @param {Object} props.stats - Portfolio statistics object
 * @param {number} props.stats.current - Current portfolio value
 * @param {number} props.stats.invested - Total invested amount
 * @param {number} props.stats.absReturn - Absolute return value
 * @param {number} props.stats.absReturnPct - Absolute return percentage
 * @param {number|null} props.stats.portfolioXIRR - Portfolio XIRR percentage
 * @param {Date|null} props.stats.oldestTransactionDate - Date of oldest transaction
 * @param {number} props.stats.dayChange - Today's change in value
 * @param {number} props.stats.dayChangePct - Today's change percentage
 * @param {Object|null} props.stats.topGainer - Top performing asset
 * @param {Object|null} props.stats.topLoser - Worst performing asset
 * @param {Array<string>} props.accounts - List of account names
 * @param {Function} props.onQuickAdd - Handler for quick add asset button
 */
const StatsCards = ({ stats, accounts, onQuickAdd }) => {
    return (
        <section className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
            {/* Net Worth Card */}
            <div className="lg:col-span-2 bg-slate-900 p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-3xl text-white shadow-2xl relative overflow-hidden group">
                <Wallet
                    size={120}
                    className="absolute -bottom-8 -right-8 opacity-10 group-hover:scale-110 transition-transform text-white w-20 h-20 md:w-28 md:h-28 lg:w-[120px] lg:h-[120px]"
                />
                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                            Net Worth
                        </p>
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mt-2 tracking-tight tabular-nums break-words">
                            {formatCurrency(stats.current)}
                        </h2>

                        {/* ✅ MUST-FIX: Show only unrealized gains (from open positions) as main metric */}
                        <div className="mt-3 space-y-2">
                            <p className={`text-base md:text-lg font-black ${(stats.unrealizedGains || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {(stats.unrealizedGains || 0) >= 0 ? '+' : ''}{formatCurrency(stats.unrealizedGains || 0)} unrealized
                            </p>
                            {/* Realized vs Unrealized Breakdown */}
                            <div className="flex items-center gap-3 text-xs">
                                <div className={`px-2 py-1 rounded-md ${(stats.realizedGains || 0) >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                                    <span className="font-bold">Realized:</span> {(stats.realizedGains || 0) >= 0 ? '+' : ''}{formatCurrency(stats.realizedGains || 0)}
                                </div>
                                <div className={`px-2 py-1 rounded-md ${(stats.unrealizedGains || 0) >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                                    <span className="font-bold">Unrealized:</span> {(stats.unrealizedGains || 0) >= 0 ? '+' : ''}{formatCurrency(stats.unrealizedGains || 0)}
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center gap-2 md:gap-3 flex-wrap">
                            <div className={`px-2 md:px-3 py-1 rounded-full text-xs font-black ${(stats.unrealizedGains || 0) >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                {(stats.unrealizedGains || 0) >= 0 ? '+' : ''}{stats.absReturnPct.toFixed(2)}% Returns
                            </div>
                            {stats.portfolioXIRR !== null && (
                                <div className="px-2 md:px-3 py-1 rounded-full text-xs font-black bg-indigo-500/20 text-indigo-400">
                                    XIRR: {stats.portfolioXIRR.toFixed(2)}%
                                    {stats.oldestTransactionDate && (
                                        <span className="ml-1 text-[10px] opacity-80">
                                            Since {stats.oldestTransactionDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                        <p className="text-slate-500 text-xs font-medium mt-3">
                            Invested: {formatCurrency(stats.invested)}
                        </p>
                    </div>

                    <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-white/10">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-2">
                            <span>Returns</span>
                            <span>{stats.absReturnPct >= 0 ? '+' : ''}{stats.absReturnPct.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden relative">
                            <div
                                className={`h-full transition-all duration-1000 ${(stats.unrealizedGains || 0) >= 0 ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'bg-rose-400'}`}
                                style={{
                                    width: `${Math.min(100, Math.max(0, Math.abs(stats.absReturnPct)))}%`
                                }}
                                title={`Unrealized return: ${stats.absReturnPct >= 0 ? '+' : ''}${stats.absReturnPct.toFixed(2)}%`}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Today's P&L Card */}
            <div className="bg-white p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                        Today's P&L
                    </p>
                    <h2 className={`text-2xl md:text-3xl font-black mt-2 tabular-nums break-words ${stats.dayChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {stats.dayChange >= 0 ? '+' : ''}{formatCurrency(stats.dayChange)}
                    </h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 tracking-widest flex items-center gap-1">
                        {stats.dayChangePct.toFixed(2)}% session change <Clock size={10}/>
                    </p>
                </div>

                <div className="mt-4 md:mt-6 p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Smart Insights</p>
                    {stats.topGainer ? (
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500 font-bold">Best Performer</span>
                                <span className="text-emerald-600 font-black truncate max-w-[100px] md:max-w-[120px]" title={stats.topGainer.name || stats.topGainer.symbol}>
                                    {stats.topGainer.name || stats.topGainer.symbol}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500 font-bold">Worst Performer</span>
                                <span className="text-rose-600 font-black truncate max-w-[100px] md:max-w-[120px]" title={stats.topLoser.name || stats.topLoser.symbol}>
                                    {stats.topLoser.name || stats.topLoser.symbol}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs text-slate-300 italic font-bold">Add assets to see insights</p>
                    )}
                </div>
            </div>

            {/* Active Accounts Card */}
            <div className="bg-indigo-600 p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-3xl text-white shadow-xl shadow-indigo-100 flex flex-col justify-between relative overflow-hidden">
                <PieIcon
                    size={100}
                    className="absolute -bottom-6 -left-6 opacity-10 text-white rotate-12 w-20 h-20 md:w-24 md:h-24 lg:w-[100px] lg:h-[100px]"
                />
                <div className="relative z-10">
                    <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest">
                        Active Accounts
                    </p>
                    <h3 className="text-3xl md:text-4xl font-black mt-2 tracking-tight">
                        {accounts.length}
                    </h3>
                    <div className="flex flex-wrap gap-1 mt-3 md:mt-4">
                        {accounts.slice(0, 3).map(a => (
                            <span
                                key={a}
                                className="px-2 py-0.5 bg-white/10 rounded-md text-[9px] font-black uppercase"
                            >
                                {a}
                            </span>
                        ))}
                    </div>
                </div>
                <button
                    onClick={onQuickAdd}
                    className="relative z-10 mt-4 md:mt-6 w-full py-3 bg-white text-indigo-600 rounded-xl md:rounded-2xl font-black text-xs uppercase shadow-lg shadow-black/5 hover:scale-105 transition-transform touch-manipulation min-h-[44px]"
                >
                    Quick Add Asset
                </button>
            </div>
        </section>
    );
};

export default StatsCards;
