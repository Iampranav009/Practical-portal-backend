"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import { Camera, Save, User, AlertCircle, CheckCircle, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/contexts/auth-context"
import { apiCall } from "@/utils/api"
import { uploadImage, deleteImage, validateImageFile } from "@/utils/image-upload"

// Interface for profile setup data
interface ProfileSetupData {
  name: string
  collegeName?: string // For teachers
  contactNumber?: string // For teachers
  year?: string // For students
  subject?: string // For students
  batchName?: string // For students
  rollNumber?: string // For students
  profilePicture: string
}

interface ProfileSetupModalProps {
  isOpen: boolean
  onComplete: () => void
  userRole: 'teacher' | 'student'
}

/**
 * Profile Setup Modal Component
 * Displays a modal for new users to complete their profile setup
 * Different fields shown based on user role (teacher/student)
 * Prevents access to main app until profile is completed
 */
export function ProfileSetupModal({ isOpen, onComplete, userRole }: ProfileSetupModalProps) {
  const { user } = useAuth()
  const [profileData, setProfileData] = useState<ProfileSetupData>({
    name: "",
    collegeName: "",
    contactNumber: "",
    year: "",
    subject: "",
    batchName: "",
    rollNumber: "",
    profilePicture: ""
  })
  const [loading, setLoading] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [previousProfilePicture, setPreviousProfilePicture] = useState("")

  // Initialize profile data with user's basic info
  useEffect(() => {
    if (user) {
      setProfileData(prev => ({
        ...prev,
        name: user.displayName || user.email?.split('@')[0] || "",
        profilePicture: user.photoURL || ""
      }))
    }
  }, [user])

  // Validate form fields based on user role
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Common validation
    if (!profileData.name.trim()) {
      newErrors.name = "Name is required"
    } else if (profileData.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters"
    }

    // Role-specific validation
    if (userRole === 'teacher') {
      if (!profileData.collegeName?.trim()) {
        newErrors.collegeName = "College name is required"
      }
      if (profileData.contactNumber && !/^[\+]?[1-9][\d]{0,15}$/.test(profileData.contactNumber)) {
        newErrors.contactNumber = "Please enter a valid contact number"
      }
    } else {
      if (!profileData.year) {
        newErrors.year = "Academic year is required"
      }
      if (!profileData.subject?.trim()) {
        newErrors.subject = "Subject/Course is required"
      }
      if (!profileData.rollNumber?.trim()) {
        newErrors.rollNumber = "Roll number is required"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof ProfileSetupData, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    try {
      setUploadLoading(true)
      setMessage("")

      // Validate the image file
      validateImageFile(file)

      // Upload the new image to backend server
      const userId = user.userId?.toString() || user.uid
      if (!userId) {
        throw new Error('User ID is not available')
      }
      if (!user.jwtToken) {
        throw new Error('Authentication token is not available')
      }
      
      const downloadURL = await uploadImage(file, userId, 'profile-pictures', user.jwtToken)
      
      // Delete the previous profile picture if it exists
      if (previousProfilePicture) {
        try {
          await deleteImage(previousProfilePicture, user.jwtToken)
        } catch (deleteError) {
          console.warn('Could not delete previous profile picture:', deleteError)
        }
      }
      
      // Update the profile state with the new image URL
      setProfileData(prev => ({ ...prev, profilePicture: downloadURL }))
      setPreviousProfilePicture(downloadURL)
      
      setMessage("Profile picture uploaded successfully!")

    } catch (error) {
      console.error('Error uploading profile picture:', error)
      if (error instanceof Error) {
        setMessage(`Failed to upload image: ${error.message}`)
      } else {
        setMessage("Failed to upload profile picture. Please try again.")
      }
    } finally {
      setUploadLoading(false)
    }
  }

  const handleSave = async () => {
    if (!validateForm()) {
      setMessage("Please fix the errors below")
      return
    }

    if (!user) {
      setMessage("You must be logged in to complete profile setup")
      return
    }

    setLoading(true)
    setMessage("")

    try {
      // Prepare data based on user role
      const updateData = {
        name: profileData.name,
        profilePictureUrl: profileData.profilePicture
      }

      if (userRole === 'teacher') {
        Object.assign(updateData, {
          collegeName: profileData.collegeName,
          contactNumber: profileData.contactNumber
        })
      } else {
        Object.assign(updateData, {
          year: profileData.year,
          subject: profileData.subject,
          batchName: profileData.batchName,
          rollNumber: profileData.rollNumber
        })
      }

      const response = await apiCall('profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.jwtToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      if (response.success) {
        setMessage("Profile setup completed successfully!")
        // Close modal after a short delay to show success message
        setTimeout(() => {
          onComplete()
        }, 1500)
      } else {
        setMessage(response.message || "Failed to complete profile setup")
      }
    } catch (error) {
      console.error('Error completing profile setup:', error)
      setMessage("Failed to complete profile setup. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Complete Your Profile Setup
          </DialogTitle>
          <DialogDescription className="text-center">
            {userRole === 'teacher' 
              ? "Set up your teaching profile to get started with the platform"
              : "Set up your student profile to join batches and submit practicals"
            }
          </DialogDescription>
        </DialogHeader>

        <Card className="border-0 shadow-none">
          <CardContent className="space-y-6 p-0">
            {/* Profile Picture Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  {uploadLoading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  ) : profileData.profilePicture ? (
                    <Image
                      src={profileData.profilePicture}
                      alt="Profile"
                      width={96}
                      height={96}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
                <label 
                  htmlFor="profile-picture-setup" 
                  className={`absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 ${
                    uploadLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                  }`}
                >
                  <Camera className="h-4 w-4" />
                </label>
                <input
                  id="profile-picture-setup"
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleProfilePictureChange}
                  disabled={uploadLoading}
                  className="hidden"
                  aria-label="Upload profile picture"
                />
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Click the camera icon to upload a profile picture
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports JPEG, PNG, GIF, WebP (max 5MB)
                </p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 gap-4">
              {/* Name Field - Common for both roles */}
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-foreground">
                  Full Name *
                </label>
                <Input
                  id="name"
                  value={profileData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter your full name"
                  className={`h-10 ${errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Teacher-specific fields */}
              {userRole === 'teacher' && (
                <>
                  <div className="space-y-2">
                    <label htmlFor="collegeName" className="text-sm font-medium text-foreground">
                      College/Institution Name *
                    </label>
                    <Input
                      id="collegeName"
                      value={profileData.collegeName || ""}
                      onChange={(e) => handleInputChange("collegeName", e.target.value)}
                      placeholder="Enter your college/institution name"
                      className={`h-10 ${errors.collegeName ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    />
                    {errors.collegeName && (
                      <p className="text-sm text-red-600">{errors.collegeName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="contactNumber" className="text-sm font-medium text-foreground">
                      Contact Number
                    </label>
                    <Input
                      id="contactNumber"
                      type="tel"
                      value={profileData.contactNumber || ""}
                      onChange={(e) => handleInputChange("contactNumber", e.target.value)}
                      placeholder="Enter your contact number (optional)"
                      className={`h-10 ${errors.contactNumber ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    />
                    {errors.contactNumber && (
                      <p className="text-sm text-red-600">{errors.contactNumber}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Include country code if international (e.g., +91 for India)
                    </p>
                  </div>
                </>
              )}

              {/* Student-specific fields */}
              {userRole === 'student' && (
                <>
                  <div className="space-y-2">
                    <label htmlFor="year" className="text-sm font-medium text-foreground">
                      Academic Year *
                    </label>
                    <select
                      id="year"
                      value={profileData.year || ""}
                      onChange={(e) => handleInputChange("year", e.target.value)}
                      className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                        errors.year 
                          ? "border-red-500 focus-visible:ring-red-500" 
                          : "border-input bg-background focus-visible:ring-ring"
                      }`}
                    >
                      <option value="">Select your year</option>
                      <option value="First Year">First Year</option>
                      <option value="Second Year">Second Year</option>
                      <option value="Third Year">Third Year</option>
                      <option value="Fourth Year">Fourth Year</option>
                    </select>
                    {errors.year && (
                      <p className="text-sm text-red-600">{errors.year}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="subject" className="text-sm font-medium text-foreground">
                      Subject/Course *
                    </label>
                    <Input
                      id="subject"
                      value={profileData.subject || ""}
                      onChange={(e) => handleInputChange("subject", e.target.value)}
                      placeholder="e.g., Computer Science Engineering"
                      className={`h-10 ${errors.subject ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    />
                    {errors.subject && (
                      <p className="text-sm text-red-600">{errors.subject}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="rollNumber" className="text-sm font-medium text-foreground">
                      Roll Number *
                    </label>
                    <Input
                      id="rollNumber"
                      value={profileData.rollNumber || ""}
                      onChange={(e) => handleInputChange("rollNumber", e.target.value)}
                      placeholder="e.g., 2024CS001"
                      className={`h-10 ${errors.rollNumber ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    />
                    {errors.rollNumber && (
                      <p className="text-sm text-red-600">{errors.rollNumber}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="batchName" className="text-sm font-medium text-foreground">
                      Batch Name
                    </label>
                    <Input
                      id="batchName"
                      value={profileData.batchName || ""}
                      onChange={(e) => handleInputChange("batchName", e.target.value)}
                      placeholder="e.g., CSE-A-2022"
                    />
                    <p className="text-xs text-muted-foreground">
                      Optional - Leave blank if not part of a specific batch
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Message Display */}
            {message && (
              <div className={`text-sm text-center p-3 rounded-md ${
                message.includes("successfully") 
                  ? "bg-green-50 text-green-700 border border-green-200" 
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}>
                {message}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                onClick={handleSave} 
                disabled={loading || uploadLoading}
                className="flex-1 h-11 text-base font-medium"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Setting up...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete Setup
                  </>
                )}
              </Button>
            </div>

            {/* Help Text */}
            <div className="text-center text-sm text-muted-foreground">
              <p>
                {userRole === 'teacher' 
                  ? "You'll be able to create and manage batches after completing your profile"
                  : "You'll be able to join batches and submit practicals after completing your profile"
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
