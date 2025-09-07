"use client"

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { buildApiUrl } from '@/utils/api'
import { SidebarLayout } from '@/components/layout/sidebar-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  Filter,
  Grid3X3,
  List
} from 'lucide-react'
import { BatchCard } from '@/components/batches/batch-card'

/**
 * Teacher Explore Batches Page
 * Displays all batches from all teachers in a global view
 * Allows teachers to discover and view other teachers' batches
 * Uses the same card layout as my-batches but with teacher info and view actions
 */

interface ExploreBatch {
  batch_id: number
  name: string
  college_name: string
  description: string
  icon_image: string
  cover_image: string
  created_at: string
  teacher_name: string
  teacher_id: string
  member_count: number
  is_own_batch: boolean
}

export default function TeacherExploreBatchesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  
  // State management
  const [batches, setBatches] = useState<ExploreBatch[]>([])
  const [filteredBatches, setFilteredBatches] = useState<ExploreBatch[]>([])
  const [loadingBatches, setLoadingBatches] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterOption, setFilterOption] = useState<'all' | 'others' | 'own'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Redirect if not teacher or not authenticated
  useEffect(() => {
    if (!loading && (!user || user.role !== 'teacher')) {
      router.push('/auth/login')
      return
    }
  }, [user, loading, router])

  // Fetch all batches on component mount
  useEffect(() => {
    if (user && user.role === 'teacher') {
      fetchAllBatches()
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
    if (filterOption === 'others') {
      filtered = filtered.filter(batch => !batch.is_own_batch)
    } else if (filterOption === 'own') {
      filtered = filtered.filter(batch => batch.is_own_batch)
    }

    setFilteredBatches(filtered)
  }, [searchQuery, batches, filterOption])

  /**
   * Fetch all batches from all teachers
   */
  const fetchAllBatches = async () => {
    try {
      const response = await fetch(buildApiUrl('batches/browse'), {
        headers: {
          'Authorization': `Bearer ${user?.jwtToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        // Backend now provides is_own_batch flag, so use it directly
        setBatches(data.data || [])
      } else {
        console.error('Failed to fetch all batches')
      }
    } catch (error) {
      console.error('Error fetching all batches:', error)
    } finally {
      setLoadingBatches(false)
    }
  }



  // Loading state
  if (loading || loadingBatches) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Discovering batches...</p>
        </div>
      </div>
    )
  }

  const ownBatches = batches.filter(batch => batch.is_own_batch)
  const otherBatches = batches.filter(batch => !batch.is_own_batch)

  return (
    <SidebarLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Explore Batches</h1>
          <p className="text-muted-foreground mt-2">Discover batches from all teachers and see what others are creating</p>
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
            
            {/* Filter Options */}
            <div className="flex gap-2">
              <Button
                variant={filterOption === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterOption('all')}
                className="flex items-center gap-1"
              >
                <Filter className="h-4 w-4" />
                All ({batches.length})
              </Button>
              <Button
                variant={filterOption === 'others' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterOption('others')}
                className="flex items-center gap-1"
              >
                <Eye className="h-4 w-4" />
                Others ({otherBatches.length})
              </Button>
              <Button
                variant={filterOption === 'own' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterOption('own')}
                className="flex items-center gap-1"
              >
                <UserCheck className="h-4 w-4" />
                My Batches ({ownBatches.length})
              </Button>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                  <Eye className="h-8 w-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-muted-foreground">Other Teachers</p>
                    <p className="text-xl font-bold text-foreground">{otherBatches.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card-light">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <UserCheck className="h-8 w-8 text-purple-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-muted-foreground">My Batches</p>
                    <p className="text-xl font-bold text-foreground">{ownBatches.length}</p>
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

        {/* Batches Display */}
        {filteredBatches.length === 0 ? (
          <div className="text-center py-12">
            {batches.length === 0 ? (
              <>
                <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No batches available</h3>
                <p className="text-muted-foreground mb-6">Check back later for new batches to explore.</p>
                <Button
                  onClick={() => router.push('/teachers/create-batch')}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Batch
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
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
            : "space-y-4"
          }>
            {filteredBatches.map((batch) => (
              <BatchCard
                key={batch.batch_id}
                batch={batch}
                showTeacherInfo={true}
                className={viewMode === 'list' ? "max-w-none" : ""}
                customButtonText={batch.is_own_batch ? "View My Batch" : "View Batch"}
                customButtonAction={() => {
                  if (batch.is_own_batch) {
                    // For own batches, go to teacher batch management page
                    router.push(`/teachers/batch/${batch.batch_id}`)
                  } else {
                    // For others' batches, go to view-only batch page
                    router.push(`/batches/${batch.batch_id}`)
                  }
                }}
              />
            ))}
          </div>
        )}

        {/* Quick Actions */}
      </div>
    </SidebarLayout>
  )
}
