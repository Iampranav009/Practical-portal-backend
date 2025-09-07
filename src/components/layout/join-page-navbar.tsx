"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Home, 
  Users, 
  Menu,
  BookOpen,
  Sparkles,
  ArrowLeft,
  GraduationCap
} from 'lucide-react'

interface JoinPageNavbarProps {
  onMenuClick: () => void
  isMobileMenuOpen: boolean
}

/**
 * Navigation Bar for Join Page
 * Includes page title, description, and quick action buttons
 * Responsive design for mobile and desktop
 */
export function JoinPageNavbar({ onMenuClick, isMobileMenuOpen }: JoinPageNavbarProps) {
  const router = useRouter()

  return (
    <>
      {/* Professional Mobile Navigation Bar */}
      <header className="sticky top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 px-safe-left pr-safe-right pt-safe-top h-16 flex items-center justify-between md:hidden shadow-sm">
        {/* Left: Back Button + Hamburger Menu */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="h-10 w-10 p-0 ml-2 hover:bg-slate-100 rounded-xl"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="h-10 w-10 p-0 hover:bg-slate-100 rounded-xl"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5 text-slate-600" />
          </Button>
        </div>

        {/* Center: Simple Title */}
        <div className="flex-1 mx-3 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg flex items-center justify-center shadow-lg">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-lg font-bold text-slate-900">Join Batch</h1>
          </div>
        </div>

        {/* Right: Professional Action Buttons */}
        <div className="flex items-center gap-1 mr-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/students/my-batches')}
            className="h-10 px-3 text-xs hover:bg-slate-100 hover:text-slate-700 transition-all duration-200 rounded-xl font-semibold"
            title="Dashboard"
          >
            <Home className="h-4 w-4 mr-1" />
            Dashboard
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/students/my-batches')}
            className="h-10 px-3 text-xs hover:bg-slate-100 hover:text-slate-700 transition-all duration-200 rounded-xl font-semibold"
            title="My Batches"
          >
            <Users className="h-4 w-4 mr-1" />
            Batches
          </Button>
        </div>
      </header>

      {/* Professional Desktop Navigation Bar - Normal Size */}
      <header className="sticky top-0 z-40 hidden md:block bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Left: Simple Title */}
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl flex items-center justify-center shadow-lg">
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Join Batch
                </h1>
              </div>
            </div>

            {/* Right: Professional Action Buttons */}
            <div className="flex items-center gap-3">

              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/students/my-batches')}
                className="flex items-center gap-2 h-10 px-4 hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300 transition-all duration-200 rounded-lg border font-semibold"
              >
                <Users className="h-4 w-4" />
                My Batches
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/students/browse-batches')}
                className="flex items-center gap-2 h-10 px-4 hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300 transition-all duration-200 rounded-lg border font-semibold"
              >
                <BookOpen className="h-4 w-4" />
                Explore Classes
              </Button>
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
