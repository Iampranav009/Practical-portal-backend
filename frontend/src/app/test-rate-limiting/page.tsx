"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { profileRateLimiter } from "@/utils/rate-limiter"
import { AlertCircle, CheckCircle, Clock } from "lucide-react"

/**
 * Rate Limiting Test Page
 * Test page to verify that rate limiting is working correctly
 * Shows current rate limit status and allows testing
 */
export default function TestRateLimitingPage() {
  const { user, checkProfileCompletion } = useAuth()
  const [testResults, setTestResults] = useState<{
    calls: number
    lastResult: string
    rateLimited: boolean
    timeUntilNext: number
  }>({
    calls: 0,
    lastResult: '',
    rateLimited: false,
    timeUntilNext: 0
  })
  const [testing, setTesting] = useState(false)

  // Test profile completion check with rate limiting
  const testProfileCheck = async () => {
    if (!user) {
      setTestResults(prev => ({
        ...prev,
        lastResult: 'No user logged in'
      }))
      return
    }

    setTesting(true)
    
    try {
      const isAllowed = profileRateLimiter.isAllowed('profile-check')
      const timeUntilNext = profileRateLimiter.getTimeUntilNextCall('profile-check')
      
      if (!isAllowed) {
        setTestResults(prev => ({
          ...prev,
          calls: prev.calls + 1,
          lastResult: `Rate limited! Next call allowed in ${Math.ceil(timeUntilNext / 1000)}s`,
          rateLimited: true,
          timeUntilNext
        }))
        setTesting(false)
        return
      }

      const isComplete = await checkProfileCompletion()
      
      setTestResults(prev => ({
        ...prev,
        calls: prev.calls + 1,
        lastResult: `Profile complete: ${isComplete}`,
        rateLimited: false,
        timeUntilNext: 0
      }))
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        calls: prev.calls + 1,
        lastResult: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        rateLimited: false,
        timeUntilNext: 0
      }))
    } finally {
      setTesting(false)
    }
  }

  // Clear rate limit for testing
  const clearRateLimit = () => {
    profileRateLimiter.clear('profile-check')
    setTestResults(prev => ({
      ...prev,
      calls: 0,
      lastResult: 'Rate limit cleared',
      rateLimited: false,
      timeUntilNext: 0
    }))
  }

  // Get current rate limit status
  const getRateLimitStatus = () => {
    const isAllowed = profileRateLimiter.isAllowed('profile-check')
    const timeUntilNext = profileRateLimiter.getTimeUntilNextCall('profile-check')
    
    return {
      isAllowed,
      timeUntilNext
    }
  }

  const rateLimitStatus = getRateLimitStatus()

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Rate Limiting Test</h1>
        <p className="text-muted-foreground mt-2">
          Test the rate limiting functionality for profile completion checks
        </p>
      </div>

      {/* Current User Info */}
      {user && (
        <Card>
          <CardHeader>
            <CardTitle>Current User</CardTitle>
          </CardHeader>
          <CardContent>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role}</p>
            <p><strong>Profile Complete:</strong> {user.profileComplete ? 'Yes' : 'No'}</p>
          </CardContent>
        </Card>
      )}

      {/* Rate Limit Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {rateLimitStatus.isAllowed ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <Clock className="h-5 w-5 text-amber-600" />
            )}
            <span>Rate Limit Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <span className="font-medium">Status:</span>
            <span className={rateLimitStatus.isAllowed ? "text-green-600" : "text-amber-600"}>
              {rateLimitStatus.isAllowed ? "Allowed" : "Rate Limited"}
            </span>
          </div>
          
          {!rateLimitStatus.isAllowed && (
            <div className="flex items-center space-x-2">
              <span className="font-medium">Time until next call:</span>
              <span className="text-amber-600">
                {Math.ceil(rateLimitStatus.timeUntilNext / 1000)}s
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
          <CardDescription>
            Results from profile completion check tests
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <span className="font-medium">Total calls made:</span>
            <span>{testResults.calls}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="font-medium">Last result:</span>
            <span className={testResults.rateLimited ? "text-amber-600" : "text-green-600"}>
              {testResults.lastResult}
            </span>
          </div>

          {testResults.rateLimited && (
            <div className="flex items-center space-x-2 text-amber-600">
              <AlertCircle className="h-4 w-4" />
              <span>Rate limited! Wait before making another call.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Test Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Button 
              onClick={testProfileCheck} 
              disabled={testing || !user}
              className="flex-1"
            >
              {testing ? "Testing..." : "Test Profile Check"}
            </Button>
            <Button 
              onClick={clearRateLimit} 
              variant="outline"
            >
              Clear Rate Limit
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>• Click &quot;Test Profile Check&quot; to make a profile completion check</p>
            <p>• Try clicking multiple times quickly to test rate limiting</p>
            <p>• Use &quot;Clear Rate Limit&quot; to reset the rate limiter for testing</p>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>1. Make sure you&apos;re logged in</p>
          <p>2. Click &quot;Test Profile Check&quot; multiple times quickly</p>
          <p>3. After 5 calls in 30 seconds, you should see rate limiting</p>
          <p>4. Wait 30 seconds or click &quot;Clear Rate Limit&quot; to reset</p>
          <p>5. Verify that the error &quot;Too many API requests&quot; no longer appears</p>
        </CardContent>
      </Card>
    </div>
  )
}
