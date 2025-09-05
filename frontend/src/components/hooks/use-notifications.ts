"use client"

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useSocket } from '@/contexts/socket-context';
import { Notification } from '@/components/ui/notifications-menu';
import { getApiBaseUrl } from '@/utils/api';

/**
 * Custom hook for managing teacher notifications
 * Handles fetching, real-time updates, and notification actions
 */
export function useNotifications() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch notifications from API
   */
  const fetchNotifications = useCallback(async () => {
    if (!user || user.role !== 'teacher') return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${getApiBaseUrl()}/notifications/teacher/${user.userId}`, {
        headers: {
          'Authorization': `Bearer ${user.jwtToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data || []);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch notifications');
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback(async (notificationId: number) => {
    if (!user) return;

    try {
      const response = await fetch(`${getApiBaseUrl()}/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.jwtToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, isRead: true }
              : notification
          )
        );
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, [user]);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch(`${getApiBaseUrl()}/notifications/teacher/${user.userId}/mark-all-read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.jwtToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, isRead: true }))
        );
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, [user]);

  /**
   * Delete all notifications
   */
  const deleteAllNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch(`${getApiBaseUrl()}/notifications/teacher/${user.userId}/delete-all`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.jwtToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Clear all notifications from local state
        setNotifications([]);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to delete all notifications');
      }
    } catch (err) {
      console.error('Error deleting all notifications:', err);
      setError('Failed to delete all notifications');
    }
  }, [user]);

  /**
   * Handle notification click - navigate to relevant page
   */
  const handleNotificationClick = useCallback((notification: Notification) => {
    // Mark as read when clicked
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.type === 'submission' && notification.submission_id) {
      // Navigate to submission review page
      window.location.href = `/teachers/batch/${notification.batch_id}?submission=${notification.submission_id}`;
    } else if (notification.type === 'announcement' && notification.batch_id) {
      // Navigate to batch announcements
      window.location.href = `/teachers/batch/${notification.batch_id}`;
    } else if (notification.type === 'batch_join' && notification.batch_id) {
      // Navigate to batch management
      window.location.href = `/teachers/batch/${notification.batch_id}`;
    }
  }, [markAsRead]);

  /**
   * Handle real-time notification updates
   */
  const handleNewNotification = useCallback((newNotification: Notification) => {
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  /**
   * Handle notification updates
   */
  const handleNotificationUpdate = useCallback((updatedNotification: Notification) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === updatedNotification.id 
          ? updatedNotification 
          : notification
      )
    );
  }, []);

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Set up socket listeners for real-time updates
  useEffect(() => {
    if (!socket || !user || user.role !== 'teacher') return;

    // Listen for new notifications
    socket.on('new_notification', handleNewNotification);
    
    // Listen for notification updates
    socket.on('notification_update', handleNotificationUpdate);

    // Join teacher notification room
    socket.emit('join_teacher_notifications', user.userId);

    return () => {
      socket.off('new_notification', handleNewNotification);
      socket.off('notification_update', handleNotificationUpdate);
      socket.emit('leave_teacher_notifications', user.userId);
    };
  }, [socket, user, handleNewNotification, handleNotificationUpdate]);

  return {
    notifications,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteAllNotifications,
    handleNotificationClick,
    unreadCount: notifications.filter(n => !n.isRead).length
  };
}
