"use client"

import React, { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { ProfileSetupModal } from "./profile-setup-modal"
import { ProfileCompletionBanner } from "./profile-completion-banner"

interface ProfileSetupWrapperProps {
  children: React.ReactNode
}

/**
 * Profile Setup Wrapper Component
 * Wraps the main application and shows profile setup modal when needed
 * Prevents access to main app until profile is complete
 */
export function ProfileSetupWrapper({ children }: ProfileSetupWrapperProps) {
  const { user, loading, checkProfileCompletion } = useAuth()
  const [showSetupModal, setShowSetupModal] = useState(false)
  const [checkingProfile, setCheckingProfile] = useState(true)

  // Check profile completion when user changes
  useEffect(() => {
    const checkProfile = async () => {
      if (user && !loading) {
        setCheckingProfile(true)
        
        // If user object already has profileComplete, use it
        if (user.profileComplete !== undefined) {
          setShowSetupModal(!user.profileComplete)
          setCheckingProfile(false)
        } else {
          // Otherwise, check profile completion (with rate limiting protection)
          try {
            const isComplete = await checkProfileCompletion()
            setShowSetupModal(!isComplete)
          } catch (error) {
            console.error('Error checking profile completion:', error)
            // If we can't check, assume profile is incomplete for safety
            setShowSetupModal(true)
          } finally {
            setCheckingProfile(false)
          }
        }
      } else if (!user && !loading) {
        // No user logged in
        setShowSetupModal(false)
        setCheckingProfile(false)
      }
    }

    // Add a small delay to prevent rapid successive calls
    const timeoutId = setTimeout(checkProfile, 100)
    
    return () => clearTimeout(timeoutId)
  }, [user, loading, checkProfileCompletion])

  // Show loading spinner while checking profile
  if (loading || checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Show profile setup modal if profile is incomplete
  if (showSetupModal && user) {
    return (
      <ProfileSetupModal
        isOpen={showSetupModal}
        onComplete={() => {
          setShowSetupModal(false)
          // Refresh the page to ensure all components get updated user data
          window.location.reload()
        }}
        userRole={user.role || 'student'}
      />
    )
  }

  // Show main application with profile completion banner if needed
  return (
    <div className="min-h-screen">
      {user && !user.profileComplete && (
        <ProfileCompletionBanner
          onSetupClick={() => setShowSetupModal(true)}
        />
      )}
      {children}
    </div>
  )
}
