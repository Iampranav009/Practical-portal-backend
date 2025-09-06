"use client"

import React, { useState, useEffect, Suspense } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter, useSearchParams } from 'next/navigation'
import { buildApiUrl } from '@/utils/api'
import { SidebarLayout } from '@/components/layout/sidebar-layout'
import { JoinPageNavbar } from '@/components/layout/join-page-navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Users, 
  Lock, 
  Loader2,
  CheckCircle,
  BookOpen,
  HelpCircle,
  Sparkles,
  Shield,
  ArrowRight,
  GraduationCap,
  Clock,
  UserCheck
} from 'lucide-react'

/**
 * Student Join Batch Page
 * Form for students to join batches using batch ID and password
 * Includes validation and success/error handling
 */

// Interface for join form data
interface JoinFormData {
  batchId: string
  password: string
}

// Component that uses useSearchParams - needs to be wrapped in Suspense
function JoinFormContent() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Form state management
  const [formData, setFormData] = useState<JoinFormData>({
    batchId: '',
    password: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Auto-populate batch ID from URL parameters
  useEffect(() => {
    const batchIdFromUrl = searchParams.get('batch_id')
    if (batchIdFromUrl) {
      setFormData(prev => ({
        ...prev,
        batchId: batchIdFromUrl
      }))
    }
  }, [searchParams])

  // Redirect if not student or not authenticated
  React.useEffect(() => {
    if (!loading && (!user || user.role !== 'student')) {
      router.push('/auth/login')
      return
    }
  }, [user, loading, router])

  /**
   * Handle form input changes
   */
  const handleInputChange = (field: keyof JoinFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear messages when user starts typing
    if (errorMessage) setErrorMessage('')
    if (successMessage) setSuccessMessage('')
  }

  /**
   * Validate form data before submission
   */
  const validateForm = (): boolean => {
    if (!formData.batchId.trim()) {
      setErrorMessage('Batch ID is required')
      return false
    }
    if (!formData.password.trim()) {
      setErrorMessage('Batch password is required')
      return false
    }
    return true
  }

  /**
   * Handle form submission to join batch
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    setErrorMessage('')
    
    try {
      const response = await fetch(buildApiUrl('batches/join'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.jwtToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          batchId: formData.batchId.trim(),
          password: formData.password
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccessMessage(`Successfully joined "${data.data.batchName}"!`)
        
        // Redirect to student batches page after a short delay
        setTimeout(() => {
          router.push('/students/my-batches')
        }, 2000)
      } else {
        setErrorMessage(data.message || 'Failed to join batch')
      }
    } catch (error) {
      console.error('Join batch error:', error)
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
      {/* Custom Navigation Bar */}
      <JoinPageNavbar
        onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      {/* Professional Background */}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Professional Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-semibold mb-6 border border-slate-200">
              <GraduationCap className="h-4 w-4" />
              Professional Learning Portal
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
              Join Your
              <span className="block bg-gradient-to-r from-blue-600 to-slate-700 bg-clip-text text-transparent">
                Classroom
              </span>
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-light">
              Access your educational environment with the credentials provided by your instructor. 
              Enter your batch details to begin your learning journey.
            </p>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Professional Form Card */}
            <div className="lg:col-span-2">
              <Card className="border border-slate-200 shadow-lg bg-white">
                <CardHeader className="text-center pb-6 pt-8 px-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <GraduationCap className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">
                    Batch Access Portal
                  </CardTitle>
                  <CardDescription className="text-slate-600 text-base leading-relaxed max-w-md mx-auto">
                    Enter your instructor-provided credentials to gain access to the learning environment
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Professional Batch ID Input */}
                    <div className="space-y-3">
                      <label htmlFor="batchId" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                          <Users className="h-4 w-4 text-slate-600" />
                        </div>
                        Batch Identifier
                        <Badge variant="outline" className="text-xs font-medium border-slate-300 text-slate-600">Required</Badge>
                      </label>
                      <Input
                        id="batchId"
                        type="text"
                        placeholder="Enter your batch identifier"
                        value={formData.batchId}
                        onChange={(e) => handleInputChange('batchId', e.target.value)}
                        className="h-11 text-base border-2 border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all duration-200 rounded-xl font-medium"
                        disabled={isSubmitting}
                      />
                      <p className="text-xs text-slate-500 flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        Numeric identifier provided by your instructor
                      </p>
                    </div>

                    {/* Professional Batch Password Input */}
                    <div className="space-y-3">
                      <label htmlFor="password" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                          <Lock className="h-4 w-4 text-slate-600" />
                        </div>
                        Access Password
                        <Badge variant="outline" className="text-xs font-medium border-slate-300 text-slate-600">Required</Badge>
                      </label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your access password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className="h-11 text-base border-2 border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all duration-200 rounded-xl font-medium"
                        disabled={isSubmitting}
                      />
                      <p className="text-xs text-slate-500 flex items-center gap-2">
                        <Shield className="h-3 w-3" />
                        Secure password set by your instructor
                      </p>
                    </div>

                    {/* Professional Error Message */}
                    {errorMessage && (
                      <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                            <span className="text-red-600 text-sm font-bold">!</span>
                          </div>
                          <div>
                            <p className="text-sm text-red-800 font-semibold">Access Denied</p>
                            <p className="text-sm text-red-700 font-medium">{errorMessage}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Professional Success Message */}
                    {successMessage && (
                      <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded-lg">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-6 w-6 text-green-600" />
                          <div>
                            <p className="text-sm text-green-800 font-semibold">Access Granted</p>
                            <p className="text-sm text-green-700 font-medium">{successMessage}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Professional Submit Button */}
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-12 bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-black text-white font-semibold text-base rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.01]"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                          Processing Access...
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-5 w-5 mr-3" />
                          Access Classroom
                          <ArrowRight className="h-5 w-5 ml-3" />
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Professional Help Sidebar */}
            <div className="lg:col-span-1">
              <Card className="border border-slate-200 shadow-lg bg-white sticky top-24">
                <CardHeader className="pb-6 pt-6 px-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl flex items-center justify-center shadow-lg">
                      <HelpCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-slate-900">Support Center</CardTitle>
                      <CardDescription className="text-slate-600 text-sm">
                        Professional assistance
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-6 pb-6 space-y-6">
                  {/* Professional Access Guide */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-slate-600" />
                      Access Instructions
                    </h4>
                    <div className="space-y-3">
                      {[
                        "Obtain credentials from your instructor",
                        "Verify batch identifier format (numeric)",
                        "Ensure password accuracy and case sensitivity",
                        "Contact support for technical assistance"
                      ].map((step, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-slate-700 text-white rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                            {index + 1}
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Professional Security Guidelines */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-slate-600" />
                      Security Guidelines
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <Shield className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-slate-800 font-semibold">Password Security</p>
                          <p className="text-xs text-slate-600">Credentials are case-sensitive and secure</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <Clock className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-slate-800 font-semibold">Format Requirements</p>
                          <p className="text-xs text-slate-600">Batch IDs typically contain 1-6 digits</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  )
}

// Main component with Suspense wrapper
export default function StudentJoinBatchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <JoinFormContent />
    </Suspense>
  )
}