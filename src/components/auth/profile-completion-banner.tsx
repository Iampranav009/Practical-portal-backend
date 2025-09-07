"use client"

import React from "react"
import { AlertCircle, CheckCircle, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"

interface ProfileCompletionBannerProps {
  onSetupClick: () => void
}

/**
 * Profile Completion Banner Component
 * Shows a banner at the top of the app when profile is incomplete
 * Provides quick access to profile setup
 */
export function ProfileCompletionBanner({ onSetupClick }: ProfileCompletionBannerProps) {
  const { user } = useAuth()

  // Don't show banner if profile is complete or user is not logged in
  if (!user || user.profileComplete) {
    return null
  }

  return (
    <div className="w-full bg-amber-50 border-b border-amber-200">
      <Card className="border-0 shadow-none bg-transparent">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-amber-800">
                  Complete your profile setup
                </p>
                <p className="text-sm text-amber-700">
                  {user.role === 'teacher' 
                    ? "Add your college information to start creating batches"
                    : "Add your academic details to join batches and submit practicals"
                  }
                </p>
              </div>
            </div>
            <div className="flex-shrink-0 ml-4">
              <Button
                onClick={onSetupClick}
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <User className="h-4 w-4 mr-2" />
                Setup Profile
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
