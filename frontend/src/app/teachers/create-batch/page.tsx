"use client"

import React, { useState, useRef } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { buildApiUrl } from '@/utils/api'
import { SidebarLayout } from '@/components/layout/sidebar-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Users, 
  School, 
  FileText, 
  Lock,
  Image as ImageIcon,
  Loader2,
  Upload,
  X
} from 'lucide-react'

/**
 * Teacher Create Batch Page
 * Form for teachers to create new batches/classrooms
 * Includes batch name, college, description, password, and optional profile image
 */

// Interface for batch creation form data
interface BatchFormData {
  name: string
  collegeName: string
  description: string
  password: string
  iconImage: string
  coverImage: string
}

export default function CreateBatchPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Form state management
  const [formData, setFormData] = useState<BatchFormData>({
    name: '',
    collegeName: '',
    description: '',
    password: '',
    iconImage: '',
    coverImage: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [selectedIconImage, setSelectedIconImage] = useState<File | null>(null)
  const [selectedCoverImage, setSelectedCoverImage] = useState<File | null>(null)
  const [iconImagePreview, setIconImagePreview] = useState<string>('')
  const [coverImagePreview, setCoverImagePreview] = useState<string>('')

  // Redirect if not teacher or not authenticated
  React.useEffect(() => {
    if (!loading && (!user || user.role !== 'teacher')) {
      router.push('/auth/login')
      return
    }
  }, [user, loading, router])

  /**
   * Handle form input changes
   */
  const handleInputChange = (field: keyof BatchFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear messages when user starts typing
    if (errorMessage) setErrorMessage('')
    if (successMessage) setSuccessMessage('')
  }

  /**
   * Handle icon image file selection
   */
  const handleIconImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Please select a valid image file')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Image size must be less than 5MB')
        return
      }
      
      setSelectedIconImage(file)
      
      // Create preview URL
      const reader = new FileReader()
      reader.onload = (e) => {
        setIconImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      
      // Clear error messages
      setErrorMessage('')
    }
  }

  /**
   * Handle cover image file selection
   */
  const handleCoverImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Please select a valid image file')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Image size must be less than 5MB')
        return
      }
      
      setSelectedCoverImage(file)
      
      // Create preview URL
      const reader = new FileReader()
      reader.onload = (e) => {
        setCoverImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      
      // Clear error messages
      setErrorMessage('')
    }
  }

  /**
   * Remove selected icon image
   */
  const removeIconImage = () => {
    setSelectedIconImage(null)
    setIconImagePreview('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  /**
   * Remove selected cover image
   */
  const removeCoverImage = () => {
    setSelectedCoverImage(null)
    setCoverImagePreview('')
  }

  /**
   * Convert image to base64 for storage
   */
  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // Validate that the base64 string is not too large (max 16MB when base64 encoded)
        if (result.length > 16 * 1024 * 1024) {
          reject(new Error('Image is too large. Please choose a smaller image.'))
          return
        }
        resolve(result)
      }
      reader.onerror = () => reject(new Error('Failed to read image file'))
      reader.readAsDataURL(file)
    })
  }

  /**
   * Validate form data before submission
   */
  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setErrorMessage('Batch name is required')
      return false
    }
    if (!formData.collegeName.trim()) {
      setErrorMessage('College name is required')
      return false
    }
    if (!formData.password.trim()) {
      setErrorMessage('Batch password is required')
      return false
    }
    if (formData.password.length < 4) {
      setErrorMessage('Password must be at least 4 characters long')
      return false
    }
    return true
  }

  /**
   * Handle form submission to create batch
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    setErrorMessage('')
    
    try {
      // Convert images to base64 if selected
      let iconImageData = formData.iconImage.trim()
      let coverImageData = formData.coverImage.trim()
      
      if (selectedIconImage) {
        iconImageData = await convertImageToBase64(selectedIconImage)
      }
      if (selectedCoverImage) {
        coverImageData = await convertImageToBase64(selectedCoverImage)
      }

      const response = await fetch(buildApiUrl('batches/create'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.jwtToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          collegeName: formData.collegeName.trim(),
          description: formData.description.trim(),
          password: formData.password,
          iconImage: iconImageData,
          coverImage: coverImageData
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccessMessage(`Batch "${formData.name}" created successfully!`)
        
        // Redirect to teacher dashboard after a short delay
        setTimeout(() => {
          router.push('/teachers/dashboard')
        }, 2000)
      } else {
        setErrorMessage(data.message || 'Failed to create batch')
      }
    } catch (error) {
      console.error('Create batch error:', error)
      setErrorMessage('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <SidebarLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Create New Batch</h1>
              <p className="text-muted-foreground mt-2">Set up a new classroom for your students</p>
            </div>
            <Button
              onClick={() => router.back()}
              variant="outline"
            >
              Back
            </Button>
          </div>
        </div>

        <Card className="card-light">
            <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Batch Information
            </CardTitle>
            <CardDescription>
              Provide the basic information for your new batch. Students will use the batch password to join.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Batch Name */}
              <div className="space-y-2">
                <label htmlFor="batchName" className="text-sm font-medium text-foreground flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Batch Name *
                </label>
                <Input
                  id="batchName"
                  type="text"
                  placeholder="e.g., Computer Science 2024, Physics Class A"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full"
                  disabled={isSubmitting}
                />
              </div>

              {/* College Name */}
              <div className="space-y-2">
                <label htmlFor="collegeName" className="text-sm font-medium text-foreground flex items-center">
                  <School className="h-4 w-4 mr-2" />
                  College/Institution Name *
                </label>
                <Input
                  id="collegeName"
                  type="text"
                  placeholder="e.g., MIT, Stanford University, ABC College"
                  value={formData.collegeName}
                  onChange={(e) => handleInputChange('collegeName', e.target.value)}
                  className="w-full"
                  disabled={isSubmitting}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium text-foreground flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Description (Optional)
                </label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the batch, course content, or objectives..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full min-h-[100px]"
                  disabled={isSubmitting}
                />
              </div>

              {/* Batch Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground flex items-center">
                  <Lock className="h-4 w-4 mr-2" />
                  Batch Password *
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Secure password for students to join this batch"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  Students will need this password to join your batch. Choose something memorable but secure.
                </p>
              </div>

              {/* Batch Icon Image Upload (Optional) */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center">
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Batch Icon (Optional)
                </label>
                <p className="text-xs text-muted-foreground mb-3">
                  Small square image that will be used as the batch avatar/icon
                </p>
                
                {/* Icon Image Upload Area */}
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                  {iconImagePreview ? (
                    // Icon Image Preview
                    <div className="relative inline-block">
                      <img
                        src={iconImagePreview}
                        alt="Batch icon preview"
                        className="w-20 h-20 rounded-lg object-cover mx-auto"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={removeIconImage}
                        className="absolute -top-2 -right-2"
                        disabled={isSubmitting}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    // Upload Area
                    <div>
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-1">Upload batch icon</p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG, GIF up to 5MB
                      </p>
                    </div>
                  )}
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleIconImageSelect}
                    className="hidden"
                    disabled={isSubmitting}
                    aria-label="Upload batch icon"
                    title="Upload batch icon"
                  />
                  
                  {!iconImagePreview && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSubmitting}
                      className="mt-3"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Icon
                    </Button>
                  )}
                </div>
                
                {/* Alternative Icon URL Input */}
                <div className="pt-3 border-t">
                  <label htmlFor="iconImageUrl" className="text-sm font-medium text-foreground mb-2 block">
                    Or provide icon URL
                  </label>
                  <Input
                    id="iconImageUrl"
                    type="url"
                    placeholder="https://example.com/batch-icon.jpg"
                    value={formData.iconImage}
                    onChange={(e) => handleInputChange('iconImage', e.target.value)}
                    className="w-full"
                    disabled={isSubmitting || !!selectedIconImage}
                  />
                </div>
              </div>

              {/* Batch Cover Image Upload (Optional) */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center">
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Batch Cover Image (Optional)
                </label>
                <p className="text-xs text-muted-foreground mb-3">
                  Wide banner image that will be displayed as the batch cover
                </p>
                
                {/* Cover Image Upload Area */}
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  {coverImagePreview ? (
                    // Cover Image Preview
                    <div className="relative">
                      <img
                        src={coverImagePreview}
                        alt="Batch cover preview"
                        className="mx-auto max-h-48 rounded-lg object-cover w-full"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={removeCoverImage}
                        className="absolute top-2 right-2"
                        disabled={isSubmitting}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    // Upload Area
                    <div>
                      <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-2">Upload batch cover image</p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG, GIF up to 5MB
                      </p>
                    </div>
                  )}
                  
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverImageSelect}
                    className="hidden"
                    disabled={isSubmitting}
                    aria-label="Upload batch cover"
                    title="Upload batch cover"
                    id="coverImageInput"
                  />
                  
                  {!coverImagePreview && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('coverImageInput')?.click()}
                      disabled={isSubmitting}
                      className="mt-4"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Cover Image
                    </Button>
                  )}
                </div>
                
                {/* Alternative Cover URL Input */}
                <div className="pt-4 border-t">
                  <label htmlFor="coverImageUrl" className="text-sm font-medium text-foreground mb-2 block">
                    Or provide cover image URL
                  </label>
                  <Input
                    id="coverImageUrl"
                    type="url"
                    placeholder="https://example.com/batch-cover.jpg"
                    value={formData.coverImage}
                    onChange={(e) => handleInputChange('coverImage', e.target.value)}
                    className="w-full"
                    disabled={isSubmitting || !!selectedCoverImage}
                  />
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{errorMessage}</p>
                </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-600">{successMessage}</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Batch...
                    </>
                  ) : (
                    <>
                      <Users className="h-4 w-4 mr-2" />
                      Create Batch
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  )
}
