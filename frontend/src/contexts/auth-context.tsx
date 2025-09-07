"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  User,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { apiCall } from '@/utils/api'
import { profileRateLimiter } from '@/utils/rate-limiter'

// Define user role type
export type UserRole = 'student' | 'teacher'

// Extended user interface with role information
export interface AuthUser extends User {
  role?: UserRole
  userId?: number
  jwtToken?: string
  profileComplete?: boolean
}

// Authentication context interface
interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, role: UserRole) => Promise<void>
  logout: () => Promise<void>
  checkProfileCompletion: () => Promise<boolean>
  refreshUserProfile: () => Promise<void>
}

// Create authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Authentication Provider Component
 * Manages Firebase authentication state and user role
 * Provides sign in, sign up, and logout functionality
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  
  // Cache for profile completion status to prevent multiple API calls
  const [profileCompletionCache, setProfileCompletionCache] = useState<{
    [key: string]: { isComplete: boolean; timestamp: number }
  }>({})
  
  // Rate limiting for profile completion checks (5 seconds between calls)
  const [lastProfileCheck, setLastProfileCheck] = useState<number>(0)
  const PROFILE_CHECK_COOLDOWN = 5000 // 5 seconds

  /**
   * Check if user's profile is complete based on role
   * Returns true if all required fields are filled
   * Uses caching to prevent multiple API calls
   */
  const checkProfileCompletionStatus = useCallback(async (userId: number, role: UserRole, token: string): Promise<boolean> => {
    const cacheKey = `${userId}-${role}`
    const now = Date.now()
    
    // Check cache first (valid for 30 seconds)
    if (profileCompletionCache[cacheKey] && (now - profileCompletionCache[cacheKey].timestamp) < 30000) {
      return profileCompletionCache[cacheKey].isComplete
    }
    
    // Rate limiting check using the rate limiter
    if (!profileRateLimiter.isAllowed('profile-check')) {
      const timeUntilNext = profileRateLimiter.getTimeUntilNextCall('profile-check')
      console.log(`Profile check rate limited, using cached value. Next call allowed in ${Math.ceil(timeUntilNext / 1000)}s`)
      return profileCompletionCache[cacheKey]?.isComplete || false
    }
    
    try {
      setLastProfileCheck(now)
      
      const response = await apiCall('profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.success) {
        // Cache the failure result
        setProfileCompletionCache(prev => ({
          ...prev,
          [cacheKey]: { isComplete: false, timestamp: now }
        }))
        return false
      }

      const profileData = response.data

      // Check common required fields
      if (!profileData.name || profileData.name.trim().length < 2) {
        setProfileCompletionCache(prev => ({
          ...prev,
          [cacheKey]: { isComplete: false, timestamp: now }
        }))
        return false
      }

      // Check role-specific required fields
      let isComplete = false
      if (role === 'teacher') {
        isComplete = !!(profileData.college_name && profileData.college_name.trim().length > 0)
      } else {
        isComplete = !!(
          profileData.year && 
          profileData.subject && 
          profileData.subject.trim().length > 0 &&
          profileData.roll_number && 
          profileData.roll_number.trim().length > 0
        )
      }
      
      // Cache the result
      setProfileCompletionCache(prev => ({
        ...prev,
        [cacheKey]: { isComplete, timestamp: now }
      }))
      
      return isComplete
    } catch (error) {
      console.error('Error checking profile completion:', error)
      
      // Cache the failure result
      setProfileCompletionCache(prev => ({
        ...prev,
        [cacheKey]: { isComplete: false, timestamp: now }
      }))
      
      return false
    }
  }, [profileCompletionCache])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch user data from backend using Firebase UID
          try {
            const userData = await apiCall(`auth/user/${firebaseUser.uid}`, {
              method: 'GET'
            });
            
            // Check profile completion status
            const profileComplete = await checkProfileCompletionStatus(userData.data.user_id, userData.data.role, userData.data.token)
            
            const userWithRole: AuthUser = {
              ...firebaseUser,
              role: userData.data.role,
              userId: userData.data.user_id,
              jwtToken: userData.data.token,
              profileComplete
            }
            setUser(userWithRole)
            
            // Redirect to appropriate dashboard based on role
            if (window.location.pathname.includes('/auth/login')) {
              const dashboardPath = userWithRole.role === 'teacher' ? '/teachers/dashboard' : '/students/my-batches'
              window.location.href = dashboardPath
            }
          } catch (error: unknown) {
            // User not found in backend, might need to register
            console.warn('User not found in backend, redirecting to registration')
            setUser(null)
          }
        } catch (error) {
          console.error('Error fetching user data from backend:', error)
          setUser(null)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [checkProfileCompletionStatus])

  /**
   * Sign in with email and password
   */
  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  }

  /**
   * Sign up with email, password, and role
   * Creates user in Firebase and stores role info in backend
   */
  const signUp = async (email: string, password: string, role: UserRole) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user
      
      // Register user in backend database
      await apiCall('auth/register', {
        method: 'POST',
        body: JSON.stringify({
          firebaseUid: firebaseUser.uid,
          name: firebaseUser.displayName || email.split('@')[0],
          email: firebaseUser.email,
          role
        })
      });

      // The onAuthStateChanged listener will handle updating the user state
      console.log('User registered successfully with role:', role)
      
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    }
  }

  /**
   * Sign out current user
   */
  const logout = async () => {
    try {
      await signOut(auth)
      // Redirect to landing page after logout
      window.location.href = '/'
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }

  /**
   * Check if current user's profile is complete
   * Returns true if profile is complete, false otherwise
   * Uses caching and rate limiting to prevent excessive API calls
   */
  const checkProfileCompletion = async (): Promise<boolean> => {
    if (!user || !user.userId || !user.role || !user.jwtToken) {
      return false
    }

    const cacheKey = `${user.userId}-${user.role}`
    const now = Date.now()
    
    // Check cache first (valid for 30 seconds)
    if (profileCompletionCache[cacheKey] && (now - profileCompletionCache[cacheKey].timestamp) < 30000) {
      const cachedResult = profileCompletionCache[cacheKey].isComplete
      // Update user state with cached result
      setUser(prev => prev ? { ...prev, profileComplete: cachedResult } : null)
      return cachedResult
    }

    // Rate limiting check using the rate limiter
    if (!profileRateLimiter.isAllowed('profile-check')) {
      const timeUntilNext = profileRateLimiter.getTimeUntilNextCall('profile-check')
      console.log(`Profile check rate limited, using cached value. Next call allowed in ${Math.ceil(timeUntilNext / 1000)}s`)
      const cachedResult = profileCompletionCache[cacheKey]?.isComplete || false
      setUser(prev => prev ? { ...prev, profileComplete: cachedResult } : null)
      return cachedResult
    }

    try {
      const isComplete = await checkProfileCompletionStatus(user.userId, user.role, user.jwtToken)
      
      // Update user state with new profile completion status
      setUser(prev => prev ? { ...prev, profileComplete: isComplete } : null)
      
      return isComplete
    } catch (error) {
      console.error('Error checking profile completion:', error)
      // Use cached value if available, otherwise default to false
      const cachedResult = profileCompletionCache[cacheKey]?.isComplete || false
      setUser(prev => prev ? { ...prev, profileComplete: cachedResult } : null)
      return cachedResult
    }
  }

  /**
   * Refresh user profile data and completion status
   * Useful after profile updates
   * Clears cache to force fresh data fetch
   */
  const refreshUserProfile = async (): Promise<void> => {
    if (!user || !user.userId || !user.role || !user.jwtToken) {
      return
    }

    const cacheKey = `${user.userId}-${user.role}`
    
    // Clear cache for this user to force fresh fetch
    setProfileCompletionCache(prev => {
      const newCache = { ...prev }
      delete newCache[cacheKey]
      return newCache
    })

    try {
      const isComplete = await checkProfileCompletionStatus(user.userId, user.role, user.jwtToken)
      setUser(prev => prev ? { ...prev, profileComplete: isComplete } : null)
    } catch (error) {
      console.error('Error refreshing user profile:', error)
    }
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    logout,
    checkProfileCompletion,
    refreshUserProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook to use authentication context
 * Must be used within AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
