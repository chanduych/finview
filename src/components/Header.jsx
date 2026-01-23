import React, { useState } from 'react';
import { Activity, Settings, RefreshCw, LogOut, User, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Header Component - Mobile-Responsive App Header
 *
 * Features:
 * - Logo and title with responsive sizing
 * - Personalized user greeting
 * - Refresh button with loading animation
 * - Settings button
 * - Logout button with user menu
 * - Touch-optimized button sizes (44px minimum)
 * - Sticky positioning with backdrop blur
 *
 * @param {Object} props
 * @param {Function} props.onRefresh - Handler for refresh button
 * @param {boolean} props.isRefreshing - Loading state for refresh animation
 * @param {Function} props.onOpenSettings - Handler for settings button
 * @param {string} props.userName - Personalized user name (optional)
 */
const Header = ({ onRefresh, isRefreshing, onOpenSettings, onOpenReports, onOpenAddAsset, userName }) => {
    const { user, signOut } = useAuth();
    const [showUserMenu, setShowUserMenu] = useState(false);

    // Extract name from user metadata, email, or use provided userName
    // Priority: userName prop > user full name > email username > 'User'
    const getDisplayName = () => {
        if (userName) return userName;

        // Check if user has full name from Google/OAuth
        if (user?.user_metadata?.full_name) {
            return user.user_metadata.full_name.split(' ')[0]; // First name only
        }

        if (user?.email) {
            const emailName = user.email.split('@')[0];
            // Capitalize first letter
            return emailName.charAt(0).toUpperCase() + emailName.slice(1);
        }

        return 'User'; // Fallback (but shouldn't be shown if no user)
    };

    const displayName = getDisplayName();

    const handleSignOut = async () => {
        await signOut();
        setShowUserMenu(false);
    };

    return (
        <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-4 md:px-6 py-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-lg shadow-indigo-200">
                    <Activity size={24} />
                </div>
                <div>
                    <h1 className="text-base md:text-lg lg:text-xl font-black text-slate-800 tracking-tight leading-none">
                        {displayName}'s Portfolio
                    </h1>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-widest italic">
                        Personal Investment Dashboard
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {/* User menu (only show if authenticated with Supabase) */}
                {user && (
                    <div className="relative">
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="hidden md:flex items-center gap-2 p-2 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all"
                        >
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                <User size={16} className="text-indigo-600" />
                            </div>
                            <span className="text-sm font-medium max-w-[120px] truncate">
                                {user.email}
                            </span>
                            <ChevronDown size={16} className={`transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown menu */}
                        {showUserMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setShowUserMenu(false)}
                                />
                                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
                                    <div className="px-4 py-2 border-b border-slate-100">
                                        <p className="text-xs text-slate-500">Signed in as</p>
                                        <p className="text-sm font-medium text-slate-800 truncate">{user.email}</p>
                                    </div>
                                    <button
                                        onClick={handleSignOut}
                                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                                    >
                                        <LogOut size={16} />
                                        Sign Out
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Mobile logout button */}
                {user && (
                    <button
                        onClick={handleSignOut}
                        className="md:hidden p-2.5 rounded-xl bg-red-50 border border-red-100 text-red-600 hover:bg-red-100 transition-all touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                        aria-label="Sign out"
                    >
                        <LogOut size={20} />
                    </button>
                )}

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
