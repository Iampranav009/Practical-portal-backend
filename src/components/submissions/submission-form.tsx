"use client"

import React, { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Plus, Upload, X, Loader2 } from 'lucide-react'
import { uploadSubmissionFile, validateFile, formatFileSize } from '@/utils/file-upload'
import { buildApiUrl } from '@/utils/api'

/**
 * Submission Form Component
 * Allows students to create new submissions with text content and optional file
 * Includes file upload functionality and real-time submission posting
 */

interface SubmissionFormProps {
  batchId: string
  onSubmissionCreated: () => void
}

export function SubmissionForm({ batchId, onSubmissionCreated }: SubmissionFormProps) {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [practicalName, setPracticalName] = useState('')
  const [content, setContent] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [codeSandboxLink, setCodeSandboxLink] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Only show to students
  if (!user || user.role !== 'student') {
    return null
  }

  /**
   * Handle file selection and upload
   */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Validate file
    const validationError = validateFile(selectedFile)
    if (validationError) {
      setError(validationError)
      return
    }

    setFile(selectedFile)
    setError('')

    // Upload file immediately
    setIsUploading(true)
    try {
      // Ensure we have a valid JWT token before uploading
      if (!user.jwtToken) {
        throw new Error('Authentication token is not available')
      }
      const result = await uploadSubmissionFile(selectedFile, batchId, user.jwtToken)
      if (result.success && result.url) {
        setFileUrl(result.url)
      } else {
        setError(result.error || 'Failed to upload file')
        setFile(null)
      }
    } catch (error) {
      console.error('File upload error:', error)
      setError('Failed to upload file. Please try again.')
      setFile(null)
    } finally {
      setIsUploading(false)
    }
  }

  /**
   * Remove selected file
   */
  const removeFile = () => {
    setFile(null)
    setFileUrl(null)
    // Reset the file input
    const fileInput = document.getElementById('file-upload') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  /**
   * Submit the new submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!practicalName.trim()) {
      setError('Practical name is required')
      return
    }

    if (!content.trim()) {
      setError('Content is required')
      return
    }

    setIsSubmitting(true)

    try {
      // Use the already uploaded file URL
      const finalFileUrl = fileUrl || null

      const response = await fetch(buildApiUrl('submissions/create'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.jwtToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          batchId,
          practicalName: practicalName.trim(),
          content: content.trim(),
          fileUrl: finalFileUrl,
          codeSandboxLink: codeSandboxLink.trim() || null
        })
      })

      if (response.ok) {
        // Reset form
        setPracticalName('')
        setContent('')
        setFile(null)
        setFileUrl(null)
        setCodeSandboxLink('')
        setIsOpen(false)
        onSubmissionCreated()
        
        // Show success message briefly
        setError('')
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to create submission')
      }
    } catch (error) {
      console.error('Error creating submission:', error)
      setError('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) {
    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          <Button
            onClick={() => setIsOpen(true)}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Post New Submission
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Create Submission</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
        <CardDescription>
          Share your practical work, code, or project with your batch
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Practical Name Input */}
          <div>
            <label htmlFor="practical-name" className="block text-sm font-medium mb-2">
              Practical Name *
            </label>
            <Input
              id="practical-name"
              value={practicalName}
              onChange={(e) => setPracticalName(e.target.value)}
              placeholder="e.g. Practical 5: Sorting Algorithms"
              className="w-full"
              disabled={isSubmitting}
            />
          </div>

          {/* Content Input */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium mb-2">
              Content / Code / Description *
            </label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Describe your practical work, paste your code, or share your findings..."
              rows={6}
              className="w-full resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* File Upload */}
          <div>
            <label htmlFor="file-upload" className="block text-sm font-medium mb-2">
              Attach File (Optional)
            </label>
            <div className="space-y-3">
              <Input
                id="file-upload"
                type="file"
                onChange={handleFileChange}
                accept="image/*,.pdf,.doc,.docx,.txt,.py,.js,.html,.css"
                className="cursor-pointer"
                disabled={isSubmitting}
              />
              
              {file && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 text-blue-500 mr-2 animate-spin" />
                    ) : fileUrl ? (
                      <Upload className="h-4 w-4 text-green-500 mr-2" />
                    ) : (
                      <Upload className="h-4 w-4 text-gray-500 mr-2" />
                    )}
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({formatFileSize(file.size)})
                    </span>
                    {isUploading && (
                      <span className="text-xs text-blue-500 ml-2">Uploading...</span>
                    )}
                    {fileUrl && !isUploading && (
                      <span className="text-xs text-green-500 ml-2">✓ Uploaded</span>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                    disabled={isUploading || isSubmitting}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Code Sandbox Link Input */}
          <div>
            <label htmlFor="code-sandbox" className="block text-sm font-medium mb-2">
              Code Sandbox Link (Optional)
            </label>
            <Input
              id="code-sandbox"
              type="url"
              value={codeSandboxLink}
              onChange={(e) => setCodeSandboxLink(e.target.value)}
              placeholder="https://codesandbox.io/s/your-project-id"
              className="w-full"
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              Share your live code examples from CodeSandbox, CodePen, or similar platforms
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !practicalName.trim() || !content.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Post Submission
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
