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

// Interface for student profile data
interface StudentProfile {
  name: string
  email: string
  year: string
  subject: string
  batchName: string
  rollNumber: string
  profilePicture: string
}

/**
 * Student Profile Page
 * Allows students to view and edit their profile information
 * Fields: Name, Email, Year, Subject, Batch Name, Profile Picture
 */
export default function StudentProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<StudentProfile>({
    name: "",
    email: "",
    year: "",
    subject: "",
    batchName: "",
    rollNumber: "",
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
            year: response.data.year || "",
            subject: response.data.subject || "",
            batchName: response.data.batch_name || "",
            rollNumber: response.data.roll_number || "",
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

    // Email validation removed since field is read-only

    if (!profile.year) {
      newErrors.year = "Academic year is required"
    }

    if (!profile.subject.trim()) {
      newErrors.subject = "Subject/Course is required"
    }

    if (!profile.rollNumber.trim()) {
      newErrors.rollNumber = "Roll number is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof StudentProfile, value: string) => {
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
          year: profile.year,
          subject: profile.subject,
          batchName: profile.batchName,
          rollNumber: profile.rollNumber,
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

      // Delete the previous profile picture if it exists
      if (previousProfilePicture && user.jwtToken) {
        try {
          await deleteImage(previousProfilePicture, user.jwtToken)
        } catch (deleteError) {
          console.warn('Could not delete previous profile picture:', deleteError)
          // Continue with upload even if delete fails
        }
      }

      // Upload the new image to backend server
      if (!user.jwtToken) {
        throw new Error('Authentication token not available')
      }
      const downloadURL = await uploadImage(file, user.userId?.toString() || user.uid, 'profile-pictures', user.jwtToken)
      
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

  // Redirect if user is not authenticated or not a student
  if (!user || user.role !== 'student') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>Access denied. Student account required.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <SidebarLayout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">


      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your student profile details below
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

          {/* Form Fields */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Full Name
              </label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter your full name"
                className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                readOnly
                disabled
                placeholder="Email address cannot be changed"
                className="bg-muted text-muted-foreground cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">
                Email address cannot be modified for security reasons
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="year" className="text-sm font-medium">
                Academic Year
              </label>
              <select
                id="year"
                value={profile.year}
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
              <label htmlFor="subject" className="text-sm font-medium">
                Subject/Course
              </label>
              <Input
                id="subject"
                value={profile.subject}
                onChange={(e) => handleInputChange("subject", e.target.value)}
                placeholder="e.g., Computer Science Engineering"
                className={errors.subject ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {errors.subject && (
                <p className="text-sm text-red-600">{errors.subject}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="rollNumber" className="text-sm font-medium">
                Roll Number
              </label>
              <Input
                id="rollNumber"
                value={profile.rollNumber}
                onChange={(e) => handleInputChange("rollNumber", e.target.value)}
                placeholder="e.g., 2024CS001"
                className={errors.rollNumber ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {errors.rollNumber && (
                <p className="text-sm text-red-600">{errors.rollNumber}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="batchName" className="text-sm font-medium">
                Batch Name
              </label>
              <Input
                id="batchName"
                value={profile.batchName}
                onChange={(e) => handleInputChange("batchName", e.target.value)}
                placeholder="e.g., CSE-A-2022"
              />
              <p className="text-xs text-muted-foreground">
                Optional - Leave blank if not part of a specific batch
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
              className="w-full"
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
