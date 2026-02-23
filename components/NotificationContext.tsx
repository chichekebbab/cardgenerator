import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Toast, { Notification, NotificationType } from './Toast';

interface NotificationContextType {
  showNotification: (message: string, type?: NotificationType, duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback(
    (message: string, type: NotificationType = 'info', duration: number = 4000) => {
      const id = Math.random().toString(36).substring(2, 9);
      setNotifications((prev) => [...prev, { id, message, type, duration }]);
    },
    [],
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {/* Container for notifications - supports multiple, though Toast currently is absolute positioned */}
      <div className="fixed bottom-0 right-0 p-6 flex flex-col gap-4 pointer-events-none z-[100]">
        {notifications.map((n) => (
          <div key={n.id} className="pointer-events-auto">
            <Toast notification={n} onClose={removeNotification} />
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
