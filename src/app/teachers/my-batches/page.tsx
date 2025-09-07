"use client"

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { buildApiUrl } from '@/utils/api'
import { SidebarLayout } from '@/components/layout/sidebar-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Calendar, 
  Plus,
  Eye,
  Edit,
  Trash2,
  School,
  Loader2,
  Search,
  Grid3X3,
  List
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { BatchCard } from '@/components/batches/batch-card'

/**
 * Teacher My Batches Page
 * Lists all batches created by the teacher with management options
 * Includes search functionality and quick actions
 */

// Interface for batch data
interface Batch {
  batch_id: number
  name: string
  college_name: string
  description: string
  icon_image: string
  cover_image: string
  created_at: string
  member_count: number
}

export default function TeacherMyBatchesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  
  // State management
  const [batches, setBatches] = useState<Batch[]>([])
  const [filteredBatches, setFilteredBatches] = useState<Batch[]>([])
  const [loadingBatches, setLoadingBatches] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [deletingBatchId, setDeletingBatchId] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Redirect if not teacher or not authenticated
  useEffect(() => {
    if (!loading && (!user || user.role !== 'teacher')) {
      router.push('/auth/login')
      return
    }
  }, [user, loading, router])

  // Fetch teacher's batches on component mount
  useEffect(() => {
    if (user && user.role === 'teacher') {
      fetchTeacherBatches()
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
        batch.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredBatches(filtered)
    }
  }, [searchQuery, batches])

  /**
   * Fetch all batches created by the teacher
   */
  const fetchTeacherBatches = async () => {
    try {
      const response = await fetch(buildApiUrl('batches/teacher/my-batches'), {
        headers: {
          'Authorization': `Bearer ${user?.jwtToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setBatches(data.data || [])
      } else {
        console.error('Failed to fetch teacher batches')
      }
    } catch (error) {
      console.error('Error fetching teacher batches:', error)
    } finally {
      setLoadingBatches(false)
    }
  }

  /**
   * Handle batch deletion
   */
  const handleDeleteBatch = async (batchId: number, batchName: string) => {
    if (!confirm(`Are you sure you want to delete "${batchName}"? This action cannot be undone.`)) {
      return
    }

    setDeletingBatchId(batchId)

    try {
      const response = await fetch(`/api/batches/${batchId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user?.jwtToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        // Remove deleted batch from state
        setBatches(prev => prev.filter(batch => batch.batch_id !== batchId))
        alert(`"${batchName}" has been deleted successfully.`)
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to delete batch')
      }
    } catch (error) {
      console.error('Error deleting batch:', error)
      alert('Network error. Please try again.')
    } finally {
      setDeletingBatchId(null)
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

  // Loading state
  if (loading || loadingBatches) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your batches...</p>
        </div>
      </div>
    )
  }

  return (
    <SidebarLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header with action aligned to the right */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Batches</h1>
            <p className="text-muted-foreground mt-1">Manage your created batches and view student enrollment</p>
          </div>
          <div className="flex shrink-0">
            <Button
              onClick={() => router.push('/teachers/create-batch')}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Batch
            </Button>
          </div>
        </div>
        {/* Search and Controls */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search batches by name, college, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="card-light">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
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
                  <Users className="h-8 w-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                    <p className="text-xl font-bold text-foreground">
                      {batches.reduce((sum, batch) => sum + batch.member_count, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card-light">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <School className="h-8 w-8 text-purple-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-muted-foreground">Active Batches</p>
                    <p className="text-xl font-bold text-foreground">{batches.length}</p>
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
                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No batches created yet</h3>
                <p className="text-muted-foreground mb-6">Start by creating your first batch to manage students and submissions.</p>
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
                <p className="text-muted-foreground">Try adjusting your search terms.</p>
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
                className={viewMode === 'list' ? "max-w-none" : ""}
              />
            ))}
          </div>
        )}
      </div>
    </SidebarLayout>
  )
}
