"use client"

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { buildApiUrl } from '@/utils/api'
import { SidebarLayout } from '@/components/layout/sidebar-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BatchCard } from '@/components/batches/batch-card'
import { 
  Users, 
  Calendar, 
  Plus,
  Eye,
  School,
  BookOpen,
  Search,
  UserCheck
} from 'lucide-react'
import { Input } from '@/components/ui/input'

/**
 * Student My Batches Page
 * Lists all batches joined by the student with quick navigation
 * Includes search functionality and batch overview
 */

// Interface for joined batch data
interface JoinedBatch {
  batch_id: number
  name: string
  college_name: string
  description: string
  icon_image: string
  cover_image: string
  created_at: string
  teacher_name: string
  joined_at: string
  member_count: number // Added member count field from backend
}

export default function StudentMyBatchesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  
  // State management
  const [batches, setBatches] = useState<JoinedBatch[]>([])
  const [filteredBatches, setFilteredBatches] = useState<JoinedBatch[]>([])
  const [loadingBatches, setLoadingBatches] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Redirect if not student or not authenticated
  useEffect(() => {
    if (!loading && (!user || user.role !== 'student')) {
      router.push('/auth/login')
      return
    }
  }, [user, loading, router])

  // Fetch student's batches on component mount
  useEffect(() => {
    if (user && user.role === 'student') {
      fetchStudentBatches()
    }
  }, [user])

  // Filter batches based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredBatches(batches)
    } else {
      const filtered = batches.filter(batch =>
        batch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        batch.college_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        batch.teacher_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        batch.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredBatches(filtered)
    }
  }, [searchQuery, batches])

  /**
   * Fetch all batches joined by the student
   */
  const fetchStudentBatches = async () => {
    try {
      const response = await fetch(buildApiUrl('batches/student/my-batches'), {
        headers: {
          'Authorization': `Bearer ${user?.jwtToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setBatches(data.data || [])
      } else {
        console.error('Failed to fetch student batches')
      }
    } catch (error) {
      console.error('Error fetching student batches:', error)
    } finally {
      setLoadingBatches(false)
    }
  }

  /**
   * Format date for display
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  /**
   * Calculate time since joined
   */
  const getTimeSinceJoined = (joinedAt: string) => {
    const joined = new Date(joinedAt)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - joined.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return '1 day ago'
    if (diffDays < 30) return `${diffDays} days ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  }

  // Loading state
  if (loading || loadingBatches) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your batches...</p>
        </div>
      </div>
    )
  }

  return (
    <SidebarLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Top bar: title + actions (mobile-optimized) */}
        <div className="flex flex-col gap-3 sm:gap-2 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-2">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Batches</h1>
              <p className="text-muted-foreground text-sm sm:text-base">View and access your joined classrooms</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                onClick={() => router.push('/students/browse-batches')}
                className="border-blue-600 text-blue-600 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 transition-all duration-200 px-3 h-9 text-sm"
              >
                <BookOpen className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Browse</span>
                <span className="sm:hidden">Browse</span>
              </Button>
              <Button
                onClick={() => router.push('/students/join')}
                className="bg-primary hover:bg-primary/90 px-3 h-9 text-sm"
              >
                <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Join</span>
                <span className="sm:hidden">Join</span>
              </Button>
            </div>
          </div>
          {/* Compact stats in header (small size on all screens) */}
          <div className="grid grid-cols-2 gap-2">
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  <div className="ml-2">
                    <p className="text-xs text-muted-foreground">Joined Batches</p>
                    <p className="text-base font-semibold text-foreground">{batches.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center">
                  <School className="h-5 w-5 text-green-600" />
                  <div className="ml-2">
                    <p className="text-xs text-muted-foreground">Colleges</p>
                    <p className="text-base font-semibold text-foreground">{new Set(batches.map(batch => batch.college_name)).size}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        {/* Search and Stats */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search batches by name, college, teacher, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
          </div>

          {/* Quick Stats (moved to header) */}
        </div>

        {/* Batches Grid */}
        {filteredBatches.length === 0 ? (
          <div className="text-center py-12">
            {batches.length === 0 ? (
              <>
                <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No batches joined yet</h3>
                <p className="text-muted-foreground mb-6">Start by joining your first batch to access classroom content and submit work.</p>
                <Button
                  onClick={() => router.push('/students/join')}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Join Your First Batch
                </Button>
              </>
            ) : (
              <>
                <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No batches found</h3>
                <p className="text-muted-foreground">Try adjusting your search terms.</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBatches.map((batch) => (
              <BatchCard
                key={batch.batch_id}
                batch={{
                  batch_id: batch.batch_id,
                  name: batch.name,
                  college_name: batch.college_name,
                  description: batch.description,
                  icon_image: batch.icon_image,
                  cover_image: batch.cover_image,
                  created_at: batch.created_at,
                  member_count: batch.member_count || 0, // Use actual member count from backend
                  teacher_name: batch.teacher_name,
                  is_own_batch: false,
                  is_member: true // All batches in my-batches are joined
                }}
                showTeacherInfo={true}
                customButtonText="View Batch"
                buttonVariant="view"
                linkPath={`/batches/${batch.batch_id}`}
                customButtonAction={() => router.push(`/batches/${batch.batch_id}`)}
              />
            ))}
          </div>
        )}

        {/* Quick Navigation */}
       {/* {batches.length > 0 && (
          <div className="mt-12 text-center">
            <div className="inline-flex gap-4">
              <Button
                variant="outline"
                onClick={() => router.push('/students/my-batches')}
              >
                Go to Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/students/browse-batches')}
              >
                Browse More Batches
              </Button>
            </div>
          </div>
        )} */}
      </div>
    </SidebarLayout>
  )
}
