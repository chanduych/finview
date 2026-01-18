import React from 'react';
import { Filter, Plus } from 'lucide-react';

/**
 * FilterBar Component - Account filter and wallet management
 *
 * Mobile-Responsive Features:
 * - Responsive flex layout (stacks on mobile, row on desktop)
 * - Touch-friendly buttons with min-h-[44px]
 * - Touch manipulation for better mobile interaction
 * - Responsive gaps and padding
 *
 * @param {Object} props
 * @param {Array<string>} props.accounts - List of available account names
 * @param {Array<string>} props.activeAccounts - List of currently active account names
 * @param {Function} props.setActiveAccounts - Function to update active accounts
 * @param {Function} props.setShowSettingsModal - Function to show settings modal
 * @param {Function} props.setIsAddingWallet - Function to set wallet adding state
 */
const FilterBar = ({
    accounts,
    activeAccounts,
    setActiveAccounts,
    setShowSettingsModal,
    setIsAddingWallet
}) => {
    const handleAccountToggle = (account) => {
        setActiveAccounts(prev =>
            prev.includes(account)
                ? prev.filter(acc => acc !== account)
                : [...prev, account]
        );
    };

    const handleManageWallets = () => {
        setShowSettingsModal(true);
        setIsAddingWallet(false);
    };

    return (
        <section className="bg-white p-4 md:p-6 lg:p-8 rounded-[1.5rem] md:rounded-[2rem] lg:rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4 md:space-y-6 lg:space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                {/* Title Section */}
                <div className="space-y-1">
                    <h3 className="font-black text-xs flex items-center gap-2 text-slate-800 uppercase tracking-widest">
                        <Filter size={14} className="text-indigo-600" />
                        Account Visibility
                    </h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">
                        Toggle accounts to aggregate views
                    </p>
                </div>

                {/* Account Filter Buttons + Manage Wallets */}
                <div className="flex flex-wrap items-center gap-2">
                    {accounts.map(acc => (
                        <button
                            key={acc}
                            onClick={() => handleAccountToggle(acc)}
                            className={`
                                px-3 md:px-4 py-2 min-h-[44px]
                                rounded-xl text-[10px] font-black uppercase
                                transition-all border
                                touch-manipulation
                                ${activeAccounts.includes(acc)
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                    : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-300 active:bg-slate-50'
                                }
                            `}
                        >
                            {acc}
                        </button>
                    ))}

                    {/* Divider - Hidden on mobile */}
                    <div className="w-px h-6 bg-slate-200 mx-2 hidden md:block" />

                    {/* Manage Wallets Button */}
                    <button
                        onClick={handleManageWallets}
                        className="
                            px-3 md:px-4 py-2 min-h-[44px]
                            rounded-xl
                            bg-slate-50 border border-slate-200
                            text-slate-400 text-[10px] font-black uppercase
                            flex items-center gap-2
                            hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200
                            active:bg-indigo-100
                            transition-all
                            touch-manipulation
                        "
                    >
                        <Plus size={12} />
                        <span className="hidden sm:inline">Manage Wallets</span>
                        <span className="sm:hidden">Wallets</span>
                    </button>
                </div>
            </div>
        </section>
    );
};

export default FilterBar;
