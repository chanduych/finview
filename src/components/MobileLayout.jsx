import React, { useState } from 'react';
import { Home, PieChart, Settings, TrendingUp, Plus } from 'lucide-react';

/**
 * MobileLayout Component - Single Page App with Bottom Navigation
 * Latest mobile UX trends:
 * - Bottom navigation (thumb-friendly)
 * - Smooth page transitions
 * - Floating Action Button (FAB)
 * - Native app feel
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

    const navItems = [
        { id: 'portfolio', icon: Home, label: 'Portfolio' },
        { id: 'insights', icon: TrendingUp, label: 'Insights' },
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
        <div className="md:hidden flex flex-col h-screen bg-slate-50 overflow-hidden">
            {/* Content Area with transitions */}
            <div className={`flex-1 overflow-y-auto overflow-x-hidden transition-transform duration-300 ${
                direction === 'slide-left' ? 'animate-slideInLeft' :
                direction === 'slide-right' ? 'animate-slideInRight' : ''
            }`}>
                {children}
            </div>

            {/* Bottom Navigation Bar */}
            <nav className="bg-white border-t border-slate-200 safe-bottom">
                <div className="grid grid-cols-5 h-16 items-center px-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentView === item.id;
                        const isAddButton = item.isAction;

                        return (
                            <button
                                key={item.id}
                                onClick={() => handleNavClick(item.id)}
                                className={`flex flex-col items-center justify-center gap-1 transition-all relative ${
                                    isAddButton
                                        ? 'transform -translate-y-3'
                                        : isActive
                                        ? 'text-indigo-600'
                                        : 'text-slate-400 active:text-slate-600'
                                }`}
                            >
                                {isAddButton ? (
                                    // Elevated Add Button
                                    <div className="w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform">
                                        <Icon size={28} strokeWidth={3} />
                                    </div>
                                ) : (
                                    // Regular Nav Buttons
                                    <>
                                        <div className={`transition-transform ${isActive ? 'scale-110' : 'scale-100'}`}>
                                            <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                                        </div>
                                        <span className={`text-[10px] font-bold ${
                                            isActive ? 'font-black' : 'font-semibold'
                                        }`}>
                                            {item.label}
                                        </span>
                                        {isActive && (
                                            <div className="absolute bottom-0 w-12 h-1 bg-indigo-600 rounded-t-full" />
                                        )}
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
    );
};

export default MobileLayout;
