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
        { id: 'analytics', icon: PieChart, label: 'Analytics' },
        { id: 'settings', icon: Settings, label: 'Settings' }
    ];

    const handleNavClick = (viewId) => {
        const currentIndex = navItems.findIndex(item => item.id === currentView);
        const newIndex = navItems.findIndex(item => item.id === viewId);

        setDirection(newIndex > currentIndex ? 'slide-left' : 'slide-right');

        // Haptic feedback
        if (navigator.vibrate) navigator.vibrate(10);

        setTimeout(() => {
            if (viewId === 'settings') {
                onOpenSettings();
            } else {
                onViewChange(viewId);
            }
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

            {/* Floating Action Button (FAB) */}
            <button
                onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(20);
                    onQuickAdd();
                }}
                className="fixed bottom-20 right-4 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-95 transition-transform hover:shadow-indigo-500/50"
                aria-label="Quick Add Asset"
            >
                <Plus size={28} strokeWidth={3} />
            </button>

            {/* Bottom Navigation Bar */}
            <nav className="bg-white border-t border-slate-200 safe-bottom">
                <div className="grid grid-cols-4 h-16">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentView === item.id;

                        return (
                            <button
                                key={item.id}
                                onClick={() => handleNavClick(item.id)}
                                className={`flex flex-col items-center justify-center gap-1 transition-all ${
                                    isActive
                                        ? 'text-indigo-600'
                                        : 'text-slate-400 active:text-slate-600'
                                }`}
                            >
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
