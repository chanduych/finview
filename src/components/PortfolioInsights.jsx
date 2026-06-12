import React, { useState } from 'react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip
} from 'recharts';
import { formatCurrency } from '../utils/formatters';

/**
 * PortfolioInsights Component
 *
 * Mobile-responsive carousel showcasing portfolio intelligence:
 * - Capital Deployment over time with range selector
 * - Tax Intelligence (STCG/LTCG breakdown)
 * - Concentration Risk analysis
 * - Win/Loss Ratio performance
 * - Asset Overweight distribution
 *
 * Props:
 * @param {Array} insights - Array of insight objects with type, title, description, value, icon, color, and data
 */
const PortfolioInsights = ({ insights }) => {
    const [currentInsightIndex, setCurrentInsightIndex] = useState(0);
    const [capitalDeploymentRange, setCapitalDeploymentRange] = useState('12'); // '6', '12', '24', 'all'
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);

    // Minimum swipe distance (in pixels) to trigger navigation
    const minSwipeDistance = 50;

    if (!insights || !Array.isArray(insights) || insights.length === 0) {
        return null;
    }

    const onTouchStart = (e) => {
        setTouchEnd(null); // Reset touch end
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe && currentInsightIndex < insights.length - 1) {
            // Swipe left - go to next insight
            setCurrentInsightIndex(currentInsightIndex + 1);
        }
        if (isRightSwipe && currentInsightIndex > 0) {
            // Swipe right - go to previous insight
            setCurrentInsightIndex(currentInsightIndex - 1);
        }
    };

    const safeIndex = Math.min(currentInsightIndex, insights.length - 1);
    const insight = insights[safeIndex];

    if (!insight || !insight.icon) return null;

    const Icon = insight.icon;
    const colorClasses = {
        indigo: 'bg-teal-50 border-teal-200 text-teal-600',
        emerald: 'bg-emerald-50 border-emerald-200 text-emerald-600',
        amber: 'bg-amber-50 border-amber-200 text-amber-600',
        rose: 'bg-rose-50 border-rose-200 text-rose-600',
        slate: 'bg-slate-50 border-slate-200 text-slate-600'
    };
    const colorClass = colorClasses[insight.color] || colorClasses.slate;

    return (
        <section className="mt-4 md:mt-6">
            <div className="bg-white p-3 md:p-6 lg:p-8 rounded-xl md:rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Header with indicators */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                            Portfolio Insights
                        </h3>
                        <p className="text-xs text-slate-600 font-bold">Actionable Intelligence</p>
                    </div>
                    {insights.length > 1 && (
                        <div className="flex items-center gap-1.5">
                            {insights.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentInsightIndex(idx)}
                                    className={`rounded-full transition-all ${
                                        idx === currentInsightIndex
                                            ? 'bg-teal-600 w-5 h-2'
                                            : 'bg-slate-300 w-2 h-2 hover:bg-slate-400'
                                    }`}
                                    title={`Insight ${idx + 1} of ${insights.length}`}
                                    aria-label={`View insight ${idx + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Current Insight Display */}
                <div
                    className={`p-3 md:p-6 rounded-xl border-2 ${colorClass} transition-all duration-500`}
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                >
                    <div className="flex items-start gap-3 mb-3">
                        <div className={`p-2 md:p-3 rounded-lg md:rounded-xl bg-white/80 flex-shrink-0 ${
                            insight.color === 'indigo' ? 'text-teal-600' :
                            insight.color === 'emerald' ? 'text-emerald-600' :
                            insight.color === 'amber' ? 'text-amber-600' :
                            insight.color === 'rose' ? 'text-rose-600' :
                            'text-slate-600'
                        }`}>
                            <Icon size={24} className="md:w-8 md:h-8" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-xs md:text-sm font-black uppercase tracking-tight mb-1 truncate">
                                {insight.title}
                            </h4>
                            <p className="text-[10px] md:text-xs text-slate-600 font-bold mb-2 line-clamp-2">
                                {insight.description}
                            </p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-base md:text-xl font-black">
                                    {insight.value}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Capital Deployment Chart */}
                    {insight.type === 'capital' && insight.data && insight.data.monthlyData && (() => {
                        const allData = insight.data.monthlyData;
                        let filteredData = allData;
                        if (capitalDeploymentRange !== 'all') {
                            const months = parseInt(capitalDeploymentRange);
                            filteredData = allData.slice(-months);
                        }
                        
                        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

                        // Find peak month and max amount for bar width calculation
                        const peakMonth = filteredData.reduce((max, item) =>
                            item.amount > (max?.amount || 0) ? item : max,
                            filteredData[0]
                        );
                        const maxAmount = peakMonth?.amount || 1;

                        // Calculate total for the filtered period
                        const totalInvested = filteredData.reduce((sum, item) => sum + (item.amount || 0), 0);

                        return (
                            <div className="mt-4 bg-white/60 p-3 md:p-4 rounded-xl">
                                <div className="flex flex-col gap-3 mb-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase">
                                                Monthly Investment
                                            </p>
                                            {peakMonth && peakMonth.amount > 0 && (
                                                <p className="text-[8px] md:text-[9px] text-emerald-600 font-bold mt-1 truncate">
                                                    Peak: {peakMonth.month} - {formatCurrency(peakMonth.amount)}
                                                </p>
                                            )}
                                        </div>
                                        {/* Range Selector - Compact on mobile */}
                                        <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5 flex-shrink-0">
                                            {['6', '12', 'all'].map((range) => (
                                                <button
                                                    key={range}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setCapitalDeploymentRange(range);
                                                    }}
                                                    className={`px-2 py-1 text-[8px] md:text-[9px] font-black uppercase rounded-md transition-all min-w-[32px] ${
                                                        capitalDeploymentRange === range
                                                            ? 'bg-teal-600 text-white shadow-sm'
                                                            : 'text-slate-500 hover:bg-slate-200'
                                                    }`}
                                                >
                                                    {range === 'all' ? 'All' : `${range}M`}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {/* Total for period - Summary card */}
                                    <div className="flex items-center justify-between bg-teal-50 rounded-lg p-2">
                                        <span className="text-[9px] font-black text-teal-600 uppercase">Total Invested</span>
                                        <span className="text-sm font-black text-teal-700">{formatCurrency(totalInvested)}</span>
                                    </div>
                                </div>
                                
                                {/* Mobile: Clean scrollable list view */}
                                {isMobile ? (
                                    <div className="max-h-[200px] overflow-y-auto scrollbar-hide space-y-1.5">
                                        {[...filteredData].reverse().map((item, idx) => (
                                            <div 
                                                key={idx} 
                                                className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg"
                                            >
                                                <div className="w-14 flex-shrink-0">
                                                    <span className="text-[10px] font-black text-slate-600">
                                                        {item.month}
                                                    </span>
                                                </div>
                                                <div className="flex-1 relative h-5 bg-slate-200 rounded overflow-hidden">
                                                    <div 
                                                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-indigo-400 rounded transition-all duration-300"
                                                        style={{
                                                            width: item.amount > 0 && maxAmount > 0
                                                                ? `${(item.amount / maxAmount) * 100}%`
                                                                : '0%',
                                                        }}
                                                    />
                                                    {item.amount === maxAmount && (
                                                        <div className="absolute inset-y-0 right-1 flex items-center">
                                                            <span className="text-[7px] font-black text-teal-600 bg-white/80 px-1 rounded">PEAK</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="w-20 text-right flex-shrink-0">
                                                    <span className={`text-[10px] font-black ${item.amount > 0 ? 'text-slate-800' : 'text-slate-400'}`}>
                                                        {formatCurrency(item.amount)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    /* Desktop: Bar Chart */
                                    <div className="w-full">
                                        <ResponsiveContainer width="100%" height={160}>
                                            <BarChart 
                                                data={filteredData} 
                                                margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                                <XAxis
                                                    dataKey="month"
                                                    tick={{ fontSize: 9, fill: '#64748b' }}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    interval={filteredData.length > 12 ? Math.floor(filteredData.length / 12) : 0}
                                                />
                                                <YAxis
                                                    tick={{ fontSize: 9, fill: '#64748b' }}
                                                    tickFormatter={(val) => val >= 100000 ? `${(val/100000).toFixed(0)}L` : val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}
                                                    width={40}
                                                    tickLine={false}
                                                    axisLine={false}
                                                />
                                                <Tooltip
                                                    formatter={(val) => [formatCurrency(val), 'Invested']}
                                                    contentStyle={{
                                                        borderRadius: '12px',
                                                        border: 'none',
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                                        fontSize: '11px',
                                                        padding: '8px 12px'
                                                    }}
                                                    cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
                                                />
                                                <Bar
                                                    dataKey="amount"
                                                    fill="#6366f1"
                                                    radius={[4, 4, 0, 0]}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    {/* Tax Intelligence Breakdown */}
                    {insight.type === 'tax' && insight.data && (
                        <div className="mt-4 bg-white/60 p-3 md:p-4 rounded-xl">
                            <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase mb-3">
                                Tax Breakdown
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                                    <p className="text-[8px] md:text-[9px] font-black text-orange-600 uppercase mb-1">
                                        STCG
                                    </p>
                                    <p className="text-xs md:text-sm font-black text-slate-800 break-all">
                                        {formatCurrency(insight.data.stcg)}
                                    </p>
                                    <p className="text-[9px] md:text-[10px] text-slate-600 font-bold">
                                        Tax (20%): {formatCurrency(insight.data.stcgTax)}
                                    </p>
                                </div>
                                <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                                    <p className="text-[8px] md:text-[9px] font-black text-emerald-600 uppercase mb-1">
                                        LTCG
                                    </p>
                                    <p className="text-xs md:text-sm font-black text-slate-800 break-all">
                                        {formatCurrency(insight.data.ltcg)}
                                    </p>
                                    <p className="text-[9px] md:text-[10px] text-slate-600 font-bold">
                                        Tax (12.5%): {formatCurrency(insight.data.ltcgTax)}
                                    </p>
                                    <p className="text-[8px] md:text-[9px] text-emerald-600 font-bold mt-1">
                                        Exempt: {formatCurrency(insight.data.exemptionLeft)} left
                                    </p>
                                </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-slate-200">
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase">
                                        Total Tax Liability
                                    </span>
                                    <span className="text-base md:text-lg font-black text-slate-800 break-all">
                                        {formatCurrency(insight.data.totalTax)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Concentration Risk - Top 5 Holdings */}
                    {insight.type === 'concentration' && insight.data && (
                        <div className="mt-4 bg-white/60 p-3 md:p-4 rounded-xl">
                            <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase mb-3">
                                Top 5 Holdings
                            </p>
                            <div className="space-y-2">
                                {insight.data.top5Holdings.map((holding, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                                        <div className="flex-1 min-w-0 mr-3">
                                            <p className="text-xs md:text-sm font-black text-slate-800 truncate">
                                                {holding.name}
                                            </p>
                                            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
                                                <div
                                                    className="bg-amber-500 h-1.5 rounded-full transition-all"
                                                    style={{ width: `${Math.min(100, holding.percent)}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-xs md:text-sm font-black text-slate-800">
                                                {holding.percent.toFixed(1)}%
                                            </p>
                                            <p className="text-[9px] md:text-[10px] text-slate-500 font-bold">
                                                {formatCurrency(holding.value)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Win/Loss Ratio Performance */}
                    {insight.type === 'winloss' && insight.data && (
                        <div className="mt-4 bg-white/60 p-3 md:p-4 rounded-xl">
                            <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase mb-3">
                                Performance Breakdown
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                                    <p className="text-[8px] md:text-[9px] font-black text-emerald-600 uppercase mb-1">
                                        Winners
                                    </p>
                                    <p className="text-base md:text-lg font-black text-slate-800">
                                        {insight.data.profitable}
                                    </p>
                                    <p className="text-[9px] md:text-[10px] text-slate-600 font-bold break-all">
                                        +{formatCurrency(insight.data.profitableValue)}
                                    </p>
                                </div>
                                <div className="bg-rose-50 p-3 rounded-lg border border-rose-200">
                                    <p className="text-[8px] md:text-[9px] font-black text-rose-600 uppercase mb-1">
                                        Losers
                                    </p>
                                    <p className="text-base md:text-lg font-black text-slate-800">
                                        {insight.data.unprofitable}
                                    </p>
                                    <p className="text-[9px] md:text-[10px] text-slate-600 font-bold break-all">
                                        -{formatCurrency(insight.data.unprofitableValue)}
                                    </p>
                                </div>
                            </div>
                            <div className="pt-3 border-t border-slate-200">
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase">
                                        Net Gain
                                    </span>
                                    <span className={`text-base md:text-lg font-black break-all ${
                                        insight.data.netGain >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                    }`}>
                                        {insight.data.netGain >= 0 ? '+' : ''}{formatCurrency(insight.data.netGain)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Overweight - Multiple Assets */}
                    {insight.type === 'overweight' && insight.data && (
                        <div className="mt-4 bg-white/60 p-3 md:p-4 rounded-xl">
                            <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase mb-3">
                                Asset Distribution
                            </p>
                            <div className="space-y-2">
                                {[
                                    { key: 'equity', label: 'Equities', color: 'indigo' },
                                    { key: 'mf', label: 'Mutual Funds', color: 'emerald' },
                                    { key: 'etf', label: 'ETFs', color: 'amber' }
                                ].map(({ key, label, color }) => {
                                    const asset = insight.data[key];
                                    if (!asset || asset.value === 0) return null;
                                    const colorClasses = {
                                        indigo: 'bg-teal-500',
                                        emerald: 'bg-emerald-500',
                                        amber: 'bg-amber-500',
                                        slate: 'bg-slate-500'
                                    };
                                    return (
                                        <div key={key} className="space-y-1">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs md:text-sm font-black text-slate-700">
                                                    {label}
                                                </span>
                                                <span className="text-xs md:text-sm font-black text-slate-800">
                                                    {asset.percent.toFixed(1)}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-200 rounded-full h-2">
                                                <div
                                                    className={`${colorClasses[color]} h-2 rounded-full transition-all`}
                                                    style={{ width: `${Math.min(100, asset.percent)}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Single Overweight - Single Stock Concentration */}
                    {insight.type === 'singleOverweight' && insight.data && (
                        <div className="mt-4 bg-white/60 p-3 md:p-4 rounded-xl">
                            <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase mb-3">
                                Portfolio Concentration
                            </p>
                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs md:text-sm font-black text-slate-700 truncate mr-2">
                                            {insight.data.stock}
                                        </span>
                                        <span className="text-xs md:text-sm font-black text-amber-600 flex-shrink-0">
                                            {insight.data.percent.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-3">
                                        <div
                                            className="bg-amber-500 h-3 rounded-full transition-all"
                                            style={{ width: `${Math.min(100, insight.data.percent)}%` }}
                                        />
                                    </div>
                                    <p className="text-[9px] md:text-[10px] text-slate-500 font-bold mt-1">
                                        Recommended: &lt;{insight.data.recommended}%
                                    </p>
                                </div>
                                <div className="pt-2 border-t border-slate-200">
                                    <p className="text-[9px] md:text-[10px] text-slate-600 font-bold break-all">
                                        Current Value: {formatCurrency(insight.data.value)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* All Insights Grid Navigation - Horizontal scroll on mobile */}
                {insights.length > 1 && (
                    <div className="mt-4 md:mt-6 -mx-3 md:mx-0 px-3 md:px-0 overflow-x-auto scrollbar-hide">
                        <div className="flex md:grid md:grid-cols-4 gap-2 md:gap-3 min-w-max md:min-w-0">
                            {insights.map((insightItem, idx) => {
                                const InsightIcon = insightItem.icon;
                                const isActive = idx === currentInsightIndex;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentInsightIndex(idx)}
                                        className={`min-h-[44px] min-w-[100px] md:min-w-0 p-2.5 md:p-3 rounded-xl border transition-all text-left touch-manipulation flex-shrink-0 md:flex-shrink ${
                                            isActive
                                                ? 'bg-teal-50 border-teal-300 shadow-sm'
                                                : 'bg-slate-50 border-slate-200 active:bg-slate-100'
                                        }`}
                                    >
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <InsightIcon
                                                size={12}
                                                className={`flex-shrink-0 ${isActive ? 'text-teal-600' : 'text-slate-400'}`}
                                            />
                                            <p className={`text-[8px] md:text-[9px] font-black uppercase truncate ${
                                                isActive ? 'text-teal-600' : 'text-slate-400'
                                            }`}>
                                                {insightItem.title}
                                            </p>
                                        </div>
                                        <p className="text-[8px] md:text-[10px] text-slate-500 font-bold truncate">
                                            {insightItem.value}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default PortfolioInsights;
