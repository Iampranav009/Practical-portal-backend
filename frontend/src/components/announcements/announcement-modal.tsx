"use client"

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useSocket } from '@/contexts/socket-context'
import { getApiBaseUrl } from '@/utils/api'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ChatInput, ChatInputTextArea, ChatInputSubmit } from '@/components/ui/chat-input'
import { EmojiPicker } from '@/components/announcements/emoji-picker'
import { Loader2, User, Clock, Trash2, MoreVertical, Smile, RefreshCw, Copy, X } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

interface Announcement {
  announcement_id: number
  message: string
  created_at: string
  teacher_name: string
}

interface AnnouncementModalProps {
  isOpen: boolean
  onClose: () => void
  batchId: string
}

export function AnnouncementModal({ isOpen, onClose, batchId }: AnnouncementModalProps) {
  const { user } = useAuth()
  const { socket } = useSocket()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [selectedMessage, setSelectedMessage] = useState<number | null>(null)
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 })

  // Fetch announcements when modal opens
  useEffect(() => {
    if (isOpen && batchId) {
      fetchAnnouncements()
    }
  }, [isOpen, batchId])

  // Auto-scroll to bottom when announcements change
  useEffect(() => {
    if (scrollAreaRef.current && announcements.length > 0) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }, [announcements])

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectedMessage) {
        const target = event.target as Element
        // Don't close if clicking on the popup itself
        if (!target.closest('[data-popup="message-popup"]')) {
          setSelectedMessage(null)
        }
      }
    }

    if (selectedMessage) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [selectedMessage])

      // Listen for real-time announcement updates
  useEffect(() => {
    if (!socket) return

    const handleAnnouncementCreated = (data: { announcement: Announcement }) => {
      console.log('📢 New announcement received:', data.announcement)
      setAnnouncements(prev => [...prev, data.announcement])
    }

    socket.on('announcementCreated', handleAnnouncementCreated)

    return () => {
      socket.off('announcementCreated', handleAnnouncementCreated)
    }
  }, [socket])

  /**
   * Fetch all announcements for the batch
   */
  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(`${getApiBaseUrl()}/announcements/batch/${batchId}`, {
        headers: {
          'Authorization': `Bearer ${user?.jwtToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAnnouncements(data.data || [])
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to load announcements')
      }
    } catch (error) {
      console.error('Error fetching announcements:', error)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Refresh announcements
   */
  const handleRefresh = async () => {
    await fetchAnnouncements()
  }

  /**
   * Send new announcement (Teacher only)
   */
  const handleSendAnnouncement = async () => {
    if (!newMessage.trim()) return

    try {
      setSending(true)
      setError('')

      const response = await fetch(`${getApiBaseUrl()}/announcements`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.jwtToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          batch_id: parseInt(batchId),
          message: newMessage.trim()
        })
      })

      if (response.ok) {
        setNewMessage('')
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to send announcement')
      }
    } catch (error) {
      console.error('Error sending announcement:', error)
      setError('Network error. Please try again.')
    } finally {
      setSending(false)
    }
  }


  /**
   * Delete announcement (Teacher only)
   */
  const handleDeleteAnnouncement = async (announcementId: number) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/announcements/${announcementId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user?.jwtToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        setAnnouncements(prev => 
          prev.filter(announcement => announcement.announcement_id !== announcementId)
        )
      }
    } catch (error) {
      console.error('Error deleting announcement:', error)
    }
  }

  /**
   * Handle emoji selection
   */
  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji)
  }

  /**
   * Handle double-click on message
   */
  const handleMessageDoubleClick = (announcementId: number, event: React.MouseEvent) => {
    event.preventDefault()
    const rect = event.currentTarget.getBoundingClientRect()
    setSelectedMessage(announcementId)
    setPopupPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    })
  }

  /**
   * Copy message to clipboard
   */
  const handleCopyMessage = async (message: string) => {
    try {
      console.log('Copying message:', message)
      await navigator.clipboard.writeText(message)
      console.log('Message copied successfully')
      setSelectedMessage(null)
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy message:', error)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = message
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setSelectedMessage(null)
    }
  }

  /**
   * Close popup
   */
  const closePopup = () => {
    setSelectedMessage(null)
  }

  /**
   * Format timestamp to relative time
   */
  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  /**
   * Format timestamp to exact time
   */
  const formatExactTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })
  }

  const isTeacher = user?.role === 'teacher'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b bg-gradient-to-r from-blue-50 to-purple-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3 text-xl font-semibold">
              <div className="p-2 bg-blue-100 rounded-xl">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              Batch Announcements
            </DialogTitle>
            <DialogDescription className="sr-only">
              {isTeacher ? 'Create and manage announcements for your batch' : 'View announcements from your teachers'}
            </DialogDescription>
            <Button
              onClick={handleRefresh}
              variant="ghost"
              size="sm"
              disabled={loading}
              className="h-8 px-3 text-xs"
            >
              <RefreshCw className={`w-3 h-3 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Error Message */}
          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex-shrink-0">
              {error}
            </div>
          )}

          {/* Scrollable Announcements Area */}
          <div className="flex-1 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : announcements.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <div className="p-4 bg-gray-100 rounded-full mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-sm font-medium">No announcements yet</p>
                {isTeacher && (
                  <p className="text-xs text-gray-400 mt-1">Be the first to send one!</p>
                )}
              </div>
            ) : (
              <ScrollArea ref={scrollAreaRef} className="h-full">
                <div className="p-4 pb-20 space-y-2">
                  {announcements.map((announcement) => {
                    // Check if this is the current teacher's own announcement
                    const isOwnMessage = isTeacher && announcement.teacher_name === user?.displayName
                    
                    return (
                      <div
                        key={announcement.announcement_id}
                        className={`group flex gap-3 px-4 py-2 transition-all duration-200 ${
                          isOwnMessage ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {/* WhatsApp-style layout */}
                        <div className={`flex gap-3 max-w-[80%] ${
                          isOwnMessage ? 'flex-row-reverse' : 'flex-row'
                        }`}>
                          {/* Avatar - show for all messages except own */}
                          {!isOwnMessage && (
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                {announcement.teacher_name.charAt(0).toUpperCase()}
                              </div>
                            </div>
                          )}
                          
                          <div className="flex-1 min-w-0">
                            {/* Teacher name - show for all messages except own */}
                            {!isOwnMessage && (
                              <div className="mb-1">
                                <span className="text-sm font-semibold text-gray-700">
                                  {announcement.teacher_name}
                                </span>
                              </div>
                            )}
                            
                            {/* Message bubble - more rounded corners */}
                            <div 
                              className={`relative rounded-3xl px-4 py-3 cursor-pointer hover:opacity-90 transition-opacity ${
                                isOwnMessage 
                                  ? 'bg-blue-500 text-white rounded-br-lg' 
                                  : 'bg-gray-100 text-gray-800 rounded-bl-lg'
                              }`}
                              onDoubleClick={(e) => handleMessageDoubleClick(announcement.announcement_id, e)}
                            >
                              <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                                {announcement.message}
                              </p>
                            </div>
                            
                            {/* Timestamp with exact time on hover */}
                            <div className={`mt-1 text-xs text-gray-500 ${
                              isOwnMessage ? 'text-right' : 'text-left'
                            }`}>
                              <span 
                                className="flex items-center gap-1 group"
                                title={formatExactTime(announcement.created_at)}
                              >
                                <Clock className="w-3 h-3" />
                                {formatTimeAgo(announcement.created_at)}
                              </span>
                            </div>
                            
                            {/* Delete button for own messages (teachers only) */}
                            {isTeacher && isOwnMessage && (
                              <div className="mt-2 text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600">
                                      <MoreVertical className="w-3 h-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem 
                                      onClick={() => handleDeleteAnnouncement(announcement.announcement_id)}
                                      className="text-red-600 focus:text-red-600"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Teacher Input Section - Fixed at Bottom */}
          {isTeacher && (
            <div className="p-6 border-t bg-gray-50/50 flex-shrink-0">
              <div className="relative">
                <ChatInput
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onSubmit={handleSendAnnouncement}
                  loading={sending}
                  onStop={() => setSending(false)}
                  className="bg-white border-2 border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200"
                >
                  <div className="flex items-end gap-2 w-full">
                    <div className="flex-1">
                      <ChatInputTextArea 
                        placeholder="Type your announcement message here..."
                        className="min-h-[60px] max-h-[120px] resize-none"
                        rows={2}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <EmojiPicker onEmojiSelect={handleEmojiSelect} />
                      <ChatInputSubmit />
                    </div>
                  </div>
                </ChatInput>
              </div>
              
              <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                <span>
                  {newMessage.length}/1000 characters
                </span>
                <span>Press Enter to send, Shift+Enter for new line</span>
              </div>
            </div>
          )}
        </div>

        {/* Double-click popup */}
        {selectedMessage && (
          <div 
            data-popup="message-popup"
            className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex gap-1"
            // eslint-disable-next-line react/forbid-dom-props
            style={{
              left: `${popupPosition.x - 60}px`,
              top: `${popupPosition.y - 50}px`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                const message = announcements.find(a => a.announcement_id === selectedMessage)
                if (message) {
                  handleCopyMessage(message.message)
                }
              }}
              className="h-8 px-3 text-xs hover:bg-gray-100"
            >
              <Copy className="w-3 h-3 mr-1" />
              Copy
            </Button>
            
            {isTeacher && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteAnnouncement(selectedMessage)
                  closePopup()
                }}
                className="h-8 px-3 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Delete
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}