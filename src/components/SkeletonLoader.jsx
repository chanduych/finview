import React from 'react';
import { useDarkModeContext } from './MobileLayout';

/**
 * SkeletonLoader - Shimmer effect skeleton for loading states
 */
const SkeletonLoader = ({ className = '', width, height, rounded = 'rounded' }) => {
    const { isDarkMode } = useDarkModeContext();
    
    return (
        <div
            className={`${isDarkMode ? 'bg-slate-700 shimmer-dark' : 'bg-slate-200 shimmer'} ${rounded} ${className}`}
            style={{ width, height }}
        />
    );
};

/**
 * PortfolioSummarySkeleton - Skeleton for portfolio summary card
 */
export const PortfolioSummarySkeleton = () => {
    const { isDarkMode } = useDarkModeContext();
    
    return (
        <div className={`premium-gradient rounded-2xl p-5 shadow-xl ${isDarkMode ? 'opacity-80' : ''}`}>
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <SkeletonLoader width={32} height={32} rounded="rounded-lg" />
                <SkeletonLoader width={120} height={12} />
            </div>
            
            {/* Main Value */}
            <div className="mb-4">
                <SkeletonLoader width={80} height={10} className="mb-1" />
                <SkeletonLoader width={180} height={36} className="mb-2" />
                <div className="flex items-center gap-2">
                    <SkeletonLoader width={100} height={24} rounded="rounded-lg" />
                    <SkeletonLoader width={60} height={20} />
                </div>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/5">
                        <SkeletonLoader width={60} height={8} className="mb-1" />
                        <SkeletonLoader width={80} height={14} />
                    </div>
                ))}
            </div>
        </div>
    );
};

/**
 * AssetCardSkeleton - Skeleton for asset card
 */
export const AssetCardSkeleton = () => {
    const { isDarkMode } = useDarkModeContext();
    
    return (
        <div className={`${isDarkMode ? 'bg-slate-800' : 'bg-white'} rounded-2xl shadow-sm border ${isDarkMode ? 'border-slate-700' : 'border-slate-200'} overflow-hidden`}>
            {/* Card Header */}
            <div className="p-3">
                <div className="flex items-center gap-2.5">
                    <SkeletonLoader width={36} height={36} rounded="rounded-lg" />
                    <div className="flex-1 min-w-0">
                        <SkeletonLoader width={120} height={13} className="mb-1" />
                        <SkeletonLoader width={150} height={10} />
                    </div>
                    <div className="text-right">
                        <SkeletonLoader width={80} height={13} className="mb-1" />
                        <SkeletonLoader width={70} height={9} />
                    </div>
                    <SkeletonLoader width={18} height={18} rounded="rounded-full" />
                </div>
            </div>
        </div>
    );
};

/**
 * GroupHeaderSkeleton - Skeleton for group header
 */
export const GroupHeaderSkeleton = () => {
    const { isDarkMode } = useDarkModeContext();
    
    return (
        <div className={`rounded-2xl overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white/95 backdrop-blur-lg border-slate-200'} border shadow-sm`}>
            <div className="p-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <SkeletonLoader width={36} height={36} rounded="rounded-xl" />
                        <div>
                            <SkeletonLoader width={100} height={14} className="mb-1" />
                            <SkeletonLoader width={80} height={10} />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <SkeletonLoader width={60} height={20} rounded="rounded-lg" />
                        <SkeletonLoader width={50} height={20} rounded="rounded-lg" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SkeletonLoader;
