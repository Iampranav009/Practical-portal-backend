"use client"

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useSocket } from '@/contexts/socket-context'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  FileText, 
  ExternalLink,
  Loader2,
  Check,
  X,
  Download,
  Code,
  FileText as FileTextIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CodeSnippet } from '@/components/ui/code-snippets-3'
import { buildApiUrl } from '@/utils/api'

/**
 * Teacher Review Feed Component
 * Instagram-style feed showing all student submissions for a batch
 * 
 * Visibility Rules:
 * - Teachers can see ALL student posts from their batch
 * - Students cannot access this component (they use regular batch feed)
 * 
 * Teachers can accept/reject submissions with real-time updates
 */

interface BatchSubmission {
  submission_id: number
  batch_id: number
  student_id: number
  practical_name: string
  content: string
  file_url?: string
  code_sandbox_link?: string
  code_language?: string
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

interface TeacherReviewFeedProps {
  batchId: string
  onSubmissionUpdated?: () => void
}

export function TeacherReviewFeed({ batchId, onSubmissionUpdated }: TeacherReviewFeedProps) {
  const { user } = useAuth()
  const { socket, joinBatch, leaveBatch } = useSocket()
  const [submissions, setSubmissions] = useState<BatchSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingSubmission, setUpdatingSubmission] = useState<number | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all')
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set())
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<number>>(new Set())
  const [forceCodeView, setForceCodeView] = useState<Set<number>>(new Set())

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

    const handleSubmissionCreated = (data: { submission: any }) => {
      console.log('New submission received:', data)
      setSubmissions(prev => [data.submission, ...prev])
    }

    const handleSubmissionUpdated = (data: { submission: any }) => {
      console.log('Submission updated:', data)
      setSubmissions(prev =>
        prev.map(submission =>
          submission.submission_id === data.submission.submission_id
            ? { ...submission, ...data.submission }
            : submission
        )
      )
    }

    const handleSubmissionDeleted = (data: { submission_id: number }) => {
      console.log('Submission deleted:', data)
      setSubmissions(prev =>
        prev.filter(submission => submission.submission_id !== data.submission_id)
      )
    }

    socket.on('submissionCreated', handleSubmissionCreated)
    socket.on('submissionUpdated', handleSubmissionUpdated)
    socket.on('submissionDeleted', handleSubmissionDeleted)

    return () => {
      socket.off('submissionCreated', handleSubmissionCreated)
      socket.off('submissionUpdated', handleSubmissionUpdated)
      socket.off('submissionDeleted', handleSubmissionDeleted)
    }
  }, [socket])

  // Fetch submissions when component mounts
  useEffect(() => {
    fetchSubmissions()
  }, [batchId])

  // Only show to teachers
  if (!user || user.role !== 'teacher') {
    return null
  }

  /**
   * Fetch all submissions for the batch
   */
  const fetchSubmissions = async () => {
    try {
      setLoading(true)
      const response = await fetch(buildApiUrl(`submissions/batch/${batchId}`), {
        headers: {
          'Authorization': `Bearer ${user.jwtToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSubmissions(data.data)
        setError('')
      } else {
        const errorData = await response.json()
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
   * Update submission status (accept/reject)
   */
  const handleStatusUpdate = async (submissionId: number, status: 'accepted' | 'rejected') => {
    try {
      setUpdatingSubmission(submissionId)
      const response = await fetch(buildApiUrl(`submissions/${submissionId}/status`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.jwtToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        const data = await response.json()
        // Update local state
        setSubmissions(prev => 
          prev.map(sub => 
            sub.submission_id === submissionId 
              ? { ...sub, status, updated_at: new Date().toISOString() }
              : sub
          )
        )
        setError('')
        onSubmissionUpdated?.()
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to update submission')
      }
    } catch (error) {
      console.error('Error updating submission:', error)
      setError('Network error. Please try again.')
    } finally {
      setUpdatingSubmission(null)
    }
  }

  /**
   * Get status badge with appropriate styling
   */
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 flex items-center">
            <CheckCircle className="h-3 w-3 mr-1" />
            Accepted
          </Badge>
        )
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100 flex items-center">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            Pending Review
          </Badge>
        )
    }
  }

  /**
   * Format time in a social media style (e.g., "2 hours ago")
   */
  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const submissionDate = new Date(dateString)
    const diffMs = now.getTime() - submissionDate.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    } else {
      const diffMins = Math.floor(diffMs / (1000 * 60))
      return diffMins > 0 ? `${diffMins} min${diffMins > 1 ? 's' : ''} ago` : 'Just now'
    }
  }

  /**
   * Detect content type based on submission data
   * Enhanced to better detect code submissions
   */
  const getContentType = (submission: BatchSubmission): 'text' | 'image' | 'code' => {
    // Check if user manually forced code view for this submission
    if (forceCodeView.has(submission.submission_id)) {
      return 'code'
    }
    // If there's a code sandbox link, it's definitely code
    if (submission.code_sandbox_link) {
      return 'code'
    }
    
    // If there's a specified code language, treat as code
    if (submission.code_language && submission.code_language !== 'text') {
      return 'code'
    }
    
    // Enhanced code pattern detection
    const codePatterns = [
      // JavaScript/TypeScript patterns
      /function\s+\w+/,
      /const\s+\w+\s*=/,
      /let\s+\w+\s*=/,
      /var\s+\w+\s*=/,
      /import\s+/,
      /export\s+/,
      /class\s+\w+/,
      /interface\s+\w+/,
      /type\s+\w+/,
      /=>\s*\{/,
      /console\.log/,
      /return\s+/,
      
      // HTML patterns
      /<[a-zA-Z]+[^>]*>/,
      /<\/[a-zA-Z]+>/,
      /<!DOCTYPE/,
      /<html/,
      /<head/,
      /<body/,
      
      // CSS patterns
      /\.[a-zA-Z-]+\s*\{/,
      /#[a-zA-Z-]+\s*\{/,
      /@media/,
      /@import/,
      
      // General code patterns
      /\{\s*[\w\s:,"']+\s*\}/,
      /;\s*$/,
      /\/\/.*$/,
      /\/\*[\s\S]*?\*\//,
      
      // Python patterns
      /def\s+\w+/,
      /import\s+\w+/,
      /from\s+\w+/,
      /class\s+\w+/,
      /if\s+__name__/,
      
      // Java patterns
      /public\s+class/,
      /private\s+\w+/,
      /public\s+static/,
      /System\.out\.print/,
      
      // C/C++ patterns
      /#include/,
      /int\s+main/,
      /printf/,
      /cout\s*<</,
      
      // SQL patterns
      /SELECT\s+/,
      /INSERT\s+INTO/,
      /UPDATE\s+/,
      /DELETE\s+FROM/,
      /CREATE\s+TABLE/
    ]
    
    // Check if content matches any code patterns
    if (codePatterns.some(pattern => pattern.test(submission.content))) {
      return 'code'
    }
    
    // Check if content has multiple lines and looks like code structure
    const lines = submission.content.split('\n')
    if (lines.length > 3) {
      // Check if multiple lines contain code-like patterns
      const codeLineCount = lines.filter(line => 
        codePatterns.some(pattern => pattern.test(line.trim()))
      ).length
      
      // If more than 30% of lines look like code, treat as code
      if (codeLineCount / lines.length > 0.3) {
        return 'code'
      }
    }
    
    // Check if content has image URL patterns
    const imagePatterns = [
      /https?:\/\/.*\.(jpg|jpeg|png|gif|webp)/i,
      /data:image\//
    ]
    
    if (submission.file_url?.match(/\.(jpg|jpeg|png|gif|webp)$/i) || 
        imagePatterns.some(pattern => pattern.test(submission.content))) {
      return 'image'
    }
    
    return 'text'
  }

  /**
   * Render content based on type
   */
  const renderContent = (submission: BatchSubmission) => {
    const contentType = getContentType(submission)
    
    switch (contentType) {
      case 'image':
        // Extract image URL from content or use file_url
        const imageUrl = submission.file_url || 
          submission.content.match(/https?:\/\/.*\.(jpg|jpeg|png|gif|webp)/i)?.[0]
        
        return (
          <div className="mt-4">
            {imageUrl && (
              <div className="rounded-lg overflow-hidden border border-border mb-4">
                <img
                  src={imageUrl}
                  alt="Submission content"
                  className="w-full h-64 object-cover"
                  onError={(e) => {
                    // Hide image if it fails to load
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            )}
            {submission.content && !submission.content.includes(imageUrl || '') && (
              <p className="text-foreground leading-relaxed">{submission.content}</p>
            )}
          </div>
        )
      
      case 'code':
        // Map stored language codes to proper language names for syntax highlighting
        const mapLanguageCode = (languageCode?: string): string => {
          if (!languageCode) return 'typescript' // default fallback
          
          const languageMap: { [key: string]: string } = {
            'typescript': 'typescript',
            'javascript': 'javascript', 
            'python': 'python',
            'java': 'java',
            'cpp': 'cpp',
            'c': 'c',
            'html': 'html',
            'css': 'css',
            'sql': 'sql',
            'bash': 'bash',
            'json': 'json',
            'xml': 'xml',
            'markdown': 'markdown',
            'text': 'text'
          }
          
          return languageMap[languageCode.toLowerCase()] || languageCode
        }
        
        // Auto-detect language if not specified
        const detectLanguage = (content: string, specifiedLanguage?: string): string => {
          // First, try to use the specified language (mapped to proper name)
          if (specifiedLanguage) {
            return mapLanguageCode(specifiedLanguage)
          }
          
          // Language detection patterns for auto-detection
          if (/function\s+\w+|const\s+\w+\s*=|let\s+\w+\s*=/.test(content)) return 'javascript'
          if (/interface\s+\w+|type\s+\w+|:\s*\w+/.test(content)) return 'typescript'
          if (/<[a-zA-Z]+[^>]*>|<!DOCTYPE/.test(content)) return 'html'
          if (/\.[a-zA-Z-]+\s*\{|#[a-zA-Z-]+\s*\{/.test(content)) return 'css'
          if (/def\s+\w+|import\s+\w+|from\s+\w+/.test(content)) return 'python'
          if (/public\s+class|System\.out\.print/.test(content)) return 'java'
          if (/#include|int\s+main|printf/.test(content)) return 'c'
          if (/SELECT\s+|INSERT\s+INTO|CREATE\s+TABLE/.test(content)) return 'sql'
          
          return 'typescript' // default fallback
        }
        
        const detectedLanguage = detectLanguage(submission.content, submission.code_language)
        
        // Create a user-friendly title with proper language name
        const getLanguageDisplayName = (languageCode: string): string => {
          const displayNames: { [key: string]: string } = {
            'typescript': 'TypeScript',
            'javascript': 'JavaScript',
            'python': 'Python', 
            'java': 'Java',
            'cpp': 'C++',
            'c': 'C',
            'html': 'HTML',
            'css': 'CSS',
            'sql': 'SQL',
            'bash': 'Bash',
            'json': 'JSON',
            'xml': 'XML',
            'markdown': 'Markdown',
            'text': 'Plain Text'
          }
          
          return displayNames[languageCode.toLowerCase()] || languageCode
        }
        
        const displayLanguage = getLanguageDisplayName(detectedLanguage)
        const title = displayLanguage
        
        return (
          <div className="mt-4">
            <CodeSnippet
              title={title}
              code={submission.content}
              language={detectedLanguage}
              className="w-full"
              showLineNumbers={true}
              border={true}
            />
          </div>
        )
      
      default:
        return (
          <div className="mt-4">
            <p className="text-foreground leading-relaxed whitespace-pre-wrap">{submission.content}</p>
          </div>
        )
    }
  }

  /**
   * Handle like toggle
   */
  const handleLikeToggle = (submissionId: number) => {
    setLikedPosts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(submissionId)) {
        newSet.delete(submissionId)
      } else {
        newSet.add(submissionId)
      }
      return newSet
    })
  }

  /**
   * Handle bookmark toggle
   */
  const handleBookmarkToggle = (submissionId: number) => {
    setBookmarkedPosts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(submissionId)) {
        newSet.delete(submissionId)
      } else {
        newSet.add(submissionId)
      }
      return newSet
    })
  }

  /**
   * Toggle between code and text view for a submission
   */
  const handleCodeViewToggle = (submissionId: number) => {
    setForceCodeView(prev => {
      const newSet = new Set(prev)
      if (newSet.has(submissionId)) {
        newSet.delete(submissionId)
      } else {
        newSet.add(submissionId)
      }
      return newSet
    })
  }

  /**
   * Filter submissions based on selected filter
   */
  const filteredSubmissions = submissions.filter(submission => 
    filter === 'all' || submission.status === filter
  )

  const pendingCount = submissions.filter(submission => submission.status === 'pending').length

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
            <span className="text-gray-600">Loading submissions...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchSubmissions} size="sm">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
       <div className="max-w-7xl mx-auto w-full px-0 pt-0 sm:px-2">
        {/* Filter Controls (compact) */}
        {submissions.length > 0 && (
          <div className="mb-4">
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All ({submissions.length})
              </Button>
              <Button
                variant={filter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('pending')}
              >
                Pending ({submissions.filter(s => s.status === 'pending').length})
              </Button>
              <Button
                variant={filter === 'accepted' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('accepted')}
              >
                Approved ({submissions.filter(s => s.status === 'accepted').length})
              </Button>
              <Button
                variant={filter === 'rejected' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('rejected')}
              >
                Rejected ({submissions.filter(s => s.status === 'rejected').length})
              </Button>
            </div>
          </div>
        )}

        

        {/* Submissions Feed */}
        <div className="space-y-6">
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No submissions found for the selected filter.</p>
            </div>
          ) : (
            filteredSubmissions.map((submission) => (
              <Card key={submission.submission_id} className="w-full mb-4 bg-background border-border shadow-sm">
                {/* Modern Social Media Header */}
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage 
                          src={submission.profile_picture_url} 
                          alt={submission.student_name}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                          {submission.student_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-foreground">{submission.student_name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatTimeAgo(submission.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Code/Text View Toggle Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCodeViewToggle(submission.submission_id)}
                        className="h-8 w-8 p-0"
                        title={forceCodeView.has(submission.submission_id) ? "Switch to text view" : "Switch to code view"}
                      >
                        {forceCodeView.has(submission.submission_id) ? (
                          <FileTextIcon className="h-4 w-4" />
                        ) : (
                          <Code className="h-4 w-4" />
                        )}
                      </Button>
                      {getStatusBadge(submission.status)}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {/* Practical Name as Post Title */}
                  <div className="mb-0">
                    <h4 className="text-lg font-bold text-black uppercase">
                      {submission.practical_name}
                    </h4>
                  </div>

                  {/* Dynamic Content Rendering */}
                  {renderContent(submission)}

                  {/* Attachments */}
                  {(submission.file_url || submission.code_sandbox_link) && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
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

                  {/* Teacher Action Buttons */}
                  {submission.status === 'pending' && (
                    <div className="flex items-center justify-end mt-6 pt-4 border-t border-border gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate(submission.submission_id, 'rejected')}
                        disabled={updatingSubmission === submission.submission_id}
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(submission.submission_id, 'accepted')}
                        disabled={updatingSubmission === submission.submission_id}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  )}

                  {/* Status message removed per requirements */}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
