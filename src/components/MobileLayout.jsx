import React, { useState, createContext, useContext } from 'react';
import { Home, PieChart, Settings, Lightbulb, Plus } from 'lucide-react';
import useDarkMode from '../hooks/useDarkMode';

// Create context to share dark mode state with child components
export const DarkModeContext = createContext({ isDarkMode: false, toggleDarkMode: () => {} });
export const useDarkModeContext = () => useContext(DarkModeContext);

/**
 * MobileLayout Component - Single Page App with Bottom Navigation
 * Latest mobile UX trends:
 * - Bottom navigation (thumb-friendly)
 * - Smooth page transitions
 * - Floating Action Button (FAB)
 * - Native app feel
 * - Dark mode support
 */
const MobileLayout = ({
    children,
    currentView,
    onViewChange,
    onQuickAdd,
    onOpenSettings,
    stats
}) => {
    const [direction, setDirection] = useState('');
    const darkMode = useDarkMode();
    const { isDarkMode, toggleDarkMode } = darkMode;

    const navItems = [
        { id: 'portfolio', icon: Home, label: 'Portfolio' },
        { id: 'insights', icon: Lightbulb, label: 'Insights' },
        { id: 'add', icon: Plus, label: 'Add', isAction: true }, // Center action button
        { id: 'analytics', icon: PieChart, label: 'Analytics' },
        { id: 'settings', icon: Settings, label: 'Settings' }
    ];

    const handleNavClick = (viewId) => {
        // Haptic feedback
        if (navigator.vibrate) navigator.vibrate(10);

        // Handle special actions
        if (viewId === 'add') {
            if (navigator.vibrate) navigator.vibrate(20);
            onQuickAdd();
            return;
        }

        if (viewId === 'settings') {
            onOpenSettings();
            return;
        }

        // Handle view changes
        const currentIndex = navItems.findIndex(item => item.id === currentView);
        const newIndex = navItems.findIndex(item => item.id === viewId);

        setDirection(newIndex > currentIndex ? 'slide-left' : 'slide-right');

        setTimeout(() => {
            onViewChange(viewId);
        }, 50);
    };

    return (
        <DarkModeContext.Provider value={darkMode}>
            <div className={`md:hidden flex flex-col h-screen overflow-hidden transition-colors duration-300 ${
                isDarkMode ? 'bg-slate-900' : 'bg-slate-50'
            }`}>
                {/* Content Area with transitions */}
                <div className={`flex-1 overflow-y-auto overflow-x-hidden transition-transform duration-300 ${
                    direction === 'slide-left' ? 'animate-slideInLeft' :
                    direction === 'slide-right' ? 'animate-slideInRight' : ''
                }`}>
                    {children}
                </div>

            {/* Bottom Navigation Bar - Enhanced with shadow */}
            <nav className={`backdrop-blur-lg border-t safe-bottom transition-colors duration-300 ${
                isDarkMode 
                    ? 'bg-slate-900/95 border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]' 
                    : 'bg-white/95 border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]'
            }`}>
                <div className="grid grid-cols-5 h-16 items-center px-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentView === item.id;
                        const isAddButton = item.isAction;

                        return (
                            <button
                                key={item.id}
                                onClick={() => handleNavClick(item.id)}
                                className={`flex flex-col items-center justify-center gap-0.5 transition-all relative press-effect ${
                                    isAddButton
                                        ? 'transform -translate-y-3'
                                        : isActive
                                        ? 'text-teal-600'
                                        : isDarkMode 
                                            ? 'text-slate-500 active:text-slate-300'
                                            : 'text-slate-400 active:text-slate-600'
                                }`}
                            >
                                {isAddButton ? (
                                    // Elevated Add Button - Brand gradient
                                    <div className={`w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-700 text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform ${
                                        isDarkMode ? 'shadow-teal-500/30' : 'shadow-teal-300/50'
                                    }`}>
                                        <Icon size={28} strokeWidth={3} />
                                    </div>
                                ) : (
                                    // Regular Nav Buttons
                                    <>
                                        <div className={`p-1.5 rounded-xl transition-all ${
                                            isActive 
                                                ? isDarkMode 
                                                    ? 'bg-teal-900/50 scale-110' 
                                                    : 'bg-teal-50 scale-110'
                                                : 'scale-100'
                                        }`}>
                                            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                        </div>
                                        <span className={`text-[9px] ${
                                            isActive 
                                                ? isDarkMode 
                                                    ? 'font-black text-teal-400' 
                                                    : 'font-black text-teal-600'
                                                : 'font-semibold'
                                        }`}>
                                            {item.label}
                                        </span>
                                    </>
                                )}
                            </button>
                        );
                    })}
                </div>
            </nav>

            <style>{`
                @keyframes slideInLeft {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }

                @keyframes slideInRight {
                    from {
                        transform: translateX(-100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }

                .animate-slideInLeft {
                    animation: slideInLeft 0.3s ease-out;
                }

                .animate-slideInRight {
                    animation: slideInRight 0.3s ease-out;
                }

                /* Safe area for notched devices */
                .safe-bottom {
                    padding-bottom: env(safe-area-inset-bottom);
                }
            `}</style>
            </div>
        </DarkModeContext.Provider>
    );
};

export default MobileLayout;
