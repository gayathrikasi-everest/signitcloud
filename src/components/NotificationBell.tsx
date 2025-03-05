import React, { useState, useRef, useEffect } from 'react';
import { Bell, Download, FileText, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDocuStore } from '@/lib/docuStore';
import { Notification } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
const NotificationBell: React.FC = () => {
  const {
    notifications,
    markNotificationAsRead,
    getUnreadCount
  } = useDocuStore();
  const [isOpen, setIsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const unreadCount = getUnreadCount();
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  const toggleNotifications = () => {
    setIsOpen(!isOpen);
  };
  const handleNotificationClick = (notification: Notification) => {
    markNotificationAsRead(notification.id);
  };
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) {
      return `${diffInSeconds} sec ago`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)} min ago`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)} hr ago`;
    } else {
      return `${Math.floor(diffInSeconds / 86400)} days ago`;
    }
  };
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'info':
        return <FileText className="h-4 w-4 text-primary" />;
      default:
        return <FileText className="h-4 w-4 text-primary" />;
    }
  };
  return <div className="relative" ref={notificationRef}>
      <Button variant="ghost" size="icon" onClick={toggleNotifications} className="relative bg-white">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-primary">
            {unreadCount}
          </Badge>}
      </Button>
      
      <AnimatePresence>
        {isOpen && <motion.div initial={{
        opacity: 0,
        y: 10,
        scale: 0.95
      }} animate={{
        opacity: 1,
        y: 0,
        scale: 1
      }} exit={{
        opacity: 0,
        y: 10,
        scale: 0.95
      }} transition={{
        duration: 0.2
      }} className="absolute right-0 mt-2 w-80 bg-card rounded-lg shadow-elegant-lg overflow-hidden z-50 border border-border">
            <div className="p-4 border-b border-border">
              <h3 className="font-medium">Notifications</h3>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? <div className="p-6 text-center text-muted-foreground">
                  <p>No notifications yet</p>
                </div> : <div>
                  {notifications.map(notification => <div key={notification.id} className={`
                        p-4 border-b border-border last:border-b-0 cursor-pointer
                        transition-colors hover:bg-muted/30
                        ${!notification.read ? 'bg-primary/5' : ''}
                      `} onClick={() => handleNotificationClick(notification)}>
                      <div className="flex items-start">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-3 shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm leading-tight ${!notification.read ? 'font-medium' : ''}`}>
                            {notification.message}
                          </p>
                          
                          {notification.documentId && notification.type === 'success' && <Button variant="link" size="sm" className="p-0 h-auto text-xs text-primary" onClick={e => {
                    e.stopPropagation();
                    // Logic to download file
                  }}>
                              <Download className="h-3 w-3 mr-1" />
                              Download document
                            </Button>}
                          
                          <p className="text-xs text-muted-foreground mt-1">
                            {getTimeAgo(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>)}
                </div>}
            </div>
          </motion.div>}
      </AnimatePresence>
    </div>;
};
export default NotificationBell;