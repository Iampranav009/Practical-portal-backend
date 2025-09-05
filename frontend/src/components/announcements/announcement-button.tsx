"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Megaphone } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useSocket } from '@/contexts/socket-context'
import { getApiBaseUrl } from '@/utils/api'

/**
 * Announcement Button Component
 * Shows announcement button with unread count badge
 * Updates in real-time when new announcements are created
 */

interface AnnouncementButtonProps {
  batchId: string
  onClick: () => void
  className?: string
}

export function AnnouncementButton({ batchId, onClick, className }: AnnouncementButtonProps) {
  const { user } = useAuth()
  const { socket } = useSocket()
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  // Only show unread count for students
  const isStudent = user?.role === 'student'

  // Fetch unread count when component mounts
  useEffect(() => {
    if (isStudent && batchId) {
      fetchUnreadCount()
    }
  }, [isStudent, batchId])

  // Listen for real-time announcement updates
  useEffect(() => {
    if (!socket || !isStudent) return

    const handleAnnouncementCreated = () => {
      // Increment unread count when new announcement is created
      setUnreadCount(prev => prev + 1)
    }

    socket.on('announcementCreated', handleAnnouncementCreated)

    return () => {
      socket.off('announcementCreated', handleAnnouncementCreated)
    }
  }, [socket, isStudent])

  /**
   * Fetch unread announcement count
   */
  const fetchUnreadCount = async () => {
    if (!user || !isStudent) return

    try {
      setLoading(true)
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
    } finally {
      setLoading(false)
    }
  }

  /**
   * Reset unread count when button is clicked
   */
  const handleClick = () => {
    if (isStudent) {
      setUnreadCount(0)
    }
    onClick()
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        className={`flex items-center gap-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all duration-200 group ${className}`}
      >
        <Megaphone className="h-4 w-4 group-hover:text-blue-600 transition-colors duration-200" />
        Announcements
        {loading && (
          <div className="h-3 w-3 border border-blue-600 border-t-transparent rounded-full animate-spin" />
        )}
      </Button>
      
      {/* Unread count badge for students */}
      {isStudent && unreadCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </div>
  )
}
