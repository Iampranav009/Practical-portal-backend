"use client"

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useSocket } from '@/contexts/socket-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  MoreHorizontal,
  Check,
  X,
  Image as ImageIcon,
  Code,
  FileText,
  Clock,
  User,
  Loader2,
  Download,
  ExternalLink,
  Edit,
  Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CodeSnippet } from '@/components/ui/code-snippets-3'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { buildApiUrl } from '@/utils/api'

/**
 * Refined Batch Feed Component
 * Social media style feed for batch submissions
 * 
 * Visibility Rules:
 * - Students: See only their own posts (private feed)
 * - Teachers: See all student posts from their batch
 * 
 * Includes like, share, bookmark functionality
 * Shows different views for students vs teachers
 */

interface PostContent {
  type: 'text' | 'image' | 'code'
  data: string
  language?: string // For code content
}

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
  content: PostContent
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

interface RefinedBatchFeedProps {
  batchId: string
  refreshTrigger: number
  onEditPost?: (post: string | PostData) => void
}

export function RefinedBatchFeed({ batchId, refreshTrigger, onEditPost }: RefinedBatchFeedProps) {
  const { user } = useAuth()
  const { socket, joinBatch, leaveBatch } = useSocket()
  const [posts, setPosts] = useState<PostData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all')

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
      const newPost = convertSubmissionToPost(data.submission)
      setPosts(prev => [newPost, ...prev])
    }

    const handleSubmissionUpdated = (data: { submission: any }) => {
      console.log('Submission updated:', data)
      const updatedPost = convertSubmissionToPost(data.submission)
      setPosts(prev =>
        prev.map(post =>
          post.id === data.submission.submission_id.toString()
            ? { ...post, ...updatedPost }
            : post
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

  /**
   * Convert submission data to post format
   */
  const convertSubmissionToPost = (submission: {
    submission_id: number;
    content: string;
    file_path?: string;
    file_url?: string;
    file_type?: string;
    code_language?: string;
    created_at: string;
    student_name: string;
    student_email: string;
    profile_picture_url?: string;
    student_roll_number?: string;
    student_year?: string;
    student_subject?: string;
    status?: string;
    practical_name?: string;
    code_sandbox_link?: string;
    user: {
      name: string;
      profile_picture?: string;
    };
  }): PostData => {
    // Determine content type based on submission data
    let contentType: 'text' | 'image' | 'code' = 'text'
    let contentData = submission.content
    let language = 'text'

    // Check if content looks like code (improved heuristic)
    // First check if there's a code_sandbox_link - this indicates it's definitely code
    if (submission.code_sandbox_link) {
      contentType = 'code'
      language = submission.code_language || 'typescript'
    }
    // Check if there's a stored code_language in the database
    else if (submission.code_language && submission.code_language !== 'text') {
      contentType = 'code'
      language = submission.code_language
    }
    // Enhanced code detection based on content patterns
    else if (submission.content && (
      // JavaScript/TypeScript patterns
      submission.content.includes('function') ||
      submission.content.includes('const ') ||
      submission.content.includes('let ') ||
      submission.content.includes('var ') ||
      submission.content.includes('class ') ||
      submission.content.includes('import ') ||
      submission.content.includes('export ') ||
      submission.content.includes('=>') ||
      submission.content.includes('{') ||
      submission.content.includes('}') ||
      submission.content.includes(';') ||
      // Python patterns
      submission.content.includes('def ') ||
      submission.content.includes('import ') ||
      submission.content.includes('from ') ||
      submission.content.includes('if __name__') ||
      // Java/C++ patterns
      submission.content.includes('public ') ||
      submission.content.includes('private ') ||
      submission.content.includes('protected ') ||
      submission.content.includes('static ') ||
      submission.content.includes('void ') ||
      submission.content.includes('int ') ||
      submission.content.includes('String ') ||
      // HTML patterns
      submission.content.includes('<html') ||
      submission.content.includes('<div') ||
      submission.content.includes('<p>') ||
      submission.content.includes('<!DOCTYPE') ||
      // CSS patterns
      submission.content.includes('{') && submission.content.includes('}') && submission.content.includes(':') ||
      // SQL patterns
      submission.content.includes('SELECT ') ||
      submission.content.includes('INSERT ') ||
      submission.content.includes('UPDATE ') ||
      submission.content.includes('DELETE ') ||
      submission.content.includes('CREATE ') ||
      // General code patterns (multiple lines with indentation)
      (submission.content.split('\n').length > 3 && 
       submission.content.split('\n').some(line => line.trim().startsWith('  ') || line.trim().startsWith('\t')))
    )) {
      contentType = 'code'
      // Use stored language from database, fallback to detection
      language = submission.code_language || 'typescript'
    }

    // Check if there's an image file
    if (submission.file_url && submission.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      contentType = 'image'
      contentData = submission.file_url
    }

    return {
      id: submission.submission_id.toString(),
      author: {
        name: submission.student_name,
        username: submission.student_email.split('@')[0],
        avatar: submission.profile_picture_url || '',
        rollNumber: submission.student_roll_number,
        year: submission.student_year,
        subject: submission.student_subject
      },
      content: {
        type: contentType,
        data: contentData,
        language: contentType === 'code' ? language : undefined
      },
      timestamp: new Date(submission.created_at).toLocaleString(),
      engagement: {
        likes: 0, // Can be enhanced with actual like system
        shares: 0
      },
      status: (submission.status as 'pending' | 'accepted' | 'rejected') || 'pending',
      practical_name: submission.practical_name || 'Practical Assignment',
      file_url: submission.file_url,
      code_sandbox_link: submission.code_sandbox_link
    }
  }

  /**
   * Fetch submissions from API
   */
  const fetchSubmissions = async () => {
    try {
      setLoading(true)
      console.log('🔍 Fetching submissions for batch:', batchId, 'User role:', user?.role, 'User ID:', user?.userId)
      
      const response = await fetch(buildApiUrl(`submissions/batch/${batchId}`), {
        headers: {
          'Authorization': `Bearer ${user?.jwtToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('📊 Raw API response:', data)
        console.log('📝 Number of submissions received:', data.data?.length || 0)
        
        const convertedPosts = data.data.map(convertSubmissionToPost)
        console.log('🔄 Converted posts:', convertedPosts)
        setPosts(convertedPosts)
        setError('')
      } else {
        const errorData = await response.json()
        console.error('❌ API Error:', errorData)
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
  const updateSubmissionStatus = async (submissionId: string, status: 'accepted' | 'rejected') => {
    if (user?.role !== 'teacher') return

    try {
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
    }
  }

  /**
   * Delete post (student can delete their own posts)
   */
  const handleDeletePost = async (postId: string) => {
    if (!user) return

    try {
      const response = await fetch(buildApiUrl(`submissions/${postId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.jwtToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        // Remove post from local state
        setPosts(prev => prev.filter(post => post.id !== postId))
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to delete post')
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      setError('Network error. Please try again.')
    }
  }

  /**
   * Edit post - use the passed onEditPost prop with full post data
   */
  const handleEditPost = (postId: string) => {
    if (onEditPost) {
      // Find the post data from the current posts
      const postData = posts.find(post => post.id === postId)
      if (postData) {
        onEditPost(postData)
      } else {
        // Fallback to just passing the ID if post not found
        onEditPost(postId)
      }
    }
  }

  /**
   * Get status badge color and text
   */
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
    }
  }

  /**
   * Render post content based on type
   */
  const renderContent = (post: PostData) => {
    switch (post.content.type) {
      case 'image':
        // Validate image URL - check if it's a valid URL or base64 data
        const imageData = post.content.data
        const isValidUrl = (url: string) => {
          try {
            new URL(url)
            return true
          } catch {
            return false
          }
        }
        
        const isValidBase64 = (str: string) => {
          // Check if it's a base64 data URL
          return str.startsWith('data:image/')
        }
        
        // Use file_url if available, otherwise use content.data if valid
        const imageSrc = post.file_url || (isValidUrl(imageData) || isValidBase64(imageData) ? imageData : null)
        
        return (
          <div className="mt-4 rounded-lg overflow-hidden border border-border max-w-full">
            {imageSrc ? (
              <img
                src={imageSrc}
                alt="Post content"
                className="w-full h-64 object-cover max-w-full"
                onError={(e) => {
                  // Hide image if it fails to load
                  e.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              <div className="w-full h-64 bg-gray-100 flex items-center justify-center max-w-full">
                <div className="text-center text-gray-500">
                  <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                  <p>Image not available</p>
                </div>
              </div>
            )}
          </div>
        )
      case 'code':
        // Create user-friendly language display name
        const getLanguageDisplayName = (languageCode?: string): string => {
          if (!languageCode) return 'Code'
          
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
        
        const displayLanguage = getLanguageDisplayName(post.content.language)
        
        return (
          <div className="mt-4 max-w-full overflow-hidden">
            <CodeSnippet
              title={displayLanguage}
              code={post.content.data}
              language={post.content.language || 'typescript'}
              showLineNumbers={true}
              className="w-full text-xs sm:text-sm max-w-full"
            />
          </div>
        )
      default:
        return (
          <div className="mt-4">
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg overflow-hidden">
              <pre className="whitespace-pre-wrap font-mono text-xs sm:text-sm text-gray-800 break-words overflow-x-auto max-w-full">
                {post.content.data}
              </pre>
            </div>
          </div>
        )
    }
  }

  const filteredPosts = posts.filter(post => 
    filter === 'all' || post.status === filter
  )

  const pendingCount = posts.filter(post => post.status === 'pending').length

  // Show content immediately - no loading delay
  // if (loading) {
  //   return (
  //     <div className="flex items-center justify-center py-8">
  //       <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
  //       <span className="ml-2 text-gray-600">Loading submissions...</span>
  //     </div>
  //   )
  // }

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

  return (
    <div className="space-y-4 w-full max-w-full overflow-hidden">
      {/* Filter Buttons - Mobile Responsive */}
      <div className="flex gap-1 sm:gap-2 flex-wrap mb-4 sm:mb-6">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
          className="text-xs sm:text-sm px-2 sm:px-3"
        >
          All ({posts.length})
        </Button>
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('pending')}
          className="text-xs sm:text-sm px-2 sm:px-3"
        >
          Pending ({posts.filter(p => p.status === 'pending').length})
        </Button>
        <Button
          variant={filter === 'accepted' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('accepted')}
          className="text-xs sm:text-sm px-2 sm:px-3"
        >
          Approved ({posts.filter(p => p.status === 'accepted').length})
        </Button>
        <Button
          variant={filter === 'rejected' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('rejected')}
          className="text-xs sm:text-sm px-2 sm:px-3"
        >
          Rejected ({posts.filter(p => p.status === 'rejected').length})
        </Button>
      </div>

      {/* Posts Feed */}
      <div className="space-y-4">
        {filteredPosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onApprove={() => updateSubmissionStatus(post.id, 'accepted')}
            onReject={() => updateSubmissionStatus(post.id, 'rejected')}
            onDelete={() => handleDeletePost(post.id)}
            onEdit={() => handleEditPost(post.id)}
            renderContent={renderContent}
            getStatusBadge={getStatusBadge}
          />
        ))}
        
        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No posts found for the selected filter.</p>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Individual Post Card Component
 */
interface PostCardProps {
  post: PostData
  onApprove: () => void
  onReject: () => void
  onDelete: () => void
  onEdit: () => void
  renderContent: (post: PostData) => React.ReactNode
  getStatusBadge: (status: string) => React.ReactNode
}

const PostCard: React.FC<PostCardProps> = ({ 
  post, 
  onApprove, 
  onReject, 
  onDelete,
  onEdit,
  renderContent, 
  getStatusBadge 
}) => {
  const { user } = useAuth()

  return (
    <Card className="w-full max-w-full bg-background border-border shadow-sm overflow-hidden">
      <CardHeader className="pb-3 sm:pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
              <AvatarImage 
                src={post.author.avatar} 
                alt={post.author.name}
                className="object-cover"
              />
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
                {post.author.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">{post.author.name}</h3>
              <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                {post.author.rollNumber && (
                  <>
                    <span className="font-medium text-primary">Roll: {post.author.rollNumber}</span>
                    <span className="hidden sm:inline">•</span>
                  </>
                )}
                {post.author.year && (
                  <>
                    <span className="font-medium text-blue-600">{post.author.year}</span>
                    <span className="hidden sm:inline">•</span>
                  </>
                )}
                {post.author.subject && (
                  <>
                    <span className="font-medium text-green-600">{post.author.subject}</span>
                    <span className="hidden sm:inline">•</span>
                  </>
                )}
                <span className="truncate">@{post.author.username}</span>
                <span className="hidden sm:inline">•</span>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span className="hidden sm:inline">{post.timestamp}</span>
                  <span className="sm:hidden">{new Date(post.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
              <h4 className="text-lg font-bold text-black mt-6 mb-0 truncate uppercase">
                {post.practical_name}
              </h4>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <div className="hidden sm:block">
              {getStatusBadge(post.status)}
            </div>
            {/* Three dots menu for post actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 sm:h-9 sm:w-9">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {/* Show edit/delete options for students on their own posts */}
                {user?.role === 'student' && user?.email?.split('@')[0] === post.author.username && (
                  <>
                    <DropdownMenuItem onClick={onEdit}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Post
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onDelete} className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Post
                    </DropdownMenuItem>
                  </>
                )}
                {/* Show approve/reject options for teachers */}
                {user?.role === 'teacher' && post.status === 'pending' && (
                  <>
                    <DropdownMenuItem onClick={onApprove} className="text-green-600">
                      <Check className="h-4 w-4 mr-2" />
                      Approve
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onReject} className="text-red-600">
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Mobile Status Badge */}
        <div className="sm:hidden mb-3">
          {getStatusBadge(post.status)}
        </div>
        
        {renderContent(post)}

        {/* Attachments - Mobile Responsive */}
        {(post.file_url || post.code_sandbox_link) && (
          <div className="mt-4 p-2 sm:p-3 bg-blue-50 rounded-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              {post.file_url && (
                <Button variant="outline" size="sm" className="flex items-center w-full sm:w-auto">
                  <Download className="h-4 w-4 mr-2" />
                  <span className="text-xs sm:text-sm">Download File</span>
                </Button>
              )}
              
              {post.code_sandbox_link && (
                <a
                  href={post.code_sandbox_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-xs sm:text-sm text-blue-700 hover:text-blue-900 transition-colors w-full sm:w-auto"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View Code Sandbox
                </a>
              )}
            </div>
          </div>
        )}

        {/* Removed like, share, bookmark, and approve/reject buttons as per requirements */}
      </CardContent>
    </Card>
  )
}
