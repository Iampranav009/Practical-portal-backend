"use client"

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter, useParams } from 'next/navigation'
import { SidebarLayout } from '@/components/layout/sidebar-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { BatchFeed } from '@/components/submissions/batch-feed'
import { AnnouncementModal } from '@/components/announcements/announcement-modal'
import { AnnouncementButton } from '@/components/announcements/announcement-button'
import { 
  Users, 
  FileText, 
  Share2, 
  Edit, 
  Trash2, 
  X,
  Upload,
  ArrowLeft,
  Calendar,
  School,
  Eye
} from 'lucide-react'
import { getApiBaseUrl } from '@/utils/api'

/**
 * Teacher Batch Management Page
 * Compact navigation bar + three-column layout
 * Route: /teachers/batch/[batch_id]
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
  teacher_id: string
  teacher_name: string
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

interface EditFormData {
  name: string
  collegeName: string
  description: string
  iconImage: string
  coverImage: string
}

export default function TeacherBatchPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const batchId = params.batch_id as string

  // State management
  const [batch, setBatch] = useState<BatchDetails | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [stats, setStats] = useState<BatchStats>({
    enrolledStudents: 0,
    totalSubmissions: 0,
    pendingSubmissions: 0,
    acceptedSubmissions: 0,
    rejectedSubmissions: 0
  })
  const [loadingBatch, setLoadingBatch] = useState(true)
  const [error, setError] = useState('')
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  // Edit modal states
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState<EditFormData>({
    name: '',
    collegeName: '',
    description: '',
    iconImage: '',
    coverImage: ''
  })
  const [selectedIconImage, setSelectedIconImage] = useState<File | null>(null)
  const [selectedCoverImage, setSelectedCoverImage] = useState<File | null>(null)
  const [iconImagePreview, setIconImagePreview] = useState('')
  const [coverImagePreview, setCoverImagePreview] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  
  // Announcement modal state
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false)

  // Redirect if not authenticated or not a teacher
  useEffect(() => {
    if (!loading && (!user || user.role !== 'teacher')) {
      router.push('/auth/login')
      return
    }
  }, [user, loading, router])

  // Fetch batch details when component mounts
  useEffect(() => {
    if (user && batchId) {
      fetchBatchDetails()
    }
  }, [user, batchId])

  // Fetch stats when batch data is loaded
  useEffect(() => {
    if (batch) {
      fetchBatchStats()
      // Check if current user owns this batch
      // Compare with user.userId (database ID) not user.uid (Firebase UID)
      setIsOwner(Number(batch.teacher_id) === user?.userId)
      // Initialize edit form with batch data
      setEditForm({
        name: batch.name,
        collegeName: batch.college_name,
        description: batch.description,
        iconImage: batch.icon_image || '',
        coverImage: batch.cover_image || ''
      })
    }
  }, [batch, user])

  /**
   * Fetch batch details and members
   */
  const fetchBatchDetails = async () => {
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
  }

  /**
   * Fetch batch statistics
   */
  const fetchBatchStats = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/submissions/batch/${batchId}/stats`, {
        headers: {
          'Authorization': `Bearer ${user?.jwtToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('📊 [TeacherBatchStats] Raw API response:', data)
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
      setStats({
        enrolledStudents: batch?.member_count || 0,
        totalSubmissions: 0,
        pendingSubmissions: 0,
        acceptedSubmissions: 0,
        rejectedSubmissions: 0
      })
    }
  }

  /**
   * Handle new submission created - refresh the feed
   */
  const handleSubmissionCreated = () => {
    setRefreshTrigger(prev => prev + 1)
    fetchBatchStats()
  }

  /**
   * Handle share batch
   */
  const handleShare = () => {
    const shareUrl = `${window.location.origin}/join-batch/${batchId}`
    navigator.clipboard.writeText(shareUrl)
    alert('Batch URL copied to clipboard!')
  }

  /**
   * Handle delete batch
   */
  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete the batch "${batch?.name}"? This action cannot be undone.`)) {
      try {
        const response = await fetch(`${getApiBaseUrl()}/batches/delete/${batchId}`, {
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

  /**
   * Handle icon image selection for edit
   */
  const handleIconImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file')
        return
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB')
        return
      }
      
      setSelectedIconImage(file)
      
      const reader = new FileReader()
      reader.onload = (e) => {
        setIconImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  /**
   * Handle cover image selection for edit
   */
  const handleCoverImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file')
        return
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB')
        return
      }
      
      setSelectedCoverImage(file)
      
      const reader = new FileReader()
      reader.onload = (e) => {
        setCoverImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  /**
   * Convert image to base64
   */
  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        if (result.length > 16 * 1024 * 1024) {
          reject(new Error('Image is too large. Please choose a smaller image.'))
          return
        }
        resolve(result)
      }
      reader.onerror = () => reject(new Error('Failed to read image file'))
      reader.readAsDataURL(file)
    })
  }

  /**
   * Handle edit form submission
   */
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)

    try {
      // Convert images to base64 if selected
      let iconImageData = editForm.iconImage
      let coverImageData = editForm.coverImage
      
      if (selectedIconImage) {
        iconImageData = await convertImageToBase64(selectedIconImage)
      }
      if (selectedCoverImage) {
        coverImageData = await convertImageToBase64(selectedCoverImage)
      }

      const response = await fetch(`${getApiBaseUrl()}/batches/edit/${batchId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user?.jwtToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editForm.name.trim(),
          collegeName: editForm.collegeName.trim(),
          description: editForm.description.trim(),
          iconImage: iconImageData,
          coverImage: coverImageData
        })
      })

      if (response.ok) {
        await fetchBatchDetails() // Refresh batch data
        setEditOpen(false)
        setSelectedIconImage(null)
        setSelectedCoverImage(null)
        setIconImagePreview('')
        setCoverImagePreview('')
      } else {
        const errorData = await response.json()
        alert(errorData.message || 'Failed to update batch')
      }
    } catch (error) {
      console.error('Error updating batch:', error)
      alert('Network error while updating batch')
    } finally {
      setIsUpdating(false)
    }
  }

  // Loading state
  if (loading || loadingBatch) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading batch details...</p>
        </div>
      </div>
    )
  }

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
            <Button onClick={() => router.push('/teachers/my-batches')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!batch) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Batch not found</p>
      </div>
    )
  }

  const studentMembers = batch.members.filter(member => member.role === 'student')

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-background overflow-x-hidden">
        {/* Owner/Viewer Notice */}
        {!isOwner && (
          <div className="info-banner border-b px-4 py-3">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span className="text-sm">
                  You are viewing <strong>{batch.teacher_name}&apos;s</strong> batch. You can see the content but cannot edit or delete it.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Compact Navigation Bar */}
        <div className="bg-card border-b border-border px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left side - Back button and batch info */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/teachers/my-batches')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            {/* Batch image and name */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center">
                {batch.icon_image ? (
                  <img
                    src={batch.icon_image}
                    alt={batch.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <School className="h-5 w-5 text-blue-600" />
                )}
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">{batch.name}</h1>
                <p className="text-sm text-muted-foreground">{batch.college_name}</p>
              </div>
            </div>
          </div>

          {/* Right side - Action buttons */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            
            {/* Announcements Button */}
            <AnnouncementButton
              batchId={batchId}
              onClick={() => setShowAnnouncementModal(true)}
            />
            
            {isOwner && (
              <>
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Batch</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleEditSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Batch Name
                    </label>
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      College Name
                    </label>
                    <Input
                      value={editForm.collegeName}
                      onChange={(e) => setEditForm(prev => ({ ...prev, collegeName: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Description
                    </label>
                    <Textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  
                  {/* Icon Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Batch Icon
                    </label>
                    {iconImagePreview ? (
                      <div className="relative inline-block">
                        <img
                          src={iconImagePreview}
                          alt="Icon Preview"
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2"
                          onClick={() => {
                            setSelectedIconImage(null)
                            setIconImagePreview('')
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-border rounded-lg p-3 text-center">
                        <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                        <label className="cursor-pointer">
                          <span className="text-blue-600 hover:text-blue-500 text-sm">Choose Icon</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleIconImageSelect}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Cover Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Batch Cover Image
                    </label>
                    {coverImagePreview ? (
                      <div className="relative">
                        <img
                          src={coverImagePreview}
                          alt="Cover Preview"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setSelectedCoverImage(null)
                            setCoverImagePreview('')
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <label className="cursor-pointer">
                          <span className="text-blue-600 hover:text-blue-500">Choose Cover Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleCoverImageSelect}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditOpen(false)}
                      className="hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 transition-all duration-200"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isUpdating}>
                      {isUpdating ? 'Updating...' : 'Update Batch'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
              </Dialog>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
          </div>
          </div>
        </div>

        {/* Three-column layout */}
      <div className="max-w-7xl mx-auto px-2 py-3">
        <div className="grid grid-cols-12 gap-4">
          {/* Left spacing to balance the right sidebar (reduced to give feed more width) */}
          <div className="hidden lg:block lg:col-span-1 xl:col-span-1"></div>
          
          {/* Middle - Teacher/Student Submission Feed (wider) */}
          <div className="col-span-12 lg:col-span-8 xl:col-span-9">
          <div className="max-h-[calc(100vh-170px)] overflow-y-auto pl-2 pr-3 md:pl-4 md:pr-6">
              <BatchFeed 
                batchId={batchId} 
                refreshTrigger={refreshTrigger}
              />
            </div>
          </div>

          {/* Right - Batch Stats and Members */}
          <div className="col-span-12 lg:col-span-3 xl:col-span-2 space-y-4">
            {/* Stats Card */}
            <Card className="text-xs card-lighter">
              <CardHeader className="pb-2 px-3 pt-3">
                <CardTitle className="text-sm font-medium">Stats</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <Users className="h-3 w-3 text-blue-600" />
                    <span className="text-xs text-muted-foreground">Enrolled</span>
                  </div>
                  <Badge variant="secondary" className="text-xs px-1 py-0 h-5">{stats.enrolledStudents}</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <FileText className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-muted-foreground">Submissions</span>
                  </div>
                  <Badge variant="secondary" className="text-xs px-1 py-0 h-5">{stats.totalSubmissions}</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3 text-orange-600" />
                    <span className="text-xs text-muted-foreground">Pending</span>
                  </div>
                  <Badge variant="outline" className="text-xs px-1 py-0 h-5">{stats.pendingSubmissions}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Compact Members List */}
            <Card className="text-xs card-lighter">
              <CardHeader className="pb-2 px-3 pt-3">
                <CardTitle className="text-sm font-medium">Members ({studentMembers.length})</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {studentMembers.map((member) => (
                    <div
                      key={member.user_id}
                      className="flex items-center space-x-2 p-1 rounded hover:bg-background"
                    >
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-medium">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">
                          {member.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {member.email.split('@')[0]}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {studentMembers.length === 0 && (
                    <div className="text-center py-3 text-muted-foreground">
                      <Users className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs">No students yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </div>
      
      {/* Announcement Modal */}
      <AnnouncementModal
        isOpen={showAnnouncementModal}
        onClose={() => setShowAnnouncementModal(false)}
        batchId={batchId}
      />
    </SidebarLayout>
  )
}
