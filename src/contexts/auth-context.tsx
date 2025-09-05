"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
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

// Define user role type
export type UserRole = 'student' | 'teacher'

// Extended user interface with role information
export interface AuthUser extends User {
  role?: UserRole
  userId?: number
  jwtToken?: string
}

// Authentication context interface
interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, role: UserRole) => Promise<void>
  logout: () => Promise<void>
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch user data from backend using Firebase UID
          try {
            const userData = await apiCall(`auth/user/${firebaseUser.uid}`, {
              method: 'GET'
            });
            
            const userWithRole: AuthUser = {
              ...firebaseUser,
              role: userData.data.role,
              userId: userData.data.user_id,
              jwtToken: userData.data.token
            }
            setUser(userWithRole)
            
            // Redirect to appropriate dashboard based on role
            if (window.location.pathname.includes('/auth/login')) {
              const dashboardPath = userWithRole.role === 'teacher' ? '/teachers/dashboard' : '/students/my-batches'
              window.location.href = dashboardPath
            }
          } catch (error: any) {
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
  }, [])

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
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    logout
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
