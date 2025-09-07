"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { buildApiUrl } from '@/utils/api'

// Interface for joined batch data in sidebar
export interface SidebarBatch {
  batch_id: number
  name: string
  teacher_name: string
  icon_image: string
  college_name: string
  last_viewed?: number // Timestamp of last view
}

/**
 * Get the last viewed time for a batch from localStorage
 * Returns timestamp or null if not found
 */
const getLastViewedTime = (batchId: number): number | null => {
  try {
    const stored = localStorage.getItem(`batch_viewed_${batchId}`)
    return stored ? parseInt(stored, 10) : null
  } catch {
    return null
  }
}

/**
 * Record that a batch was viewed (call this when user visits a batch page)
 * Stores timestamp in localStorage and dispatches event to refresh sidebar
 */
export const recordBatchView = (batchId: number): void => {
  try {
    const timestamp = Date.now()
    localStorage.setItem(`batch_viewed_${batchId}`, timestamp.toString())
    
    // Dispatch event to refresh sidebar
    window.dispatchEvent(new CustomEvent('batch-viewed', { 
      detail: { batchId, timestamp } 
    }))
  } catch (error) {
    console.error('Failed to record batch view:', error)
  }
}

/**
 * Custom hook to fetch student's joined batches for sidebar display
 * Provides loading state and error handling
 * Only fetches data for authenticated students
 * Orders batches by most recently viewed first
 */
export function useStudentBatches() {
  const { user } = useAuth()
  const [batches, setBatches] = useState<SidebarBatch[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch student batches when user is authenticated and is a student
  useEffect(() => {
    if (user && user.role === 'student' && user.jwtToken) {
      fetchStudentBatches()
    } else {
      // Clear batches if user is not a student or not authenticated
      setBatches([])
    }
  }, [user])

  // Listen for batch view events to refresh the sidebar
  useEffect(() => {
    const handleBatchView = () => {
      if (user && user.role === 'student') {
        fetchStudentBatches()
      }
    }

    window.addEventListener('batch-viewed', handleBatchView)
    return () => window.removeEventListener('batch-viewed', handleBatchView)
  }, [user])

  /**
   * Fetch all batches joined by the student
   * Only fetches essential data needed for sidebar display
   */
  const fetchStudentBatches = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(buildApiUrl('batches/student/my-batches'), {
        headers: {
          'Authorization': `Bearer ${user?.jwtToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        // Transform data to only include fields needed for sidebar
        const sidebarBatches: SidebarBatch[] = (data.data || []).map((batch: {
          batch_id: number;
          name: string;
          teacher_name: string;
          icon_image: string;
          college_name: string;
        }) => ({
          batch_id: batch.batch_id,
          name: batch.name,
          teacher_name: batch.teacher_name,
          icon_image: batch.icon_image,
          college_name: batch.college_name,
          last_viewed: getLastViewedTime(batch.batch_id)
        }))
        
        // Sort by most recently viewed first, then by joined date
        const sortedBatches = sidebarBatches.sort((a, b) => {
          // If both have last_viewed times, sort by most recent
          if (a.last_viewed && b.last_viewed) {
            return b.last_viewed - a.last_viewed
          }
          // If only one has last_viewed, prioritize it
          if (a.last_viewed && !b.last_viewed) return -1
          if (!a.last_viewed && b.last_viewed) return 1
          // If neither has last_viewed, maintain original order (joined_at DESC)
          return 0
        })
        
        setBatches(sortedBatches)
      } else {
        setError('Failed to fetch batches')
        console.error('Failed to fetch student batches')
      }
    } catch (error) {
      setError('Error fetching batches')
      console.error('Error fetching student batches:', error)
    } finally {
      setLoading(false)
    }
  }

  return {
    batches,
    loading,
    error,
    refetch: fetchStudentBatches
  }
}

