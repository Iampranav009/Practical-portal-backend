"use client"

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  Image as ImageIcon, 
  Code, 
  FileText, 
  Upload,
  Loader2,
  Save
} from 'lucide-react'
import { buildApiUrl } from '@/utils/api'

/**
 * Edit Post Modal Component
 * Allows students to edit their existing posts
 * Based on NewPostModal but with pre-filled data and edit-specific functionality
 */

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
  content: {
    type: 'text' | 'image' | 'code'
    data: string
    language?: string
  }
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

interface EditPostModalProps {
  isOpen: boolean
  onClose: () => void
  post: PostData
  batchId: string
  onPostUpdated: () => void
}

export function EditPostModal({ isOpen, onClose, post, batchId, onPostUpdated }: EditPostModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [loadingPost, setLoadingPost] = useState(false)
  const [error, setError] = useState('')
  
  // Form state - initialized with post data
  const [practicalName, setPracticalName] = useState('')
  const [content, setContent] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [codeSandboxLink, setCodeSandboxLink] = useState('')
  const [contentType, setContentType] = useState<'text' | 'code'>('text')
  const [codeLanguage, setCodeLanguage] = useState('typescript')

  // Initialize form with post data when modal opens
  useEffect(() => {
    if (isOpen && post) {
      // Initialize form with existing post data
      setPracticalName(post.practical_name || '')
      setContent(post.content.data || '')
      setContentType(post.content.type === 'code' ? 'code' : 'text')
      setCodeLanguage(post.content.language || 'typescript')
      setFileUrl(post.file_url || null)
      setCodeSandboxLink(post.code_sandbox_link || '')
    }
  }, [isOpen, post])

  /**
   * Fetch complete post data for editing
   */
  const fetchPostData = async (postId: string) => {
    try {
      setLoadingPost(true)
      setError('')
      
      const response = await fetch(buildApiUrl(`submissions/${postId}`), {
        headers: {
          'Authorization': `Bearer ${user?.jwtToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const responseData = await response.json()
        const postData = responseData.data || responseData // Handle both formats
        
        // Set form fields with fetched data
        setPracticalName(postData.practicalName || postData.practical_name || '')
        setContent(postData.content || '')
        setCodeSandboxLink(postData.codeSandboxLink || postData.code_sandbox_link || '')
        setFileUrl(postData.fileUrl || postData.file_url || null)
        
        // Set the stored code language if it exists
        const storedLanguage = postData.codeLanguage || postData.code_language
        if (storedLanguage) {
          setCodeLanguage(storedLanguage)
        }
        
        // Determine content type based on post data
        // If there's a stored language or code sandbox link, it's definitely code
        if (storedLanguage || postData.codeSandboxLink || postData.code_sandbox_link) {
          setContentType('code')
        } else if (postData.content && (
          postData.content.includes('function') ||
          postData.content.includes('const ') ||
          postData.content.includes('let ') ||
          postData.content.includes('var ') ||
          postData.content.includes('class ') ||
          postData.content.includes('import ') ||
          postData.content.includes('def ') ||
          postData.content.includes('public ') ||
          postData.content.includes('private ')
        )) {
          setContentType('code')
          // Only auto-detect language if no stored language exists
          if (!storedLanguage) {
            if (postData.content.includes('def ') || postData.content.includes('import ')) {
              setCodeLanguage('python')
            } else if (postData.content.includes('public ') || postData.content.includes('private ')) {
              setCodeLanguage('java')
            } else if (postData.content.includes('const ') || postData.content.includes('let ')) {
              setCodeLanguage('javascript')
            } else {
              setCodeLanguage('typescript')
            }
          }
        } else {
          setContentType('text')
        }
      } else {
        setError('Failed to load post data for editing')
      }
    } catch (error) {
      console.error('Error fetching post data:', error)
      setError('Network error while loading post data')
    } finally {
      setLoadingPost(false)
    }
  }

  /**
   * Handle form submission for editing
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!practicalName.trim() || !content.trim()) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      setError('')

      const requestBody = {
        batchId,
        practicalName: practicalName.trim(),
        content: content.trim(),
        contentType: contentType,
        codeLanguage: contentType === 'code' ? codeLanguage : null,
        codeSandboxLink: codeSandboxLink.trim() || null,
        fileUrl: fileUrl || null // Include file URL if uploaded
      }

      const response = await fetch(buildApiUrl(`submissions/${post.id}/edit`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user?.jwtToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        // Close modal and refresh feed
        onPostUpdated()
        onClose()
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to update post')
      }
    } catch (error) {
      console.error('Error updating post:', error)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle file selection
   */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Edit Post
          </DialogTitle>
          <DialogDescription>
            Update your post practical name, content, code, or attachments. All fields are editable.
          </DialogDescription>
        </DialogHeader>

        {loadingPost ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading post data...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
          {/* Content Type Selection - Mobile Responsive */}
          <div className="flex gap-1 sm:gap-2">
            <Button
              type="button"
              variant={contentType === 'text' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setContentType('text')}
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
            >
              <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Text Post</span>
              <span className="sm:hidden">Text</span>
            </Button>
            <Button
              type="button"
              variant={contentType === 'code' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setContentType('code')}
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
            >
              <Code className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Code Post</span>
              <span className="sm:hidden">Code</span>
            </Button>
          </div>

          {/* Practical Name - Editable */}
          <div className="space-y-2">
            <label htmlFor="practicalName" className="text-sm font-medium text-gray-700">
              Practical Name *
            </label>
            <Input
              id="practicalName"
              type="text"
              placeholder="e.g., Data Structures Lab 1, Web Development Assignment"
              value={practicalName}
              onChange={(e) => setPracticalName(e.target.value)}
              required
              className="w-full"
            />
            <p className="text-xs text-gray-500">Update the practical name for your post.</p>
          </div>

          {/* Language Selection for Code Posts */}
          {contentType === 'code' && (
            <div className="space-y-2">
              <label htmlFor="codeLanguage" className="text-sm font-medium text-gray-700">
                Programming Language
              </label>
              <select
                id="codeLanguage"
                value={codeLanguage}
                onChange={(e) => setCodeLanguage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="typescript">TypeScript</option>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="c">C</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="sql">SQL</option>
                <option value="bash">Bash</option>
                <option value="json">JSON</option>
                <option value="xml">XML</option>
                <option value="markdown">Markdown</option>
                <option value="text">Plain Text</option>
              </select>
            </div>
          )}

          {/* Content */}
          <div className="space-y-2">
            <label htmlFor="content" className="text-sm font-medium text-gray-700">
              {contentType === 'code' ? 'Code/Description *' : 'Content *'}
            </label>
            <Textarea
              id="content"
              placeholder={
                contentType === 'code' 
                  ? "Paste your code here or describe your implementation..."
                  : "Describe your practical work, findings, or any notes..."
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              className="min-h-32 resize-none font-mono"
            />
          </div>

          {/* Code Sandbox Link */}
          {contentType === 'code' && (
            <div className="space-y-2">
              <label htmlFor="codeSandboxLink" className="text-sm font-medium text-gray-700">
                Code Sandbox Link (Optional)
              </label>
              <Input
                id="codeSandboxLink"
                type="url"
                placeholder="https://codesandbox.io/..."
                value={codeSandboxLink}
                onChange={(e) => setCodeSandboxLink(e.target.value)}
                className="w-full"
              />
            </div>
          )}

          {/* File Upload - Currently Disabled */}
          <div className="space-y-2">
            <label htmlFor="file" className="text-sm font-medium text-gray-700">
              Attach File (Coming Soon)
            </label>
            <div className="flex items-center gap-4">
              <Input
                id="file"
                type="file"
                accept="image/*,.pdf,.doc,.docx,.txt"
                onChange={handleFileSelect}
                disabled
                className="flex-1"
              />
              <Badge variant="secondary" className="text-xs">
                Disabled
              </Badge>
            </div>
            <p className="text-xs text-gray-500">
              File upload functionality will be available in a future update.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Action Buttons - Mobile Responsive */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Post
                </>
              )}
            </Button>
          </div>
        </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
