import React, { useEffect, useState } from 'react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
    id: string;
    message: string;
    type: NotificationType;
    duration?: number;
}

interface ToastProps {
    notification: Notification;
    onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ notification, onClose }) => {
    const [isFadingOut, setIsFadingOut] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsFadingOut(true);
            setTimeout(() => onClose(notification.id), 500); // Wait for fade animation
        }, (notification.duration || 4000) - 500);

        return () => clearTimeout(timer);
    }, [notification.id, notification.duration, onClose]);

    const bgColor = {
        success: 'bg-green-600',
        error: 'bg-red-600',
        info: 'bg-blue-600',
        warning: 'bg-amber-600',
    }[notification.type];

    const icon = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
        warning: '⚠️',
    }[notification.type];

    return (
        <div
            className={`
        relative z-[100] flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl text-white transform transition-all duration-500
        ${isFadingOut ? 'opacity-0 translate-y-4 scale-95' : 'opacity-100 translate-y-0 scale-100'}
        ${bgColor}
      `}
            style={{ minWidth: '300px' }}
        >
            <span className="text-xl">{icon}</span>
            <p className="font-bold flex-grow">{notification.message}</p>
            <button
                onClick={() => onClose(notification.id)}
                className="ml-2 text-white/50 hover:text-white transition-colors text-2xl leading-none"
            >
                &times;
            </button>
        </div>
    );
};

export default Toast;
