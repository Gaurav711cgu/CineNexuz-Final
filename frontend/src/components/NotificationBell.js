import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Clock, TrendingUp, Download, Users } from 'lucide-react';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    type: 'new_release',
    title: 'New Episodes Added',
    message: 'Season 2 of "Stranger Things" is now available',
    time: '2 hours ago',
    read: false,
    icon: TrendingUp,
  },
  {
    id: 2,
    type: 'leaving_soon',
    title: 'Leaving Soon',
    message: 'Inception will be removed in 7 days',
    time: '1 day ago',
    read: false,
    icon: Clock,
  },
  {
    id: 3,
    type: 'friend_activity',
    title: 'Friend Activity',
    message: 'John watched "The Dark Knight"',
    time: '2 days ago',
    read: true,
    icon: Users,
  },
];

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        data-testid="notification-bell"
      >
        <Bell size={20} className="text-[hsl(var(--foreground))]" />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.div>
        )}
      </motion.button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-12 w-80 glass-card border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
              data-testid="notification-panel"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-[hsl(var(--primary))] hover:underline"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              {/* Notifications List */}
              <ScrollArea className="h-[400px]">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-[hsl(var(--muted-foreground))]">
                    <Bell size={40} className="mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No notifications</p>
                  </div>
                ) : (
                  <div>
                    {notifications.map((notification) => {
                      const Icon = notification.icon;
                      return (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className={`px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors relative group ${
                            !notification.read ? 'bg-[hsl(var(--primary))]/5' : ''
                          }`}
                        >
                          <div className="flex gap-3">
                            {/* Icon */}
                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                              !notification.read ? 'bg-[hsl(var(--primary))]/20' : 'bg-white/5'
                            }`}>
                              <Icon size={18} className={!notification.read ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))]'} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium mb-1">{notification.title}</p>
                              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">{notification.message}</p>
                              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{notification.time}</p>
                            </div>

                            {/* Close Button */}
                            <button
                              onClick={() => removeNotification(notification.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded"
                            >
                              <X size={14} />
                            </button>
                          </div>

                          {/* Unread Indicator */}
                          {!notification.read && (
                            <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-[hsl(var(--primary))] rounded-full" />
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="px-4 py-3 border-t border-white/10 text-center">
                  <button className="text-xs text-[hsl(var(--primary))] hover:underline">
                    View all notifications
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
