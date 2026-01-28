/**
 * Real-Time Notifications Hook
 * Provides real-time notification updates via SSE with role-based filtering
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  isRead: boolean;
  createdAt: string;
  metadata?: {
    targetRole?: string;
    link?: string;
    [key: string]: any;
  };
}

export interface UseNotificationsResult {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useRealTimeNotifications(): UseNotificationsResult {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const userRole = (session?.user as any)?.role || 'USER';

  /**
   * Fetch initial notifications
   */
  const fetchNotifications = useCallback(async () => {
    if (!session?.user) return;

    try {
      setIsLoading(true);
      const response = await fetch('/api/notifications');
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      setError(null);
    } catch (err: any) {
      console.error('❌ Error fetching notifications:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  /**
   * Connect to SSE for real-time updates
   */
  const connectSSE = useCallback(() => {
    if (!session?.user || eventSourceRef.current) return;

    try {
      const eventSource = new EventSource('/api/notifications/realtime');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('✅ SSE connected');
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'notification') {
            const newNotification = data.notification;
            
            // Check if notification is for user's role
            const targetRole = newNotification.metadata?.targetRole || 'USER';
            const shouldShow = 
              userRole === 'SUPER_ADMIN' ||
              targetRole === userRole ||
              (userRole === 'RH' && ['RH', 'USER'].includes(targetRole));

            if (shouldShow) {
              setNotifications(prev => [newNotification, ...prev]);
              setUnreadCount(prev => prev + 1);

              // Play notification sound for high priority
              if (['HIGH', 'URGENT'].includes(newNotification.priority)) {
                playNotificationSound();
              }

              // Show browser notification if permitted
              if (Notification.permission === 'granted') {
                new Notification(newNotification.title, {
                  body: newNotification.message,
                  icon: '/favicon.ico',
                  tag: newNotification.id,
                });
              }
            }
          }

          if (data.type === 'system') {
            console.log('📢 System event:', data.event);
          }
        } catch (err) {
          console.error('Error parsing SSE message:', err);
        }
      };

      eventSource.onerror = (err) => {
        console.error('❌ SSE error:', err);
        setIsConnected(false);
        eventSource.close();
        eventSourceRef.current = null;

        // Attempt reconnection with exponential backoff
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectAttempts.current++;
          
          console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connectSSE();
          }, delay);
        } else {
          setError('Connection lost. Please refresh the page.');
        }
      };
    } catch (err) {
      console.error('Failed to create EventSource:', err);
      setIsConnected(false);
    }
  }, [session, userRole]);

  /**
   * Play notification sound
   */
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {}); // Ignore autoplay errors
    } catch {}
  };

  /**
   * Request browser notification permission
   */
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback(async (id: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, isRead: true }))
        );
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, []);

  /**
   * Delete notification
   */
  const deleteNotification = useCallback(async (id: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id));
        // Decrease unread count if the deleted notification was unread
        const wasUnread = notifications.find(n => n.id === id && !n.isRead);
        if (wasUnread) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  }, [notifications]);

  /**
   * Refresh notifications
   */
  const refresh = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);

  // Initialize on mount
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchNotifications();
      connectSSE();
      requestNotificationPermission();
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [status, session, fetchNotifications, connectSSE, requestNotificationPermission]);

  return {
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  };
}

/**
 * Hook for notification preferences
 */
export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState({
    email: true,
    push: true,
    sound: true,
    desktop: true,
  });

  const updatePreference = useCallback((key: keyof typeof preferences, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    // TODO: Save to backend
    localStorage.setItem('notificationPreferences', JSON.stringify({
      ...preferences,
      [key]: value
    }));
  }, [preferences]);

  useEffect(() => {
    const saved = localStorage.getItem('notificationPreferences');
    if (saved) {
      try {
        setPreferences(JSON.parse(saved));
      } catch {}
    }
  }, []);

  return { preferences, updatePreference };
}
