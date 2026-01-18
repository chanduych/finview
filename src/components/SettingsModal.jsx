import React from 'react';
import {
    X,
    Wallet,
    Trash2,
    FolderPlus,
    Check,
    FileJson,
    Download,
    Upload,
    Activity
} from 'lucide-react';

/**
 * SettingsModal Component
 *
 * Modal for managing application settings including:
 * - Wallet management (add/delete wallets)
 * - Data import/export (JSON, CSV, Excel)
 * - Access to reports and analytics
 *
 * Mobile-responsive with proper touch targets and adaptive layouts.
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Callback to close the modal
 * @param {Array<string>} props.accounts - List of wallet/account names
 * @param {Function} props.onDeleteWallet - Callback when user wants to delete a wallet
 * @param {boolean} props.isAddingWallet - Whether the add wallet input is shown
 * @param {Function} props.setIsAddingWallet - Setter for isAddingWallet state
 * @param {string} props.newWalletName - Value of the new wallet name input
 * @param {Function} props.setNewWalletName - Setter for newWalletName state
 * @param {Function} props.onConfirmAddWallet - Callback to confirm adding a new wallet
 * @param {Function} props.onExport - Callback to export data (receives format: 'json'|'csv'|'excel')
 * @param {Function} props.onImport - Callback to handle file import (receives event)
 * @param {Function} props.onOpenReports - Callback to open the reports modal
 */
const SettingsModal = ({
    isOpen,
    onClose,
    accounts,
    onDeleteWallet,
    isAddingWallet,
    setIsAddingWallet,
    newWalletName,
    setNewWalletName,
    onConfirmAddWallet,
    onExport,
    onImport,
    onOpenReports
}) => {
    if (!isOpen) return null;

    const handleConfirmAddWallet = () => {
        onConfirmAddWallet();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleConfirmAddWallet();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
            <div className="bg-white w-full max-w-full sm:max-w-lg rounded-2xl md:rounded-[3.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-4 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50 flex-shrink-0">
                    <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight leading-none">
                        Settings
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                        aria-label="Close settings"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 md:p-8 space-y-6 md:space-y-8 overflow-y-auto flex-1">
                    {/* Wallet Management Section */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Wallet size={12} /> Wallet Management
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                            {accounts.map((acc) => (
                                <div
                                    key={acc}
                                    className="flex items-center justify-between p-3 md:p-4 bg-slate-50 border border-slate-100 rounded-xl md:rounded-[1.5rem] group min-h-[52px]"
                                >
                                    <span className="text-sm font-bold text-slate-700 break-all pr-2">
                                        {acc}
                                    </span>
                                    <button
                                        onClick={() => onDeleteWallet(acc)}
                                        className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                                        title="Delete Wallet"
                                        aria-label={`Delete wallet ${acc}`}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}

                            {/* Add New Wallet Input */}
                            {isAddingWallet ? (
                                <div className="flex flex-col sm:flex-row gap-2 p-2 bg-indigo-50 border border-indigo-100 rounded-xl md:rounded-[1.5rem]">
                                    <input
                                        autoFocus
                                        className="flex-1 px-3 md:px-4 py-3 bg-white border border-indigo-200 rounded-xl text-sm font-bold outline-none min-h-[44px]"
                                        placeholder="Wallet name..."
                                        value={newWalletName}
                                        onChange={(e) => setNewWalletName(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleConfirmAddWallet}
                                            className="bg-indigo-600 text-white p-3 rounded-xl shadow-lg flex-1 sm:flex-initial min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation hover:bg-indigo-700 transition-colors"
                                            aria-label="Confirm add wallet"
                                        >
                                            <Check size={20} />
                                        </button>
                                        <button
                                            onClick={() => setIsAddingWallet(false)}
                                            className="text-slate-400 p-3 rounded-xl hover:bg-slate-100 flex-1 sm:flex-initial min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                                            aria-label="Cancel add wallet"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsAddingWallet(true)}
                                    className="p-3 md:p-4 border-2 border-dashed border-slate-200 rounded-xl md:rounded-[1.5rem] text-sm font-black text-slate-400 hover:border-indigo-300 hover:text-indigo-600 flex items-center justify-center gap-2 transition-all uppercase tracking-widest min-h-[52px] touch-manipulation"
                                >
                                    <FolderPlus size={18} /> New Wallet
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Data Maintenance Section */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <FileJson size={12} /> Data Maintenance
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                                onClick={() => onExport('json')}
                                className="flex items-center justify-center gap-3 p-4 md:p-5 bg-indigo-50 text-indigo-700 rounded-2xl md:rounded-3xl hover:bg-indigo-100 transition-all font-black text-xs uppercase shadow-sm min-h-[52px] touch-manipulation"
                            >
                                <Download size={18} /> Export JSON
                            </button>
                            <label className="flex items-center justify-center gap-3 p-4 md:p-5 bg-slate-100 text-slate-600 rounded-2xl md:rounded-3xl hover:bg-slate-200 transition-all font-black text-xs uppercase cursor-pointer min-h-[52px] touch-manipulation">
                                <Upload size={18} /> Import Data
                                <input
                                    type="file"
                                    className="hidden"
                                    accept=".json,.csv,.xlsx,.xls"
                                    onChange={onImport}
                                />
                            </label>
                        </div>
                        <p className="text-[9px] text-slate-400 text-center px-2">
                            Supports: JSON, CSV (Zerodha), Excel
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                                onClick={() => onExport('csv')}
                                className="flex items-center justify-center gap-3 p-4 md:p-5 bg-emerald-50 text-emerald-700 rounded-2xl md:rounded-3xl hover:bg-emerald-100 transition-all font-black text-xs uppercase shadow-sm min-h-[52px] touch-manipulation"
                            >
                                <Download size={18} /> Export CSV
                            </button>
                            <button
                                onClick={() => onExport('excel')}
                                className="flex items-center justify-center gap-3 p-4 md:p-5 bg-blue-50 text-blue-700 rounded-2xl md:rounded-3xl hover:bg-blue-100 transition-all font-black text-xs uppercase shadow-sm min-h-[52px] touch-manipulation"
                            >
                                <Download size={18} /> Export Excel
                            </button>
                        </div>
                    </div>

                    {/* Reports & Analytics Section */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Activity size={12} /> Reports & Analytics
                        </h3>
                        <button
                            onClick={onOpenReports}
                            className="w-full flex items-center justify-center gap-3 p-4 md:p-5 bg-indigo-600 text-white rounded-2xl md:rounded-3xl hover:bg-indigo-700 transition-all font-black text-xs uppercase shadow-lg min-h-[52px] touch-manipulation"
                        >
                            <Activity size={18} /> View Reports
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
