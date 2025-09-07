"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefinedBatchFeed } from '@/components/submissions/refined-batch-feed'

// Import PostData type from the refined batch feed
interface PostData {
  id: string
  author: {
    name: string
    username: string
    avatar: string
    rollNumber?: string
    year?: string
    subject?: string
  }
  content: {
    type: 'text' | 'image' | 'code'
    data: string
    language?: string
  }
  timestamp: string
  engagement: {
    likes: number
    shares: number
  }
  status: 'pending' | 'accepted' | 'rejected'
  practical_name: string
  file_url?: string
  code_sandbox_link?: string
}
import { BatchInfoModal } from '@/components/batches/batch-info-modal'
import { BatchRightPanel } from '@/components/batches/batch-right-panel'
import { NewPostModal } from '@/components/submissions/new-post-modal'
import { EditPostModal } from '@/components/submissions/edit-post-modal'
import { AnnouncementModal } from '@/components/announcements/announcement-modal'
import { AnnouncementButton } from '@/components/announcements/announcement-button'
import { ModernSidebar } from '@/components/ui/modern-side-bar'
import { Users, School, ArrowLeft, Plus, Info } from 'lucide-react'
import { getApiBaseUrl } from '@/utils/api'
import { recordBatchView } from '@/components/hooks/use-student-batches'

/**
 * Batch Details Page
 * Shows batch information and member list
 * Accessible by batch teachers and enrolled students
 */

interface BatchMember {
  user_id: number
  name: string
  email: string
  role: 'student' | 'teacher'
  joined_at: string
  profile_picture_url?: string
}

interface BatchDetails {
  batch_id: number
  name: string
  college_name: string
  description: string
  icon_image: string
  cover_image: string
  created_at: string
  teacher_name: string
  teacher_email: string
  members: BatchMember[]
  member_count: number
}

interface BatchStats {
  enrolledStudents: number
  totalSubmissions: number
  pendingSubmissions: number
  acceptedSubmissions: number
  rejectedSubmissions: number
}

