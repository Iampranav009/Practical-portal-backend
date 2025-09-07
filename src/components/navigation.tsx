"use client"

import Link from "next/link"
import { User, BookOpen, Users, LogOut, LogIn, Compass, BarChart3, FolderOpen } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

import { Button } from "@/components/ui/button"

/**
 * Navigation Component
 * Main navigation bar with role-based navigation items
 * Shows different options for teachers, students, and guests
 */
export function Navigation() {
  const { user, logout, loading } = useAuth()

  return (
    <nav className="border-b relative overflow-hidden">
      {/* Subtle animated gradient bar */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-[linear-gradient(90deg,hsl(var(--primary)),hsl(var(--accent)),hsl(var(--primary)))] [background-size:200%_100%] animate-[gradient-move_6s_linear_infinite]" />
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link href="/" className="group flex items-center space-x-2">
              <div className="relative h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
                <span className="text-primary-foreground font-bold text-sm">PP</span>
                {/* Glow */}
                <div className="absolute inset-0 rounded-lg bg-[radial-gradient(ellipse_at_center,hsla(var(--primary)/.35),transparent_60%)] opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <span className="font-bold text-lg bg-clip-text text-transparent bg-[linear-gradient(90deg,hsl(var(--primary)),hsl(var(--accent)))] [background-size:200%_100%] animate-[gradient-move_8s_linear_infinite]">
                Practical Portal
              </span>
            </Link>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center space-x-2">
            {!loading && user ? (
              <>
              
                {/* Logout Button */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={logout}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                {/* Guest navigation - only login button */}
                <Button variant="default" size="sm" asChild>
                  <Link href="/auth/login">
                    <LogIn className="h-4 w-4 mr-2" />
                    Login
                  </Link>
                </Button>
              </>
            )}

          </div>
        </div>
      </div>
    </nav>
  )
}
