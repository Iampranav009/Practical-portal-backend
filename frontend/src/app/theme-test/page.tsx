"use client"

import React from 'react'
import { useTheme } from '@/components/theme-provider'
import { ThemeToggle } from '@/components/theme-toggle'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

/**
 * Theme Test Page
 * Simple page to test theme switching functionality
 * Shows current theme and various UI components in both themes
 */
export default function ThemeTestPage() {
  const { theme } = useTheme()

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Theme Test Page</h1>
          <p className="text-muted-foreground">Test the dark/light theme switching functionality</p>
          
          {/* Current theme display */}
          <div className="flex items-center justify-center gap-4">
            <Badge variant="outline" className="text-lg px-4 py-2">
              Current Theme: {theme}
            </Badge>
            <ThemeToggle />
          </div>
        </div>

        {/* Theme-aware components showcase */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cards */}
          <Card className="card-light">
            <CardHeader>
              <CardTitle>Sample Card (Light Variant)</CardTitle>
              <CardDescription>This card uses the new lighter variant for better aesthetics</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-foreground mb-4">
                This is sample content that should be readable in both light and dark themes.
              </p>
              <div className="flex gap-2">
                <Button>Primary Button</Button>
                <Button variant="outline">Outline Button</Button>
                <Button variant="secondary">Secondary Button</Button>
              </div>
            </CardContent>
          </Card>

          {/* Color showcase */}
          <Card className="card-lighter">
            <CardHeader>
              <CardTitle>Color Palette (Lighter Variant)</CardTitle>
              <CardDescription>Theme-aware color demonstration with lighter card variant</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-primary text-primary-foreground rounded-lg text-center">
                  Primary
                </div>
                <div className="p-4 bg-secondary text-secondary-foreground rounded-lg text-center">
                  Secondary
                </div>
                <div className="p-4 bg-muted text-muted-foreground rounded-lg text-center">
                  Muted
                </div>
                <div className="p-4 bg-accent text-accent-foreground rounded-lg text-center">
                  Accent
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status badges */}
        <Card>
          <CardHeader>
            <CardTitle>Status Badges</CardTitle>
            <CardDescription>Theme-aware status indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                Success
              </Badge>
              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                Warning
              </Badge>
              <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                Error
              </Badge>
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                Info
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Test</CardTitle>
            <CardDescription>Instructions for testing theme functionality</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-foreground">
            <p>1. Click the theme toggle button in the header to switch between themes</p>
            <p>2. The theme should cycle through: Light → Dark → System → Light</p>
            <p>3. All colors, backgrounds, and text should adapt smoothly</p>
            <p>4. Check that the theme persists when you refresh the page</p>
            <p>5. Navigate to other pages to ensure theme consistency</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
