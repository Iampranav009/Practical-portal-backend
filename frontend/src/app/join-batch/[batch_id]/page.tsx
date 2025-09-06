"use client"

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter, useParams } from 'next/navigation'
import { buildApiUrl } from '@/utils/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { SidebarLayout } from '@/components/layout/sidebar-layout'
import { 
  Users, 
  Lock, 
  Loader2,
  CheckCircle,
  BookOpen,
  School,
  Calendar,
  UserCheck,
  ArrowLeft,
  Sparkles,
  Shield,
  Clock
} from 'lucide-react'
import { getApiBaseUrl } from '@/utils/api'

/**
 * Batch Join Landing Page
 * Shows batch information and allows students to join with password
 * Used when someone clicks a shareable batch link
 */

interface BatchInfo {
  batch_id: number
  name: string
  college_name: string
  description: string
  icon_image: string
  cover_image: string
  created_at: string
  teacher_name: string
  member_count: number
}

export default function JoinBatchPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const batchId = params.batch_id as string
  
  // State management
  const [batchInfo, setBatchInfo] = useState<BatchInfo | null>(null)
  const [loadingBatch, setLoadingBatch] = useState(true)
  const [password, setPassword] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)

  // Check authentication and fetch batch info
  useEffect(() => {
    if (loading) return
    
    if (!user) {
      // If not logged in, redirect to login with return URL
      router.push(`/auth/login?redirect=/join-batch/${batchId}`)
      return
    }
    
    if (user.role !== 'student') {
      router.push('/auth/login')
      return
    }
    
    fetchBatchInfo()
  }, [user, loading, batchId, router])

  /**
   * Fetch public batch information for preview
   */
  const fetchBatchInfo = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/batches/${batchId}`, {
        headers: {
          'Authorization': `Bearer ${user?.jwtToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setBatchInfo(data.data)
        
        // Check if student is already a member
        if (data.data.members?.some((member: { user_id: number }) => member.user_id === user?.userId)) {
          setSuccessMessage('You are already a member of this batch!')
          setTimeout(() => {
            router.push(`/batches/${batchId}`)
          }, 2000)
        }
      } else if (response.status === 404) {
        setErrorMessage('Batch not found or no longer available')
      } else if (response.status === 403) {
        // Batch exists but we don't have access yet - show join form
        setBatchInfo({
          batch_id: parseInt(batchId),
          name: 'Private Batch',
          college_name: 'Protected',
          description: 'This is a private batch. Enter the password to view details and join.',
          icon_image: '',
          cover_image: '',
          created_at: new Date().toISOString(),
          teacher_name: 'Private',
          member_count: 0
        })
      } else {
        setErrorMessage('Unable to access batch information. Please try again.')
      }
    } catch (error) {
      console.error('Error fetching batch info:', error)
      setErrorMessage('Network error. Please try again.')
    } finally {
      setLoadingBatch(false)
    }
  }

  /**
   * Handle password input change
   */
  const handlePasswordChange = (value: string) => {
    setPassword(value)
    if (errorMessage) setErrorMessage('')
  }

  /**
   * Handle batch join submission
   */
  const handleJoinBatch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password.trim()) {
      setErrorMessage('Password is required')
      return
    }
    
    setIsJoining(true)
    setErrorMessage('')
    
    try {
      const response = await fetch(buildApiUrl('batches/join'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.jwtToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          batchId: batchId,
          password: password
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccessMessage(`Successfully joined "${data.data.batchName}"!`)
        setShowSuccessAnimation(true)
        
        // Hide animation and redirect after 3 seconds
        setTimeout(() => {
          setShowSuccessAnimation(false)
          router.push(`/batches/${batchId}`)
        }, 3000)
      } else {
        setErrorMessage(data.message || 'Failed to join batch')
      }
    } catch (error) {
      console.error('Join batch error:', error)
      setErrorMessage('Network error. Please try again.')
    } finally {
      setIsJoining(false)
    }
  }

  // Success Animation Component
  const SuccessAnimation = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center animate-in zoom-in-95 duration-300">
        <div className="relative">
          {/* Animated checkmark circle */}
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <div className="w-full h-full bg-green-100 rounded-full flex items-center justify-center animate-pulse">
              <CheckCircle className="w-12 h-12 text-green-600 animate-bounce" />
            </div>
            {/* Sparkle effects */}
            <div className="absolute -top-2 -right-2">
              <Sparkles className="w-6 h-6 text-yellow-400 animate-spin" />
            </div>
            <div className="absolute -bottom-1 -left-1">
              <Sparkles className="w-4 h-4 text-blue-400 animate-ping" />
            </div>
          </div>
          
          <h3 className="text-2xl font-bold text-foreground mb-2">Success!</h3>
          <p className="text-muted-foreground mb-4">You have successfully joined the batch!</p>
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            <Clock className="w-4 h-4 mr-1" />
            Redirecting you in a moment...
          </div>
        </div>
      </div>
    </div>
  )

  // Loading state with sidebar
  if (loading || loadingBatch) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading batch information...</p>
          </div>
        </div>
      </SidebarLayout>
    )
  }

  // Error state with sidebar
  if (errorMessage && !batchInfo) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-full px-4">
          <Card className="max-w-md w-full">
            <CardContent className="p-6 text-center">
              <div className="text-red-500 mb-4">
                <BookOpen className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">Batch Not Found</h3>
              <p className="text-muted-foreground mb-4">{errorMessage}</p>
              <Button onClick={() => router.push('/students/my-batches')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go to My Batches
              </Button>
            </CardContent>
          </Card>
        </div>
      </SidebarLayout>
    )
  }

  return (
    <SidebarLayout>
      {/* Success Animation Overlay */}
      {showSuccessAnimation && <SuccessAnimation />}
      
      <div className="h-full bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Join Batch
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">Review batch details and join the classroom</p>
          </div>

          {batchInfo && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {/* Left Column - Batch Information Card */}
              <div className="space-y-6">
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader className="text-center pb-4">
                    <div className="relative">
                      {batchInfo.icon_image ? (
                        <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden ring-4 ring-blue-100">
                          <img 
                            src={batchInfo.icon_image} 
                            alt={batchInfo.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-blue-100">
                          <BookOpen className="h-12 w-12 text-white" />
                        </div>
                      )}
                      {/* Online indicator */}
                      <div className="absolute bottom-2 right-1/2 transform translate-x-6 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    
                    <CardTitle className="text-2xl font-bold text-foreground mb-2">
                      {batchInfo.name}
                    </CardTitle>
                    <CardDescription className="flex items-center justify-center text-muted-foreground text-lg">
                      <School className="h-5 w-5 mr-2" />
                      {batchInfo.college_name}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {/* Batch Description */}
                    {batchInfo.description && (
                      <div className="bg-background rounded-lg p-4">
                        <p className="text-foreground text-center leading-relaxed">
                          {batchInfo.description}
                        </p>
                      </div>
                    )}
                    
                    {/* Batch Stats Grid */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-3xl font-bold text-blue-600 mb-1">
                          {batchInfo.member_count}
                        </div>
                        <div className="text-sm text-muted-foreground font-medium">Members</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-3xl font-bold text-green-600 mb-1">
                          <Shield className="h-8 w-8 mx-auto" />
                        </div>
                        <div className="text-sm text-muted-foreground font-medium">Protected</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-3xl font-bold text-purple-600 mb-1">
                          <UserCheck className="h-8 w-8 mx-auto" />
                        </div>
                        <div className="text-sm text-muted-foreground font-medium">Active</div>
                      </div>
                    </div>

                    {/* Teacher and Date Info */}
                    <div className="flex justify-between items-center text-sm text-muted-foreground pt-4 border-t border-border">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        <span className="font-medium">By {batchInfo.teacher_name}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>Created {new Date(batchInfo.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Join Form Card */}
              <div className="space-y-6">
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold text-foreground mb-2">
                      Ready to Join?
                    </CardTitle>
                    <CardDescription className="text-muted-foreground text-lg">
                      Enter the password provided by your teacher to join this batch
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <form onSubmit={handleJoinBatch} className="space-y-6">
                      {/* Password Input */}
                      <div className="space-y-3">
                        <label htmlFor="password" className="text-sm font-medium text-foreground flex items-center">
                          <Lock className="h-4 w-4 mr-2" />
                          Batch Password *
                        </label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Enter the batch password"
                          value={password}
                          onChange={(e) => handlePasswordChange(e.target.value)}
                          className="w-full h-12 text-lg border-2 focus:border-blue-500 transition-colors"
                          disabled={isJoining}
                        />
                        <p className="text-xs text-muted-foreground flex items-center">
                          <Shield className="h-3 w-3 mr-1" />
                          Ask your teacher for the batch password
                        </p>
                      </div>

                      {/* Error Message */}
                      {errorMessage && (
                        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg animate-in slide-in-from-top-2 duration-300">
                          <p className="text-sm text-red-600 font-medium">{errorMessage}</p>
                        </div>
                      )}

                      {/* Submit Button */}
                      <div className="space-y-4">
                        <Button
                          type="submit"
                          disabled={isJoining || !password.trim()}
                          className="w-full h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                        >
                          {isJoining ? (
                            <>
                              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                              Joining Batch...
                            </>
                          ) : (
                            <>
                              <Users className="h-5 w-5 mr-2" />
                              Join Batch
                            </>
                          )}
                        </Button>
                        
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => router.push('/students/my-batches')}
                          className="w-full h-12 border-2 hover:bg-background transition-colors"
                          disabled={isJoining}
                        >
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Back to My Batches
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                {/* Help Section */}
                <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-50 to-purple-50">
                  <CardContent className="p-6">
                    <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                      <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
                      Need help?
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li className="flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        Make sure you have the correct batch password from your teacher
                      </li>
                      <li className="flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        If you can&apos;t access the batch, contact your teacher directly
                      </li>
                      <li className="flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        You can only join batches as a student account
                      </li>
                      <li className="flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        Once joined, you&apos;ll be able to submit work and view submissions
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  )
}