export default function BatchDetailsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const batchId = params.batch_id as string

  // State management
  const [batch, setBatch] = useState<BatchDetails | null>(null)
  const [loadingBatch, setLoadingBatch] = useState(true)
  const [error, setError] = useState('')
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [stats, setStats] = useState<BatchStats>({
    enrolledStudents: 0,
    totalSubmissions: 0,
    pendingSubmissions: 0,
    acceptedSubmissions: 0,
    rejectedSubmissions: 0
  })

  // Modal states
  const [showBatchInfoModal, setShowBatchInfoModal] = useState(false)
  const [showNewPostModal, setShowNewPostModal] = useState(false)
  const [showEditPostModal, setShowEditPostModal] = useState(false)
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false)
  const [editingPost, setEditingPost] = useState<PostData | null>(null)

  /**
   * Fetch batch details and members
   */
  const fetchBatchDetails = useCallback(async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/batches/${batchId}`, {
        headers: {
          'Authorization': `Bearer ${user?.jwtToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setBatch({
          ...data.data,
          teacher_email: data.data.teacher_email || data.data.teacher?.email || '',
          member_count: data.data.members?.length || 0
        })
      } else if (response.status === 403) {
        setError('You do not have access to this batch')
      } else if (response.status === 404) {
        setError('Batch not found')
      } else {
        setError('Failed to load batch details')
      }
    } catch (error) {
      console.error('Error fetching batch details:', error)
      setError('Network error. Please try again.')
    } finally {
      setLoadingBatch(false)
    }
  }, [user, batchId])

  /**
   * Generate and copy join link (teacher only)
   */
  const copyJoinLink = async () => {
    const link = `${window.location.origin}/join-batch/${batchId}`
    try {
      await navigator.clipboard.writeText(link)
      alert('Join link copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy link:', error)
      alert('Failed to copy link')
    }
  }

  /**
   * Navigate back to appropriate dashboard
   */
  const handleBackNavigation = () => {
    if (user?.role === 'teacher') {
      router.push('/teachers/dashboard')
    } else {
      router.push('/students/profile')
    }
  }

  /**
   * Fetch batch statistics
   */
  const fetchBatchStats = useCallback(async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/submissions/batch/${batchId}/stats`, {
        headers: {
          'Authorization': `Bearer ${user?.jwtToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('📊 [BatchStats] Raw API response:', data)
        setStats({
          enrolledStudents: data.data.enrolledStudents || batch?.member_count || 0,
          totalSubmissions: data.data.totalSubmissions || 0,
          pendingSubmissions: data.data.pendingSubmissions || 0,
          acceptedSubmissions: data.data.acceptedSubmissions || 0,
          rejectedSubmissions: data.data.rejectedSubmissions || 0
        })
      }
    } catch (error) {
      console.error('Error fetching batch stats:', error)
      // Set basic stats from batch data if API fails
      setStats({
        enrolledStudents: batch?.member_count || 0,
        totalSubmissions: 0,
        pendingSubmissions: 0,
        acceptedSubmissions: 0,
        rejectedSubmissions: 0
      })
    }
  }, [user, batchId, batch])

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
      return
    }
  }, [user, loading, router])

  // Listen for sidebar collapse state changes
  useEffect(() => {
    const handleSidebarToggle = (event: CustomEvent) => {
      setIsCollapsed(event.detail.isCollapsed);
    };

    // Listen for custom events from ModernSidebar
    window.addEventListener('sidebar-toggle', handleSidebarToggle as EventListener);
    
    return () => {
      window.removeEventListener('sidebar-toggle', handleSidebarToggle as EventListener);
    };
  }, []);

  // Fetch batch details when component mounts
  useEffect(() => {
    if (user && batchId) {
      fetchBatchDetails()
    }
  }, [user, batchId, fetchBatchDetails])

  // Fetch stats when batch data is loaded
  useEffect(() => {
    if (batch) {
      fetchBatchStats()
      
      // Record batch view for students (for sidebar ordering)
      if (user?.role === 'student' && batchId) {
        recordBatchView(parseInt(batchId as string))
      }
    }
  }, [batch, user, batchId, fetchBatchStats])

  /**
   * Handle new submission created - refresh the feed
   */
  const handleSubmissionCreated = () => {
    setRefreshTrigger(prev => prev + 1)
    // Refresh stats when new submission is created
    fetchBatchStats()
  }

  /**
   * Handler functions for header actions
   */
  const handleEdit = () => {
    router.push(`/teachers/manage-batch/${batchId}`)
  }

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete the batch "${batch?.name}"? This action cannot be undone.`)) {
      try {
        const response = await fetch(`${getApiBaseUrl()}/batches/${batchId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${user?.jwtToken}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          router.push('/teachers/my-batches')
        } else {
          alert('Failed to delete batch')
        }
      } catch (error) {
        console.error('Error deleting batch:', error)
        alert('Network error while deleting batch')
      }
    }
  }

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/join-batch/${batchId}`
    navigator.clipboard.writeText(shareUrl)
    alert('Batch URL copied to clipboard!')
  }

  const handlePasswordEdit = () => {
    router.push(`/teachers/manage-batch/${batchId}/password`)
  }

  /**
   * Handle edit post functionality
   */
  const handleEditPost = (post: string | PostData) => {
    // Set the post data for editing
    if (typeof post === 'string') {
      // If we only have an ID, we can't edit without full post data
      console.warn('Cannot edit post with only ID, need full post data')
      return
    }
    setEditingPost(post)
    setShowEditPostModal(true)
  }

  // Show content immediately - no loading delay
  // if (loading || loadingBatch) {
  //   return (
  //     <div className="min-h-screen bg-background flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
  //         <p className="mt-4 text-muted-foreground">Loading batch details...</p>
  //       </div>
  //     </div>
  //   )
  // }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <div className="text-red-500 mb-4">
              <Users className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">Access Denied</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={handleBackNavigation}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main render
  if (!batch) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Batch not found</p>
      </div>
    )
  }

  const isTeacher = user?.role === 'teacher'
  const studentMembers = batch.members.filter(member => member.role === 'student')

  return (
    <div className="no-page-scroll bg-background flex">
      {/* Fixed Sidebar */}
      <div className="fixed left-0 top-0 h-full z-40">
        <ModernSidebar />
      </div>
      
      {/* Main Content Area - Adjusts margin based on sidebar state */}
      <div className={`flex-1 ml-0 ${isCollapsed ? 'md:ml-20' : 'md:ml-72'} h-full flex flex-col transition-all duration-300`}>
        {/* Fixed Top Navigation Bar */}
        <div className="flex-shrink-0 bg-white border-b border-border px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackNavigation}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              
              {/* Batch Profile Icon - positioned between Back button and batch name */}
              <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center">
                {batch.icon_image ? (
                  <img
                    src={batch.icon_image}
                    alt={`${batch.name} icon`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <School className="h-5 w-5 text-blue-600" />
                )}
              </div>
              
              <div>
                <h1 className="text-lg font-semibold text-foreground">{batch.name}</h1>
                <p className="text-xs text-muted-foreground">{batch.college_name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">

              {/* New Post Button for Students */}
              {user?.role === 'student' && (
                <Button
                  onClick={() => setShowNewPostModal(true)}
                  size="sm"
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" />
                  New Post
                </Button>
              )}
              
              {/* Announcements Button */}
              <AnnouncementButton
                batchId={batchId}
                onClick={() => setShowAnnouncementModal(true)}
              />
              
              {/* Batch Info Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBatchInfoModal(true)}
                className="flex items-center gap-2 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 transition-all duration-200 group"
              >
                <Info className="h-4 w-4 group-hover:text-purple-600 transition-colors duration-200" />
                More Info
              </Button>
            </div>
          </div>
        </div>

        {/* Responsive Layout - Mobile First */}
        <div className="flex flex-1 overflow-hidden">
          {/* Main Content - Only this part scrolls */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 min-w-0">
            <div className="max-w-full lg:max-w-2xl xl:max-w-3xl mx-auto">
              <RefinedBatchFeed 
                batchId={batchId} 
                refreshTrigger={refreshTrigger}
                onEditPost={handleEditPost}
              />
            </div>
          </div>

          {/* Right Column - Fixed Sidebar - Hidden on Mobile and Tablet */}
          <div className="hidden xl:block w-80 flex-shrink-0 bg-background border-l border-border p-3">
            <BatchRightPanel 
              batch={batch}
              stats={stats}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <BatchInfoModal
        isOpen={showBatchInfoModal}
        onClose={() => setShowBatchInfoModal(false)}
        batch={batch}
      />

      <NewPostModal
        isOpen={showNewPostModal}
        onClose={() => setShowNewPostModal(false)}
        batchId={batchId}
        onPostCreated={handleSubmissionCreated}
      />

      <EditPostModal
        isOpen={showEditPostModal}
        onClose={() => {
          setShowEditPostModal(false)
          setEditingPost(null)
        }}
        post={editingPost!}
        batchId={batchId}
        onPostUpdated={handleSubmissionCreated}
      />

      <AnnouncementModal
        isOpen={showAnnouncementModal}
        onClose={() => setShowAnnouncementModal(false)}
        batchId={batchId}
      />
    </div>
  )
}
