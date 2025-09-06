"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Camera, Save, User, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarLayout } from "@/components/layout/sidebar-layout"
import { useAuth } from "@/contexts/auth-context"
import { apiCall } from "@/utils/api"
import { uploadImage, deleteImage, validateImageFile } from "@/utils/image-upload"

// Interface for teacher profile data
interface TeacherProfile {
  name: string
  email: string
  collegeName: string
  contactNumber: string
  profilePicture: string
}

/**
 * Teacher Profile Page
 * Allows teachers to view and edit their profile information
 * Fields: Name, Email (read-only), College Name, Contact Number, Profile Picture
 */
export default function TeacherProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<TeacherProfile>({
    name: "",
    email: "",
    collegeName: "",
    contactNumber: "",
    profilePicture: ""
  })
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [previousProfilePicture, setPreviousProfilePicture] = useState("")

  // Load profile data on component mount
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return

      try {
        setFetchLoading(true)
        const response = await apiCall('profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${user.jwtToken}`
          }
        })

        if (response.success) {
          const profileData = {
            name: response.data.name || "",
            email: response.data.email || "",
            collegeName: response.data.college_name || "",
            contactNumber: response.data.contact_number || "",
            profilePicture: response.data.profile_picture_url || ""
          }
          setProfile(profileData)
          setPreviousProfilePicture(profileData.profilePicture)
        }
      } catch (error) {
        console.error('Error loading profile:', error)
        setMessage("Failed to load profile data")
      } finally {
        setFetchLoading(false)
      }
    }

    loadProfile()
  }, [user])

  // Validate form fields
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!profile.name.trim()) {
      newErrors.name = "Name is required"
    } else if (profile.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters"
    }

    if (!profile.collegeName.trim()) {
      newErrors.collegeName = "College name is required"
    }

    if (profile.contactNumber && !/^[\+]?[1-9][\d]{0,15}$/.test(profile.contactNumber)) {
      newErrors.contactNumber = "Please enter a valid contact number"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof TeacherProfile, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const handleSave = async () => {
    if (!validateForm()) {
      setMessage("Please fix the errors below")
      return
    }

    if (!user) {
      setMessage("You must be logged in to update your profile")
      return
    }

    setLoading(true)
    setMessage("")

    try {
      const response = await apiCall('profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.jwtToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: profile.name,
          collegeName: profile.collegeName,
          contactNumber: profile.contactNumber,
          profilePictureUrl: profile.profilePicture
        })
      })

      if (response.success) {
        setMessage("Profile updated successfully!")
      } else {
        setMessage(response.message || "Failed to update profile")
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      setMessage("Failed to update profile. Please try again.")
    } finally {
      setLoading(false)
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
      // Ensure we have a valid userId - use user.uid as fallback since it's always available from Firebase
      const userId = user.userId?.toString() || user.uid
      if (!userId) {
        throw new Error('User ID is not available')
      }
      // Ensure we have a valid JWT token
      if (!user.jwtToken) {
        throw new Error('Authentication token is not available')
      }
      const downloadURL = await uploadImage(file, userId, 'profile-pictures', user.jwtToken)
      
      // Delete the previous profile picture if it exists (after successful upload)
      if (previousProfilePicture) {
        try {
          await deleteImage(previousProfilePicture, user.jwtToken)
        } catch (deleteError) {
          console.warn('Could not delete previous profile picture:', deleteError)
          // Continue even if delete fails
        }
      }
      
      // Update the profile state with the new image URL
      setProfile(prev => ({ ...prev, profilePicture: downloadURL }))
      setPreviousProfilePicture(downloadURL)
      
      setMessage("Profile picture uploaded successfully! Remember to save your profile.")

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

  // Show loading spinner while fetching profile
  if (fetchLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  // Redirect if user is not authenticated or not a teacher
  if (!user || user.role !== 'teacher') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>Access denied. Teacher account required.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <SidebarLayout>
      <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8 max-w-2xl">
        {/* Mobile-optimized header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Teacher Profile
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base mt-1">
            Manage your teaching profile and personal information
          </p>
        </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your teaching profile details below
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Picture Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {uploadLoading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                ) : profile.profilePicture ? (
                  <Image
                    src={profile.profilePicture}
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
                htmlFor="profile-picture" 
                className={`absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 ${
                  uploadLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                }`}
              >
                <Camera className="h-4 w-4" />
              </label>
              <input
                id="profile-picture"
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
                Click the camera icon to upload a new profile picture
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports JPEG, PNG, GIF, WebP (max 5MB)
              </p>
            </div>
          </div>

          {/* Form Fields - Mobile-optimized */}
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-foreground">
                Full Name
              </label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter your full name"
                className={`h-10 ${errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                disabled
                placeholder="Email address (cannot be changed)"
                className="h-10 bg-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">
                Email address cannot be changed for security reasons
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="collegeName" className="text-sm font-medium text-foreground">
                College Name
              </label>
              <Input
                id="collegeName"
                value={profile.collegeName}
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
                value={profile.contactNumber}
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
          </div>

          {/* Save Button and Message */}
          <div className="space-y-4">
            {message && (
              <div className={`text-sm text-center p-3 rounded-md ${
                message.includes("successfully") 
                  ? "bg-green-50 text-green-700 border border-green-200" 
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}>
                {message}
              </div>
            )}
            
            <Button 
              onClick={handleSave} 
              disabled={loading || fetchLoading || uploadLoading}
              className="w-full h-11 text-base font-medium"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Saving..." : uploadLoading ? "Uploading..." : "Save Profile"}
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </SidebarLayout>
  )
}
