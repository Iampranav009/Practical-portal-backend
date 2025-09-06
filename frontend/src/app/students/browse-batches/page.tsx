"use client"

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { buildApiUrl } from '@/utils/api'
import { useRouter } from 'next/navigation'
import { SidebarLayout } from '@/components/layout/sidebar-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { BatchCard } from '@/components/batches/batch-card'
import { 
  Users, 
  Calendar, 
  School,
  BookOpen,
  Search,
  Eye,
  Clock,
  UserCheck,
  Plus,
  Filter
} from 'lucide-react'
import { getApiBaseUrl } from '@/utils/api'

/**
 * Student Browse Batches Page
 * Displays all available batches in card format for students to discover and join
 * Similar UI to teacher's explore page with batch cards
 */

interface AvailableBatch {
  batch_id: number
  name: string
  college_name: string
  description: string
  icon_image: string
  cover_image: string
  created_at: string
  teacher_name: string
  member_count: number
  is_member: boolean
  can_join: boolean
}

export default function StudentBrowseBatchesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  
  // State management
  const [batches, setBatches] = useState<AvailableBatch[]>([])
  const [filteredBatches, setFilteredBatches] = useState<AvailableBatch[]>([])
  const [loadingBatches, setLoadingBatches] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterOption, setFilterOption] = useState<'all' | 'available' | 'joined'>('all')

  // Redirect if not student or not authenticated
  useEffect(() => {
    if (!loading && (!user || user.role !== 'student')) {
      router.push('/auth/login')
      return
    }
  }, [user, loading, router])

  // Fetch batches on component mount
  useEffect(() => {
    if (user && user.role === 'student') {
      fetchAvailableBatches()
    }
  }, [user])

  // Filter batches based on search query and filter option
  useEffect(() => {
    let filtered = batches

    // Apply search filter
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(batch =>
        batch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        batch.college_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        batch.teacher_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        batch.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply filter option
    if (filterOption === 'available') {
      filtered = filtered.filter(batch => batch.can_join)
    } else if (filterOption === 'joined') {
      filtered = filtered.filter(batch => batch.is_member)
    }

    setFilteredBatches(filtered)
  }, [searchQuery, batches, filterOption])

  /**
   * Fetch all available batches
   */
  const fetchAvailableBatches = async () => {
    try {
      const response = await fetch(buildApiUrl('batches/browse'), {
        headers: {
          'Authorization': `Bearer ${user?.jwtToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setBatches(data.data || [])
      } else {
        console.error('Failed to fetch available batches')
      }
    } catch (error) {
      console.error('Error fetching available batches:', error)
    } finally {
      setLoadingBatches(false)
    }
  }

  /**
   * Format date for display
   */
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return '1 day ago'
    if (diffDays < 30) return `${diffDays} days ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  }

  /**
   * Get initials from name
   */
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().substring(0, 2)
  }

  /**
   * Handle joining a batch - redirect to join page with batch ID
   */
  const handleJoinBatch = (batchId: number) => {
    router.push(`/students/join?batch_id=${batchId}`)
  }

  /**
   * Handle viewing a joined batch
   */
  const handleViewBatch = (batchId: number) => {
    router.push(`/batches/${batchId}`)
  }

  // Loading state
  if (loading || loadingBatches) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Discovering batches...</p>
        </div>
      </div>
    )
  }

  const availableBatches = batches.filter(batch => batch.can_join)
  const joinedBatches = batches.filter(batch => batch.is_member)

  return (
    <SidebarLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header - Mobile optimized */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Browse Batches</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Discover and join new classrooms from different teachers</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search batches by name, college, teacher, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filter Options - Mobile optimized */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button
                variant={filterOption === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterOption('all')}
                className="flex items-center gap-1 whitespace-nowrap"
              >
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">All</span>
                <span className="sm:hidden">All</span>
                <span className="ml-1">({batches.length})</span>
              </Button>
              <Button
                variant={filterOption === 'available' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterOption('available')}
                className="flex items-center gap-1 whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Available</span>
                <span className="sm:hidden">Available</span>
                <span className="ml-1">({availableBatches.length})</span>
              </Button>
              <Button
                variant={filterOption === 'joined' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterOption('joined')}
                className="flex items-center gap-1 whitespace-nowrap"
              >
                <UserCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Joined</span>
                <span className="sm:hidden">Joined</span>
                <span className="ml-1">({joinedBatches.length})</span>
              </Button>
            </div>
          </div>

          {/* Quick Stats - Mobile responsive */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <Card className="card-light">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <BookOpen className="h-8 w-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-muted-foreground">Total Batches</p>
                    <p className="text-xl font-bold text-foreground">{batches.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card-light">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Plus className="h-8 w-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-muted-foreground">Available to Join</p>
                    <p className="text-xl font-bold text-foreground">{availableBatches.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card-light">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <UserCheck className="h-8 w-8 text-purple-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-muted-foreground">Already Joined</p>
                    <p className="text-xl font-bold text-foreground">{joinedBatches.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card-light">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <School className="h-8 w-8 text-orange-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-muted-foreground">Colleges</p>
                    <p className="text-xl font-bold text-foreground">
                      {new Set(batches.map(batch => batch.college_name)).size}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Batches Grid */}
        {filteredBatches.length === 0 ? (
          <div className="text-center py-12">
            {batches.length === 0 ? (
              <>
                <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No batches available</h3>
                <p className="text-muted-foreground mb-6">Check back later for new batches to join.</p>
                <Button
                  onClick={() => router.push('/students/my-batches')}
                  className="bg-primary hover:bg-primary/90"
                >
                  Go to My Batches
                </Button>
              </>
            ) : (
              <>
                <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No batches found</h3>
                <p className="text-muted-foreground">Try adjusting your search terms or filters.</p>
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
                  member_count: batch.member_count,
                  teacher_name: batch.teacher_name,
                  is_own_batch: false,
                  is_member: batch.is_member
                }}
                showTeacherInfo={true}
                customButtonText={batch.is_member ? "View Batch" : "Join Batch"}
                buttonVariant={batch.is_member ? "view" : "join"}
                linkPath={`/batches/${batch.batch_id}`}
                customButtonAction={() => {
                  if (batch.is_member) {
                    handleViewBatch(batch.batch_id)
                  } else {
                    handleJoinBatch(batch.batch_id)
                  }
                }}
              />
            ))}
          </div>
        )}

        {/* Quick Actions */}
        {batches.length > 0 && (
          <div className="mt-12 text-center">
            <div className="inline-flex gap-4">
              <Button
                variant="outline"
                onClick={() => router.push('/students/my-batches')}
                className="hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 transition-all duration-200"
              >
                My Joined Batches
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/students/join')}
                className="hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 transition-all duration-200"
              >
                Manual Join with ID
              </Button>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  )
}
