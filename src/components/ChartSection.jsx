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
        borderRadius: '16px',
        border: 'none',
        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
        fontSize: '12px'
    };

    // Responsive legend style
    const legendWrapperStyle = {
        fontSize: '10px',
        fontWeight: 'bold',
        textTransform: 'uppercase'
    };

    return (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Asset Allocation Chart */}
            <div className="bg-white p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm h-[280px] md:h-[320px]">
                <h3 className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-4 md:mb-6">
                    Asset Allocation
                </h3>
                <ResponsiveContainer width="100%" height="90%">
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

            {/* Wallet Distribution Chart */}
            <div className="bg-white p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm h-[280px] md:h-[320px]">
                <h3 className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-4 md:mb-6">
                    Wallet Distribution
                </h3>
                <ResponsiveContainer width="100%" height="90%">
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
        </section>
    );
};

export default ChartSection;
