import React from 'react';
import { ShieldAlert } from 'lucide-react';

/**
 * ConfirmationModal Component
 *
 * A reusable confirmation modal for destructive actions like deleting assets or wallets.
 * Mobile-responsive with proper touch targets and adaptive sizing.
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Callback to close the modal
 * @param {Function} props.onConfirm - Callback when user confirms the action
 * @param {string} props.title - Modal title (e.g., "Delete Asset?", "Remove Wallet?")
 * @param {React.ReactNode} props.description - Description or warning message
 * @param {string} [props.additionalInfo] - Optional additional information to display
 * @param {string} [props.confirmText="Delete"] - Text for the confirm button
 * @param {string} [props.cancelText="Cancel"] - Text for the cancel button
 */
const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    additionalInfo,
    confirmText = "Delete",
    cancelText = "Cancel"
}) => {
    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-full sm:max-w-sm rounded-2xl md:rounded-[3rem] p-4 md:p-8 shadow-2xl space-y-4 md:space-y-6">
                {/* Icon */}
                <div className="w-14 h-14 md:w-16 md:h-16 bg-rose-50 text-rose-500 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto">
                    <ShieldAlert size={28} className="md:w-8 md:h-8" />
                </div>

                {/* Content */}
                <div className="text-center space-y-2">
                    <h2 className="text-lg md:text-xl font-black text-slate-800 tracking-tight">
                        {title}
                    </h2>
                    <div className="text-sm text-slate-500 font-medium">
                        {description}
                    </div>
                    {additionalInfo && (
                        <p className="text-xs text-slate-400 font-bold">
                            {additionalInfo}
                        </p>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 md:py-4 bg-slate-100 text-slate-600 rounded-xl md:rounded-2xl font-bold text-xs uppercase min-h-[44px] touch-manipulation"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 py-3 md:py-4 bg-rose-600 text-white rounded-xl md:rounded-2xl font-bold text-xs uppercase shadow-lg shadow-rose-100 min-h-[44px] touch-manipulation hover:bg-rose-700 transition-colors"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
