"use client"

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useSocket } from '@/contexts/socket-context'
import { TeacherReviewFeed } from './teacher-review-feed'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Check, X, Clock, FileText, Download, Loader2, ExternalLink, Code } from 'lucide-react'
import { buildApiUrl } from '@/utils/api'
import { CodeSnippet } from '@/components/ui/code-snippets-3'

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

  /**
   * Fetch submissions from API
   */
  const fetchSubmissions = async () => {
    try {
      setLoading(true)
      console.log('🔍 [BatchFeed] Fetching submissions for batch:', batchId, 'User role:', user?.role, 'User ID:', user?.userId)
      
      const response = await fetch(buildApiUrl(`submissions/batch/${batchId}`), {
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
   * Update submission status (teacher only)
   */
  const updateSubmissionStatus = async (submissionId: number, status: 'accepted' | 'rejected') => {
    if (user?.role !== 'teacher') return

    try {
      setUpdatingStatus(submissionId)
      const response = await fetch(buildApiUrl(`submissions/${submissionId}/status`), {
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

  /**
   * Detect content type based on submission data
   * Enhanced to better detect code submissions
   */
  const getContentType = (submission: Submission): 'text' | 'image' | 'code' => {
    // If there's a code sandbox link, it's definitely code
    if (submission.code_sandbox_link) {
      return 'code'
    }
    
    // Check if there's a stored code_language in the database
    if (submission.code_language && submission.code_language !== 'text') {
      return 'code'
    }
    
    // If there's a specified code language, treat as code
    if (submission.code_language) {
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
  const renderContent = (submission: Submission) => {
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
            {/* Dynamic Content Rendering */}
            {renderContent(submission)}

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
