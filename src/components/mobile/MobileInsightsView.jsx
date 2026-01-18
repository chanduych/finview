import React from 'react';
import PortfolioInsights from '../PortfolioInsights';

/**
 * MobileInsightsView - Full-screen insights view for mobile
 */
const MobileInsightsView = ({ insights }) => {
    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 p-4 sticky top-0 z-30">
                <h1 className="text-lg font-black text-slate-800">
                    Portfolio Insights
                </h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Actionable Intelligence
                </p>
            </div>

            {/* Insights Content */}
            <div className="flex-1 overflow-y-auto p-4">
                <PortfolioInsights insights={insights} />
            </div>
        </div>
    );
};

export default MobileInsightsView;
