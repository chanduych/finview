import React from 'react';
import { Search, Plus, Layers, Activity, Building2, TrendingUp, Wallet } from 'lucide-react';

/**
 * TableControlBar Component - Search, add button, view selector
 *
 * Mobile-Responsive Features:
 * - Responsive layout (stacks on small screens)
 * - Touch-friendly inputs with min-h-[44px]
 * - Shorter placeholder text on mobile using hidden/inline utility
 * - View selector buttons stack better on mobile with flex-wrap
 * - Touch manipulation for better mobile interaction
 *
 * @param {Object} props
 * @param {string} props.tableFilter - Current search filter text
 * @param {Function} props.setTableFilter - Function to update search filter
 * @param {Function} props.setShowAddModal - Function to show add asset modal
 * @param {string} props.selectedView - Currently selected view ('ALL', 'STOCK', 'MF', 'ETF')
 * @param {Function} props.setSelectedView - Function to update selected view
 * @param {Array} props.processedPortfolio - Processed portfolio data for counts
 * @param {Array<string>} props.activeAccounts - List of active accounts
 */
const TableControlBar = ({
    tableFilter,
    setTableFilter,
    setShowAddModal,
    selectedView,
    setSelectedView,
    processedPortfolio,
    activeAccounts
}) => {
    const viewTypes = [
        { value: 'ALL', label: 'All', icon: Layers },
        { value: 'STOCK', label: 'Stocks', icon: Activity },
        { value: 'MF', label: 'Mutual Funds', labelShort: 'MF', icon: Building2 },
        { value: 'ETF', label: 'ETFs', icon: TrendingUp }
    ];

    const handleAddNew = () => {
        setShowAddModal(true);
        setTableFilter('');
    };

    const getCount = (value) => {
        if (value === 'ALL') {
            return processedPortfolio.filter(p => activeAccounts.includes(p.account)).length;
        }
        return processedPortfolio.filter(p =>
            p.type === value && activeAccounts.includes(p.account)
        ).length;
    };

    return (
        <div className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm">
            <div className="p-4 md:p-6">
                {/* Header + Search + Add Button */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                    {/* Title */}
                    <div>
                        <h3 className="font-black text-lg md:text-xl text-slate-800 tracking-tight mb-1">
                            Portfolio Holdings
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            View by Asset Type
                        </p>
                    </div>

                    {/* Search + Add Button */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full lg:max-w-xl">
                        {/* Search Input */}
                        <div className="relative w-full group">
                            <Search
                                className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none"
                                size={16}
                            />
                            <input
                                type="text"
                                placeholder="Search by Name, Symbol or Wallet..."
                                className="
                                    w-full min-h-[44px]
                                    pl-10 md:pl-11 pr-3 md:pr-4 py-3
                                    bg-white border border-slate-200
                                    rounded-xl md:rounded-2xl
                                    text-xs md:text-sm font-bold
                                    outline-none
                                    focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/5
                                    transition-all
                                    touch-manipulation
                                "
                                value={tableFilter}
                                onChange={(e) => setTableFilter(e.target.value)}
                                aria-label="Search by Name, Symbol or Wallet"
                            />
                        </div>

                        {/* Add New Button */}
                        <button
                            onClick={handleAddNew}
                            className="
                                w-full sm:w-auto min-h-[44px]
                                bg-indigo-600 text-white
                                px-5 md:px-6 py-3
                                rounded-xl md:rounded-2xl
                                font-black text-sm
                                shadow-lg md:shadow-xl shadow-indigo-100
                                hover:bg-indigo-700 active:bg-indigo-800
                                transition-all
                                flex items-center justify-center gap-2
                                shrink-0
                                touch-manipulation
                            "
                        >
                            <Plus size={18} />
                            <span>Add New</span>
                        </button>
                    </div>
                </div>

                {/* View Type Selector */}
                <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-2 -mb-2 scrollbar-hide">
                    {viewTypes.map(({ value, label, labelShort, icon: Icon }) => {
                        const count = getCount(value);
                        const displayLabel = labelShort && window.innerWidth < 640 ? labelShort : label;

                        return (
                            <button
                                key={value}
                                onClick={() => setSelectedView(value)}
                                className={`
                                    px-3 md:px-4 py-2.5 min-h-[44px]
                                    rounded-xl
                                    text-[11px] font-black uppercase
                                    transition-all border-2
                                    flex items-center gap-1.5 md:gap-2
                                    shrink-0
                                    touch-manipulation
                                    ${selectedView === value
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                        : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600 active:bg-slate-50'
                                    }
                                `}
                            >
                                <Icon size={16} className="shrink-0" />
                                <span className="hidden sm:inline">{label}</span>
                                <span className="sm:hidden">{labelShort || label}</span>
                                <span
                                    className={`
                                        ml-0.5 md:ml-1 text-[9px]
                                        px-1.5 md:px-2 py-0.5
                                        rounded-full
                                        ${selectedView === value
                                            ? 'bg-white/20 text-white'
                                            : 'bg-slate-100 text-slate-600'
                                        }
                                    `}
                                >
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default TableControlBar;
