import React from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { COLORS } from '../constants/appConfig';
import { formatCurrency } from '../utils/formatters';

/**
 * ChartSection Component - Mobile-Responsive Asset Allocation Charts
 *
 * Features:
 * - Asset Allocation pie chart
 * - Wallet Distribution pie chart
 * - Fully responsive with mobile-optimized heights
 * - Custom tooltips with percentage calculations
 * - Interactive legends with percentages
 * - Touch-friendly chart interactions
 *
 * @param {Object} props
 * @param {Object} props.stats - Portfolio statistics object
 * @param {Array} props.stats.typeAllocation - Asset type allocation data [{ name, value }]
 * @param {Array} props.stats.walletAllocation - Wallet allocation data [{ name, value }]
 */
const ChartSection = ({ stats }) => {
    // Detect mobile
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    
    // Custom tooltip formatter for pie charts
    const tooltipFormatter = (value, name, props, data) => {
        const total = data.reduce((sum, item) => sum + item.value, 0);
        const percent = total > 0 ? (value / total) * 100 : 0;
        return [
            `${formatCurrency(value)} (${percent.toFixed(1)}%)`,
            props.payload.name
        ];
    };

    // Custom legend formatter
    const legendFormatter = (value, entry, data) => {
        const total = data.reduce((sum, item) => sum + item.value, 0);
        const percent = total > 0 ? (entry.payload.value / total) * 100 : 0;
        return `${value} (${percent.toFixed(1)}%)`;
    };

    // Common tooltip style
    const tooltipStyle = {
        borderRadius: '12px',
        border: 'none',
        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
        fontSize: isMobile ? '10px' : '12px',
        padding: isMobile ? '6px 10px' : '8px 12px'
    };

    // Responsive legend style
    const legendWrapperStyle = {
        fontSize: isMobile ? '9px' : '10px',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        paddingTop: isMobile ? '8px' : '16px'
    };

    // Custom legend with bars for mobile
    const renderMobileLegend = (data, colorOffset = 0) => {
        const total = data.reduce((sum, item) => sum + item.value, 0);
        return (
            <div className="space-y-2 mt-3">
                {data.map((item, index) => {
                    const percent = total > 0 ? (item.value / total) * 100 : 0;
                    return (
                        <div key={item.name} className="flex items-center gap-2">
                            <div 
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: COLORS[(index + colorOffset) % COLORS.length] }}
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-[10px] font-bold text-slate-600 truncate">
                                        {item.name}
                                    </span>
                                    <span className="text-[10px] font-black text-slate-800 flex-shrink-0">
                                        {percent.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                    <div 
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{ 
                                            width: `${percent}%`,
                                            backgroundColor: COLORS[(index + colorOffset) % COLORS.length]
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    // Phase 4: Prepare realized vs unrealized data for chart
    const realizedUnrealizedData = [
        { 
            name: 'Realized', 
            value: Math.abs(stats.realizedGains || 0) 
        },
        { 
            name: 'Unrealized', 
            value: Math.abs(stats.unrealizedGains || 0) 
        }
    ].filter(item => item.value > 0); // Only show if there's data

    return (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Asset Allocation Chart */}
            <div className="bg-white p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-2 md:mb-6">
                    Asset Allocation
                </h3>
                
                {isMobile ? (
                    /* Mobile: Compact chart + bar legend */
                    <div>
                        <div className="h-[140px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.typeAllocation}
                                        innerRadius="55%"
                                        outerRadius="85%"
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {stats.typeAllocation.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={COLORS[index % COLORS.length]}
                                                stroke="none"
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(val, name, props) =>
                                            tooltipFormatter(val, name, props, stats.typeAllocation)
                                        }
                                        contentStyle={tooltipStyle}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        {renderMobileLegend(stats.typeAllocation, 0)}
                    </div>
                ) : (
                    /* Desktop: Full chart with legend */
                    <div className="h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.typeAllocation}
                                    innerRadius="50%"
                                    outerRadius="70%"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.typeAllocation.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                            stroke="none"
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(val, name, props) =>
                                        tooltipFormatter(val, name, props, stats.typeAllocation)
                                    }
                                    contentStyle={tooltipStyle}
                                />
                                <Legend
                                    iconType="circle"
                                    wrapperStyle={legendWrapperStyle}
                                    formatter={(value, entry) =>
                                        legendFormatter(value, entry, stats.typeAllocation)
                                    }
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* Wallet Distribution Chart */}
            <div className="bg-white p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-2 md:mb-6">
                    Wallet Distribution
                </h3>
                
                {isMobile ? (
                    /* Mobile: Compact chart + bar legend */
                    <div>
                        <div className="h-[140px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.walletAllocation}
                                        innerRadius="55%"
                                        outerRadius="85%"
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {stats.walletAllocation.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={COLORS[(index + 2) % COLORS.length]}
                                                stroke="none"
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(val, name, props) =>
                                            tooltipFormatter(val, name, props, stats.walletAllocation)
                                        }
                                        contentStyle={tooltipStyle}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        {renderMobileLegend(stats.walletAllocation, 2)}
                    </div>
                ) : (
                    /* Desktop: Full chart with legend */
                    <div className="h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.walletAllocation}
                                    innerRadius="50%"
                                    outerRadius="70%"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.walletAllocation.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[(index + 2) % COLORS.length]}
                                            stroke="none"
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(val, name, props) =>
                                        tooltipFormatter(val, name, props, stats.walletAllocation)
                                    }
                                    contentStyle={tooltipStyle}
                                />
                                <Legend
                                    iconType="circle"
                                    wrapperStyle={legendWrapperStyle}
                                    formatter={(value, entry) =>
                                        legendFormatter(value, entry, stats.walletAllocation)
                                    }
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* Phase 4: Realized vs Unrealized Gains Chart */}
            {realizedUnrealizedData.length > 0 && (
                <div className="bg-white p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-2 md:mb-6">
                        P&L Breakdown
                    </h3>
                    
                    {isMobile ? (
                        /* Mobile: Compact chart + bar legend */
                        <div>
                            <div className="h-[140px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={realizedUnrealizedData}
                                            innerRadius="55%"
                                            outerRadius="85%"
                                            paddingAngle={3}
                                            dataKey="value"
                                        >
                                            {realizedUnrealizedData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={index === 0 ? '#10b981' : '#3b82f6'} // Green for realized, blue for unrealized
                                                    stroke="none"
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(val, name, props) =>
                                                tooltipFormatter(val, name, props, realizedUnrealizedData)
                                            }
                                            contentStyle={tooltipStyle}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            {renderMobileLegend(realizedUnrealizedData, 4)}
                        </div>
                    ) : (
                        /* Desktop: Full chart with legend */
                        <div className="h-[260px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={realizedUnrealizedData}
                                        innerRadius="50%"
                                        outerRadius="70%"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {realizedUnrealizedData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={index === 0 ? '#10b981' : '#3b82f6'} // Green for realized, blue for unrealized
                                                stroke="none"
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(val, name, props) =>
                                            tooltipFormatter(val, name, props, realizedUnrealizedData)
                                        }
                                        contentStyle={tooltipStyle}
                                    />
                                    <Legend
                                        iconType="circle"
                                        wrapperStyle={legendWrapperStyle}
                                        formatter={(value, entry) =>
                                            legendFormatter(value, entry, realizedUnrealizedData)
                                        }
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};

export default ChartSection;
