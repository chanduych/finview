import React from 'react';
import ChartSection from '../ChartSection';

/**
 * MobileAnalyticsView - Charts and analytics for mobile
 */
const MobileAnalyticsView = ({ stats }) => {
    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 p-4 sticky top-0 z-30">
                <h1 className="text-lg font-black text-slate-800">
                    Analytics
                </h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Charts & Breakdown
                </p>
            </div>

            {/* Charts Content */}
            <div className="flex-1 overflow-y-auto p-4">
                <ChartSection stats={stats} />
            </div>
        </div>
    );
};

export default MobileAnalyticsView;
