"use client"

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useSocket } from '@/contexts/socket-context'
import { TeacherReviewFeed } from './teacher-review-feed'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Check, X, Clock, FileText, Download, Loader2, ExternalLink } from 'lucide-react'

/**
 * Batch Feed Component
 * Displays submissions for a specific batch with real-time updates
 * Shows different views for teachers vs students
 * Includes teacher actions for accept/reject
 */

interface Submission {
  submission_id: number
  batch_id: number
  student_id: number
  practical_name: string
  content: string
  file_url?: string
  code_sandbox_link?: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  updated_at: string
  student_name: string
  student_email: string
  student_roll_number?: string
  student_year?: string
  student_subject?: string
  profile_picture_url?: string
}

interface BatchFeedProps {
  batchId: string
  refreshTrigger: number // Used to trigger refresh when new submission is created
}

export function BatchFeed({ batchId, refreshTrigger }: BatchFeedProps) {
  const { user } = useAuth()
  const { socket, joinBatch, leaveBatch } = useSocket()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null)

  // Join batch room for real-time updates
  useEffect(() => {
    if (batchId) {
      joinBatch(batchId)
      return () => leaveBatch(batchId)
    }
  }, [batchId, joinBatch, leaveBatch])

  // Listen for real-time submission updates
  useEffect(() => {
    if (!socket) return

    const handleSubmissionCreated = (data: { submission: Submission }) => {
      console.log('New submission received:', data)
      setSubmissions(prev => [data.submission, ...prev])
    }

    const handleSubmissionUpdated = (data: { submission: Submission }) => {
      console.log('Submission updated:', data)
      setSubmissions(prev =>
        prev.map(submission =>
          submission.submission_id === data.submission.submission_id
            ? { ...submission, ...data.submission }
            : submission
        )
      )
    }

    socket.on('submissionCreated', handleSubmissionCreated)
    socket.on('submissionUpdated', handleSubmissionUpdated)

    return () => {
      socket.off('submissionCreated', handleSubmissionCreated)
      socket.off('submissionUpdated', handleSubmissionUpdated)
    }
  }, [socket])

  // Fetch submissions when component mounts or refresh is triggered
  useEffect(() => {
    if (user && batchId) {
      fetchSubmissions()
    }
  }, [user, batchId, refreshTrigger])

  // For teachers, use the TeacherReviewFeed component to see all student posts
  // For students, use the regular feed to see only their own posts (private feed)
  if (user?.role === 'teacher') {
    return (
      <TeacherReviewFeed 
        batchId={batchId} 
        onSubmissionUpdated={() => {
          // Refresh trigger functionality can be handled in the parent component
        }} 
      />
    )
  }

  /**
   * Fetch submissions from API
   */
  const fetchSubmissions = async () => {
    try {
      setLoading(true)
      console.log('🔍 [BatchFeed] Fetching submissions for batch:', batchId, 'User role:', user?.role, 'User ID:', user?.userId)
      
      const response = await fetch(`/api/submissions/batch/${batchId}`, {
        headers: {
          'Authorization': `Bearer ${user?.jwtToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('📊 [BatchFeed] Raw API response:', data)
        console.log('📝 [BatchFeed] Number of submissions received:', data.data?.length || 0)
        setSubmissions(data.data)
        setError('')
      } else {
        const errorData = await response.json()
        console.error('❌ [BatchFeed] API Error:', errorData)
        setError(errorData.message || 'Failed to load submissions')
      }
    } catch (error) {
      console.error('Error fetching submissions:', error)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Update submission status (teacher only)
   */
  const updateSubmissionStatus = async (submissionId: number, status: 'accepted' | 'rejected') => {
    if (user?.role !== 'teacher') return

    try {
      setUpdatingStatus(submissionId)
      const response = await fetch(`/api/submissions/${submissionId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.jwtToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        // Update will be handled by real-time event
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to update submission status')
      }
    } catch (error) {
      console.error('Error updating submission status:', error)
      setError('Network error. Please try again.')
    } finally {
      setUpdatingStatus(null)
    }
  }

  /**
   * Get status badge color and text
   */
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Accepted</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
    }
  }

  /**
   * Format submission content with proper line breaks
   */
  const formatContent = (content: string) => {
    return content.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < content.split('\n').length - 1 && <br />}
      </React.Fragment>
    ))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading submissions...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-600">{error}</p>
          <Button onClick={fetchSubmissions} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (submissions.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions yet</h3>
          <p className="text-gray-600">
            {user?.role === 'student' 
              ? "Be the first to post a submission!"
              : "Waiting for students to submit their work."
            }
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {submissions.map((submission) => (
        <Card key={submission.submission_id} className="transition-all hover:shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={submission.profile_picture_url} />
                  <AvatarFallback>
                    {submission.student_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-base">{submission.student_name}</CardTitle>
                  <CardDescription className="text-sm mb-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {submission.student_roll_number && (
                        <>
                          <span className="font-medium text-primary">Roll: {submission.student_roll_number}</span>
                          <span>•</span>
                        </>
                      )}
                      {submission.student_year && (
                        <>
                          <span className="font-medium text-blue-600">{submission.student_year}</span>
                          <span>•</span>
                        </>
                      )}
                      {submission.student_subject && (
                        <>
                          <span className="font-medium text-green-600">{submission.student_subject}</span>
                          <span>•</span>
                        </>
                      )}
                      <span>@{submission.student_email.split('@')[0]}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(submission.created_at).toLocaleString()}
                    </div>
                  </CardDescription>
                  <h4 className="text-lg font-bold text-black mb-0 uppercase">
                    {submission.practical_name}
                  </h4>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusBadge(submission.status)}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            {/* Submission Content */}
            <div className="mb-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800">
                  {formatContent(submission.content)}
                </pre>
              </div>
            </div>

            {/* Attachments */}
            {(submission.file_url || submission.code_sandbox_link) && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  {submission.file_url && (
                    <Button variant="outline" size="sm" className="flex items-center">
                      <Download className="h-4 w-4 mr-2" />
                      Download File
                    </Button>
                  )}
                  
                  {submission.code_sandbox_link && (
                    <a
                      href={submission.code_sandbox_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-sm text-blue-700 hover:text-blue-900 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View Code Sandbox
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Teacher Actions */}
            {user?.role === 'teacher' && submission.status === 'pending' && (
              <div className="flex space-x-2 pt-4 border-t">
                <Button
                  size="sm"
                  onClick={() => updateSubmissionStatus(submission.submission_id, 'accepted')}
                  disabled={updatingStatus === submission.submission_id}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {updatingStatus === submission.submission_id ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => updateSubmissionStatus(submission.submission_id, 'rejected')}
                  disabled={updatingStatus === submission.submission_id}
                >
                  {updatingStatus === submission.submission_id ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <X className="h-4 w-4 mr-2" />
                  )}
                  Reject
                </Button>
              </div>
            )}

            {/* Status Update Message */}
            {submission.status !== 'pending' && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600">
                  {submission.status === 'accepted' ? '✅ Accepted by teacher' : '❌ Rejected by teacher'}
                  {submission.updated_at !== submission.created_at && (
                    <span className="ml-2">
                      on {new Date(submission.updated_at).toLocaleString()}
                    </span>
                  )}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
