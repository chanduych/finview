import React from 'react';
import { Activity, Settings, RefreshCw, FileText } from 'lucide-react';

/**
 * Header Component - Mobile-Responsive App Header
 *
 * Features:
 * - Logo and title with responsive sizing
 * - Refresh button with loading animation
 * - Settings button
 * - Touch-optimized button sizes (44px minimum)
 * - Sticky positioning with backdrop blur
 *
 * @param {Object} props
 * @param {Function} props.onSettingsClick - Handler for settings button
 * @param {Function} props.onRefreshClick - Handler for refresh button
 * @param {boolean} props.isRefreshing - Loading state for refresh animation
 */
const Header = ({ onRefresh, isRefreshing, onOpenSettings, onOpenReports, onOpenAddAsset }) => {
    return (
        <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-4 md:px-6 py-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-lg shadow-indigo-200">
                    <Activity size={24} />
                </div>
                <div>
                    <h1 className="text-base md:text-lg lg:text-xl font-black text-slate-800 tracking-tight leading-none">
                        My Portfolio Tracker - Chandu
                    </h1>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-widest italic">
                        Personal Investment Dashboard
                    </p>
                </div>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={onOpenSettings}
                    className="p-2.5 md:p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="Settings"
                >
                    <Settings size={20} />
                </button>
                <button
                    onClick={onRefresh}
                    className={`p-2.5 md:p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-100 transition-all touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center ${isRefreshing ? 'animate-spin' : ''}`}
                    aria-label="Refresh prices"
                    disabled={isRefreshing}
                >
                    <RefreshCw size={20} />
                </button>
            </div>
        </header>
    );
};

export default Header;
