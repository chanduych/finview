import React from 'react';
import { X } from 'lucide-react';

/**
 * ReportsModal Component
 *
 * Modal displaying comprehensive portfolio analytics including:
 * - Portfolio XIRR (Extended Internal Rate of Return)
 * - Year-wise investment summary
 * - Sector-wise exposure breakdown
 * - Capital gains summary (STCG/LTCG)
 * - Total dividends received
 *
 * Mobile-responsive with scrollable tables and adaptive layouts.
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Callback to close the modal
 * @param {Object} props.stats - Portfolio statistics object
 * @param {number|null} props.stats.portfolioXIRR - Portfolio XIRR percentage
 * @param {Object} props.stats.sectorExposure - Sector-wise exposure object {sector: value}
 * @param {number} props.stats.totalSTCG - Total short-term capital gains
 * @param {number} props.stats.totalLTCG - Total long-term capital gains
 * @param {number} props.stats.totalDividends - Total dividends received
 * @param {Function} props.getYearWiseSummary - Function that returns year-wise summary array
 * @param {Function} props.formatCurrency - Function to format currency values
 * @param {Function} props.formatCurrencyWithDecimals - Function to format currency with decimals
 */
const ReportsModal = ({
    isOpen,
    onClose,
    stats,
    getYearWiseSummary,
    formatCurrency,
    formatCurrencyWithDecimals
}) => {
    if (!isOpen) return null;

    const yearWiseSummary = getYearWiseSummary();

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
            <div className="bg-white w-full max-w-full md:max-w-4xl rounded-2xl md:rounded-[3.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-4 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50 flex-shrink-0">
                    <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight leading-none">
                        Portfolio Reports
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                        aria-label="Close reports"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 md:p-8 space-y-6 md:space-y-8 overflow-y-auto flex-1">
                    {/* Portfolio XIRR */}
                    {stats.portfolioXIRR !== null && (
                        <div className="bg-indigo-50 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-indigo-100">
                            <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">
                                Portfolio XIRR
                            </h3>
                            <p className="text-3xl md:text-4xl font-black text-indigo-700">
                                {stats.portfolioXIRR.toFixed(2)}%
                            </p>
                        </div>
                    )}

                    {/* Year-wise Summary */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Year-wise Investment Summary
                        </h3>
                        {/* Table wrapper with horizontal scroll for mobile */}
                        <div className="overflow-x-auto -mx-4 md:mx-0">
                            <div className="inline-block min-w-full align-middle px-4 md:px-0">
                                <div className="bg-slate-50 rounded-xl md:rounded-2xl overflow-hidden border border-slate-200">
                                    <table className="w-full min-w-[600px]">
                                        <thead className="bg-slate-100">
                                            <tr>
                                                <th className="px-3 md:px-4 py-3 text-left text-[10px] font-black text-slate-600 uppercase whitespace-nowrap">
                                                    Year
                                                </th>
                                                <th className="px-3 md:px-4 py-3 text-right text-[10px] font-black text-slate-600 uppercase whitespace-nowrap">
                                                    Invested
                                                </th>
                                                <th className="px-3 md:px-4 py-3 text-right text-[10px] font-black text-slate-600 uppercase whitespace-nowrap">
                                                    Dividends
                                                </th>
                                                <th className="px-3 md:px-4 py-3 text-right text-[10px] font-black text-slate-600 uppercase whitespace-nowrap">
                                                    Transactions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200">
                                            {yearWiseSummary.map((year, idx) => (
                                                <tr key={idx} className="hover:bg-white">
                                                    <td className="px-3 md:px-4 py-3 font-bold text-slate-700 text-sm">
                                                        {year.year}
                                                    </td>
                                                    <td className="px-3 md:px-4 py-3 text-right font-black text-slate-800 text-sm whitespace-nowrap">
                                                        {formatCurrency(year.invested)}
                                                    </td>
                                                    <td className="px-3 md:px-4 py-3 text-right font-black text-emerald-600 text-sm whitespace-nowrap">
                                                        {formatCurrencyWithDecimals(year.dividends)}
                                                    </td>
                                                    <td className="px-3 md:px-4 py-3 text-right font-bold text-slate-600 text-sm">
                                                        {year.transactions}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sector Exposure */}
                    {Object.keys(stats.sectorExposure).length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Sector-wise Exposure
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                                {Object.entries(stats.sectorExposure)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([sector, value]) => (
                                        <div
                                            key={sector}
                                            className="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"
                                        >
                                            <span className="font-black text-slate-700 text-sm break-words">
                                                {sector}
                                            </span>
                                            <span className="font-black text-indigo-600 text-sm whitespace-nowrap">
                                                {formatCurrency(value)}
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    {/* Capital Gains Summary */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Capital Gains Summary
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                            <div className="bg-rose-50 p-4 md:p-6 rounded-xl md:rounded-2xl border border-rose-100">
                                <p className="text-[10px] font-black text-rose-600 uppercase mb-2">
                                    Short Term (STCG)
                                </p>
                                <p className="text-xl md:text-2xl font-black text-rose-700 break-words">
                                    {formatCurrency(stats.totalSTCG)}
                                </p>
                            </div>
                            <div className="bg-emerald-50 p-4 md:p-6 rounded-xl md:rounded-2xl border border-emerald-100">
                                <p className="text-[10px] font-black text-emerald-600 uppercase mb-2">
                                    Long Term (LTCG)
                                </p>
                                <p className="text-xl md:text-2xl font-black text-emerald-700 break-words">
                                    {formatCurrency(stats.totalLTCG)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Total Dividends */}
                    {stats.totalDividends > 0 && (
                        <div className="bg-emerald-50 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-emerald-100">
                            <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">
                                Total Dividends Received
                            </h3>
                            <p className="text-2xl md:text-3xl font-black text-emerald-700 break-words">
                                {formatCurrencyWithDecimals(stats.totalDividends)}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReportsModal;
