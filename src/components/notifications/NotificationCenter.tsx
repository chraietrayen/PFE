/**
 * NotificationCenter Component
 * Advanced notification dropdown with real-time updates and role-based filtering
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { useRealTimeNotifications, Notification } from "@/hooks/useNotifications";
import { FiBell, FiCheck, FiCheckCircle, FiTrash2, FiExternalLink, FiRefreshCw, FiWifi, FiWifiOff } from "react-icons/fi";

interface NotificationCenterProps {
  className?: string;
}

export default function NotificationCenter({ className = "" }: NotificationCenterProps) {
  const {
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  } = useRealTimeNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
      case 'HIGH':
        return 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'NORMAL':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'LOW':
        return 'border-l-gray-400 bg-gray-50 dark:bg-gray-800';
      default:
        return 'border-l-gray-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PROFILE_APPROVED':
        return '✅';
      case 'PROFILE_REJECTED':
        return '❌';
      case 'PROFILE_SUBMITTED':
        return '📄';
      case 'POINTAGE_ANOMALY':
        return '⚠️';
      case 'POINTAGE_SUCCESS':
        return '✓';
      case 'LEAVE_REQUEST':
        return '🏖️';
      case 'SYSTEM_ALERT':
        return '🔔';
      case 'RH_ACTION_REQUIRED':
        return '👤';
      case 'DOCUMENT_REQUIRED':
        return '📁';
      default:
        return '📬';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Notifications"
      >
        <FiBell className="w-6 h-6 text-gray-600 dark:text-gray-300" />
        
        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 flex items-center justify-center px-1.5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* Connection indicator */}
        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-800 ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Notifications
                </h3>
                {isConnected ? (
                  <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <FiWifi className="w-3 h-3" />
                    En direct
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                    <FiWifiOff className="w-3 h-3" />
                    Déconnecté
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => refresh()}
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  title="Rafraîchir"
                >
                  <FiRefreshCw className={`w-4 h-4 text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead()}
                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                  >
                    Tout marquer comme lu
                  </button>
                )}
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Toutes ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  filter === 'unread'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Non lues ({unreadCount})
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[400px] overflow-y-auto">
            {isLoading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full" />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                <FiBell className="w-12 h-12 mb-3 opacity-30" />
                <p className="font-medium">Aucune notification</p>
                <p className="text-sm">
                  {filter === 'unread' ? 'Toutes les notifications sont lues' : 'Vous êtes à jour !'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                    getPriorityColor={getPriorityColor}
                    getTypeIcon={getTypeIcon}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
              <a
                href="/notifications"
                className="flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                Voir toutes les notifications
                <FiExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="px-4 py-2 bg-red-50 dark:bg-red-900/30 border-t border-red-200 dark:border-red-800">
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Individual notification item
 */
function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  getPriorityColor,
  getTypeIcon,
  formatDate,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  getPriorityColor: (priority: string) => string;
  getTypeIcon: (type: string) => string;
  formatDate: (date: string) => string;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`relative px-4 py-3 border-l-4 transition-colors cursor-pointer ${getPriorityColor(notification.priority)} ${
        !notification.isRead ? 'bg-opacity-100' : 'bg-opacity-50'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        if (!notification.isRead) {
          onMarkAsRead(notification.id);
        }
        // Navigate to link if available
        if (notification.metadata?.link) {
          window.location.href = notification.metadata.link;
        }
      }}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center text-lg">
          {getTypeIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`font-medium text-sm truncate ${
              !notification.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'
            }`}>
              {notification.title}
            </p>
            <span className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400">
              {formatDate(notification.createdAt)}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
            {notification.message}
          </p>
          
          {/* Priority badge for urgent/high */}
          {['URGENT', 'HIGH'].includes(notification.priority) && (
            <span className={`inline-block mt-1.5 px-2 py-0.5 text-xs font-medium rounded-full ${
              notification.priority === 'URGENT'
                ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                : 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300'
            }`}>
              {notification.priority === 'URGENT' ? 'Urgent' : 'Important'}
            </span>
          )}
        </div>

        {/* Unread indicator */}
        {!notification.isRead && (
          <div className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-blue-500 mt-2" />
        )}
      </div>

      {/* Action buttons on hover */}
      {isHovered && (
        <div className="absolute right-2 top-2 flex gap-1 bg-white dark:bg-gray-700 rounded-lg shadow-lg p-1">
          {!notification.isRead && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead(notification.id);
              }}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
              title="Marquer comme lu"
            >
              <FiCheck className="w-4 h-4 text-green-600" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(notification.id);
            }}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
            title="Supprimer"
          >
            <FiTrash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>
      )}
    </div>
  );
}
