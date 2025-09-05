"use client"

import React, { useState } from 'react'
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
  Plus,
  CheckCircle
} from 'lucide-react'
import { buildApiUrl } from '@/utils/api'

/**
 * New Post Modal Component
 * Allows students to create new submissions/posts
 * Includes practical name, content, and file upload options
 */

interface NewPostModalProps {
  isOpen: boolean
  onClose: () => void
  batchId: string
  onPostCreated: () => void
}

export function NewPostModal({ isOpen, onClose, batchId, onPostCreated }: NewPostModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
  
  // Form state
  const [practicalName, setPracticalName] = useState('')
  const [content, setContent] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [codeSandboxLink, setCodeSandboxLink] = useState('')
  const [contentType, setContentType] = useState<'text' | 'code'>('text')
  const [codeLanguage, setCodeLanguage] = useState('typescript')

  /**
   * Handle form submission
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

      // For now, send as JSON since file upload isn't fully implemented
      // TODO: Implement proper file upload with multer middleware
      const requestBody = {
        batchId,
        practicalName: practicalName.trim(),
        content: content.trim(),
        contentType: contentType,
        codeLanguage: contentType === 'code' ? codeLanguage : null,
        codeSandboxLink: codeSandboxLink.trim() || null,
        fileUrl: null // File upload not implemented yet
      }

      const response = await fetch(buildApiUrl('submissions/create'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.jwtToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        // Show success animation
        setShowSuccessAnimation(true)
        
        // Reset form
        setPracticalName('')
        setContent('')
        setFile(null)
        setCodeSandboxLink('')
        setContentType('text')
        setCodeLanguage('typescript')
        
        // Close modal and refresh feed after animation
        setTimeout(() => {
          setShowSuccessAnimation(false)
          onPostCreated()
          onClose()
        }, 2000) // Show animation for 2 seconds
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to create post')
      }
    } catch (error) {
      console.error('Error creating post:', error)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle file selection
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Check file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB')
        return
      }
      setFile(selectedFile)
      setError('')
    }
  }

  /**
   * Reset form when modal closes
   */
  const handleClose = () => {
    setPracticalName('')
    setContent('')
    setFile(null)
    setCodeSandboxLink('')
    setContentType('text')
    setError('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Success Animation Popup - Light Theme with Animation */}
        {showSuccessAnimation && (
          <div className="fixed inset-0 bg-white bg-opacity-90 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 text-center shadow-2xl border border-gray-100 animate-in fade-in-0 zoom-in-95 duration-300">
              {/* Animated Checkmark Icon */}
              <div className="relative mb-6">
                <CheckCircle className="h-20 w-20 text-green-500 mx-auto animate-in zoom-in-0 duration-500 delay-200" />
                {/* Pulsing ring animation */}
                <div className="absolute inset-0 rounded-full border-4 border-green-200 animate-ping opacity-75"></div>
                <div className="absolute inset-0 rounded-full border-2 border-green-300 animate-pulse"></div>
              </div>
              
              {/* Success Message */}
              <h3 className="text-2xl font-bold text-gray-800 mb-3 animate-in slide-in-from-bottom-2 duration-500 delay-300">
                Post Created Successfully!
              </h3>
              <p className="text-gray-600 text-lg animate-in slide-in-from-bottom-2 duration-500 delay-400">
                Your submission has been posted to the batch.
              </p>
              
              {/* Decorative elements */}
              <div className="mt-6 flex justify-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce delay-200"></div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce delay-300"></div>
              </div>
            </div>
          </div>
        )}
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Create New Post
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Share your practical work, code, or assignments with the batch
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-200px)] pr-2">
          <form onSubmit={handleSubmit} className="space-y-6">
          {/* Content Type Selection */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={contentType === 'text' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setContentType('text')}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Text Post
            </Button>
            <Button
              type="button"
              variant={contentType === 'code' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setContentType('code')}
              className="flex items-center gap-2"
            >
              <Code className="h-4 w-4" />
              Code Post
            </Button>
          </div>

          {/* Practical Name */}
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

          {/* Code Sandbox Link field removed as requested */}

          {/* File Upload - Currently Disabled */}
          <div className="space-y-2">
            <label htmlFor="file" className="text-sm font-medium text-gray-700">
              Attach File (Coming Soon)
            </label>
            <div className="flex items-center gap-4">
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.txt,.zip,.rar,.jpg,.jpeg,.png,.gif"
                className="flex-1"
                disabled
              />
              {file && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {file.name}
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-500">
              File upload feature is coming soon. For now, you can share your work through text content and code sandbox links.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !practicalName.trim() || !content.trim()}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create Post
                </>
              )}
            </Button>
          </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
