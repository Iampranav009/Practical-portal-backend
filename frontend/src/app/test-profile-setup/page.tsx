"use client"

import React, { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProfileSetupModal } from "@/components/auth/profile-setup-modal"
import { CheckCircle, XCircle, User, AlertCircle } from "lucide-react"

/**
 * Test Profile Setup Page
 * A test page to verify the profile setup flow works correctly
 * Shows current profile completion status and allows testing the setup modal
 */
export default function TestProfileSetupPage() {
  const { user, loading, checkProfileCompletion, refreshUserProfile } = useAuth()
  const [showSetupModal, setShowSetupModal] = useState(false)
  const [profileStatus, setProfileStatus] = useState<{
    isComplete: boolean | null
    checking: boolean
  }>({
    isComplete: null,
    checking: false
  })

  // Check profile completion status with rate limiting
  const checkStatus = async () => {
    if (!user) return

    setProfileStatus(prev => ({ ...prev, checking: true }))
    
    try {
      const isComplete = await checkProfileCompletion()
      setProfileStatus({
        isComplete,
        checking: false
      })
    } catch (error) {
      console.error('Error checking profile status:', error)
      setProfileStatus({
        isComplete: false,
        checking: false
      })
    }
  }

  // Check status on component mount with debouncing
  useEffect(() => {
    if (user && !loading) {
      // Add a small delay to prevent rapid successive calls
      const timeoutId = setTimeout(checkStatus, 200)
      return () => clearTimeout(timeoutId)
    }
  }, [user, loading])

  // Handle profile setup completion
  const handleProfileComplete = async () => {
    setShowSetupModal(false)
    await refreshUserProfile()
    await checkStatus()
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>Please log in to test profile setup</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Profile Setup Test</h1>
        <p className="text-muted-foreground mt-2">
          Test the profile completion flow for {user.role} accounts
        </p>
      </div>

      {/* Current User Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Current User Info</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.role}</p>
          <p><strong>User ID:</strong> {user.userId}</p>
          <p><strong>Profile Complete:</strong> {user.profileComplete ? 'Yes' : 'No'}</p>
        </CardContent>
      </Card>

      {/* Profile Status */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Completion Status</CardTitle>
          <CardDescription>
            Current status of your profile completion
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            {profileStatus.checking ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            ) : profileStatus.isComplete ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            <span className="font-medium">
              {profileStatus.checking 
                ? "Checking..." 
                : profileStatus.isComplete 
                  ? "Profile is complete" 
                  : "Profile is incomplete"
              }
            </span>
          </div>

          <div className="flex space-x-2">
            <Button 
              onClick={checkStatus} 
              disabled={profileStatus.checking}
              variant="outline"
            >
              Refresh Status
            </Button>
            <Button 
              onClick={() => setShowSetupModal(true)}
              disabled={profileStatus.checking}
            >
              Open Setup Modal
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Test Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>1. Click &quot;Open Setup Modal&quot; to test the profile setup flow</p>
          <p>2. Fill in the required fields based on your role</p>
          <p>3. Complete the setup and verify the status updates</p>
          <p>4. Try accessing other parts of the app to ensure the flow works</p>
        </CardContent>
      </Card>

      {/* Profile Setup Modal */}
      <ProfileSetupModal
        isOpen={showSetupModal}
        onComplete={handleProfileComplete}
        userRole={user.role || 'student'}
      />
    </div>
  )
}
