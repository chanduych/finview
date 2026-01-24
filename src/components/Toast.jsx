import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

/**
 * Toast Notification Component
 * 
 * Usage:
 *   <Toast 
 *     message="Success!" 
 *     type="success" 
 *     onClose={() => setShowToast(false)} 
 *   />
 * 
 * Types: success, error, info
 */
const Toast = ({ message, type = 'info', onClose, duration = 3000 }) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsExiting(true);
            setTimeout(onClose, 200);
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(onClose, 200);
    };

    const icons = {
        success: CheckCircle,
        error: XCircle,
        info: Info
    };

    const Icon = icons[type] || Info;

    return (
        <div className="toast-container">
            <div className={`toast toast-${type} ${isExiting ? 'toast-exit' : 'toast-enter'}`}>
                <Icon size={20} />
                <span className="flex-1">{message}</span>
                <button 
                    onClick={handleClose}
                    className="p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};

/**
 * Toast Container with state management
 * Add this to your app root and use the exposed methods
 */
export const useToast = () => {
    const [toasts, setToasts] = useState([]);

    const showToast = (message, type = 'info', duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type, duration }]);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const ToastContainer = () => (
        <>
            {toasts.map(toast => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    duration={toast.duration}
                    onClose={() => removeToast(toast.id)}
                />
            ))}
        </>
    );

    return {
        showToast,
        success: (msg) => showToast(msg, 'success'),
        error: (msg) => showToast(msg, 'error'),
        info: (msg) => showToast(msg, 'info'),
        ToastContainer
    };
};

export default Toast;
