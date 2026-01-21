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
        indigo: 'bg-indigo-50 border-indigo-200 text-indigo-600',
        emerald: 'bg-emerald-50 border-emerald-200 text-emerald-600',
        amber: 'bg-amber-50 border-amber-200 text-amber-600',
        rose: 'bg-rose-50 border-rose-200 text-rose-600',
        slate: 'bg-slate-50 border-slate-200 text-slate-600'
    };
    const colorClass = colorClasses[insight.color] || colorClasses.slate;

    return (
        <section className="mt-6">
            <div className="bg-white p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm">
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
                                    className={`rounded-full transition-all p-1 ${
                                        idx === currentInsightIndex
                                            ? 'bg-indigo-600 w-4 h-1.5'
                                            : 'bg-slate-300 w-1.5 h-1.5'
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
                    className={`p-4 md:p-6 rounded-xl border-2 ${colorClass} transition-all duration-500`}
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                >
                    <div className="flex items-start gap-4 mb-4">
                        <div className={`p-3 rounded-xl bg-white/80 ${
                            insight.color === 'indigo' ? 'text-indigo-600' :
                            insight.color === 'emerald' ? 'text-emerald-600' :
                            insight.color === 'amber' ? 'text-amber-600' :
                            insight.color === 'rose' ? 'text-rose-600' :
                            'text-slate-600'
                        }`}>
                            <Icon size={32} className="w-6 h-6 md:w-8 md:h-8" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-xs md:text-sm font-black uppercase tracking-tight mb-2 truncate">
                                {insight.title}
                            </h4>
                            <p className="text-[10px] md:text-xs text-slate-600 font-bold mb-3">
                                {insight.description}
                            </p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-lg md:text-xl font-black break-all">
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
                        const barWidth = filteredData.length > 12 ? Math.max(20, 400 / filteredData.length) : undefined;

                        // Find peak month
                        const peakMonth = filteredData.reduce((max, item) =>
                            item.amount > (max?.amount || 0) ? item : max,
                            filteredData[0]
                        );

                        return (
                            <div className="mt-4 bg-white/60 p-3 md:p-4 rounded-xl">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                                    <div>
                                        <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase">
                                            Monthly Investment Breakdown
                                        </p>
                                        {peakMonth && peakMonth.amount > 0 && (
                                            <p className="text-[8px] md:text-[9px] text-emerald-600 font-bold mt-1">
                                                Peak: {peakMonth.month} - {formatCurrency(peakMonth.amount)}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 flex-wrap">
                                        {['6', '12', '24', 'all'].map((range) => (
                                            <button
                                                key={range}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setCapitalDeploymentRange(range);
                                                }}
                                                className={`px-2 py-1.5 text-[9px] md:text-[10px] font-black uppercase rounded transition-all ${
                                                    capitalDeploymentRange === range
                                                        ? 'bg-indigo-600 text-white'
                                                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                                                }`}
                                            >
                                                {range === 'all' ? 'All' : `${range}M`}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="overflow-x-auto -mx-4 px-4">
                                    <div style={{ minWidth: `${Math.max(100, filteredData.length * (barWidth || 40))}px` }}>
                                        <ResponsiveContainer width="100%" height={200} className="md:h-[250px]">
                                            <BarChart data={filteredData} margin={{ right: 20 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                                <XAxis
                                                    dataKey="month"
                                                    tick={{ fontSize: 8, fill: '#64748b' }}
                                                    angle={filteredData.length > 12 ? -45 : 0}
                                                    textAnchor={filteredData.length > 12 ? "end" : "middle"}
                                                    height={filteredData.length > 12 ? 60 : 30}
                                                    interval={filteredData.length > 24 ? Math.floor(filteredData.length / 12) : 0}
                                                />
                                                <YAxis
                                                    tick={{ fontSize: 9, fill: '#64748b' }}
                                                    tickFormatter={(val) => `₹${(val/1000).toFixed(0)}k`}
                                                />
                                                <Tooltip
                                                    formatter={(val) => formatCurrency(val)}
                                                    contentStyle={{
                                                        borderRadius: '8px',
                                                        border: 'none',
                                                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                                        fontSize: '12px'
                                                    }}
                                                />
                                                <Bar
                                                    dataKey="amount"
                                                    fill="#6366f1"
                                                    radius={[4, 4, 0, 0]}
                                                    barSize={barWidth}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                {filteredData.length > 0 && (
                                    <div className="mt-2 text-center">
                                        <p className="text-[8px] md:text-[9px] text-slate-500 font-bold">
                                            Showing {filteredData.length} of {allData.length} months
                                        </p>
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
                                        indigo: 'bg-indigo-500',
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

                {/* All Insights Grid Navigation */}
                {insights.length > 1 && (
                    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                        {insights.map((insightItem, idx) => {
                            const InsightIcon = insightItem.icon;
                            const isActive = idx === currentInsightIndex;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentInsightIndex(idx)}
                                    className={`min-h-[44px] p-3 rounded-xl border transition-all text-left touch-manipulation ${
                                        isActive
                                            ? 'bg-indigo-50 border-indigo-300 shadow-md'
                                            : 'bg-slate-50 border-slate-200 hover:border-indigo-200'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <InsightIcon
                                            size={14}
                                            className={isActive ? 'text-indigo-600' : 'text-slate-400'}
                                        />
                                        <p className={`text-[8px] md:text-[9px] font-black uppercase truncate ${
                                            isActive ? 'text-indigo-600' : 'text-slate-400'
                                        }`}>
                                            {insightItem.title}
                                        </p>
                                    </div>
                                    <p className="text-[9px] md:text-[10px] text-slate-600 font-bold truncate">
                                        {insightItem.description}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
};

export default PortfolioInsights;
