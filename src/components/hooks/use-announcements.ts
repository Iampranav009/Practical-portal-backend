"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { getApiBaseUrl } from '@/utils/api'

/**
 * Custom hook for managing announcement state and unread counts
 * Provides real-time updates and unread count tracking
 */

interface Announcement {
  announcement_id: number
  batch_id: number
  message: string
  created_at: string
  teacher_name: string
  teacher_email: string
  is_read?: boolean
  read_at?: string
}

interface UseAnnouncementsReturn {
  announcements: Announcement[]
  unreadCount: number
  loading: boolean
  error: string
  fetchAnnouncements: (batchId: string) => Promise<void>
  markAsRead: (announcementId: number) => Promise<void>
  fetchUnreadCount: (batchId: string) => Promise<void>
  refreshAnnouncements: () => void
}

export function useAnnouncements(): UseAnnouncementsReturn {
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  /**
   * Fetch announcements for a specific batch
   */
  const fetchAnnouncements = useCallback(async (batchId: string) => {
    if (!user || !batchId) return

    try {
      setLoading(true)
      setError('')

      const response = await fetch(`${getApiBaseUrl()}/announcements/batch/${batchId}`, {
        headers: {
          'Authorization': `Bearer ${user.jwtToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAnnouncements(data.data || [])
      } else {
        setError('Failed to load announcements')
      }
    } catch (error) {
      console.error('Error fetching announcements:', error)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [user])

  /**
   * Mark an announcement as read
   */
  const markAsRead = useCallback(async (announcementId: number) => {
    if (!user) return

    try {
      const response = await fetch(`${getApiBaseUrl()}/announcements/${announcementId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.jwtToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        // Update local state
        setAnnouncements(prev =>
          prev.map(announcement =>
            announcement.announcement_id === announcementId
              ? { ...announcement, is_read: true, read_at: new Date().toISOString() }
              : announcement
          )
        )
        
        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error: unknown) {
      console.error('Error marking announcement as read:', error)
    }
  }, [user])

  /**
   * Fetch unread count for a batch (students only)
   */
  const fetchUnreadCount = useCallback(async (batchId: string) => {
    if (!user || user.role !== 'student' || !batchId) return

    try {
      const response = await fetch(`${getApiBaseUrl()}/announcements/unread-count/${batchId}`, {
        headers: {
          'Authorization': `Bearer ${user.jwtToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.data.unread_count || 0)
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }, [user])

  /**
   * Refresh announcements (useful for real-time updates)
   */
  const refreshAnnouncements = useCallback(() => {
    // This will be called when new announcements are received via Socket.IO
    // The actual fetching will be handled by the component using this hook
  }, [])

  return {
    announcements,
    unreadCount,
    loading,
    error,
    fetchAnnouncements,
    markAsRead,
    fetchUnreadCount,
    refreshAnnouncements
  }
}
