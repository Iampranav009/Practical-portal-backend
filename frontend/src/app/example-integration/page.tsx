"use client"

import React from 'react';
import { SidebarLayout } from '@/components/layout/sidebar-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, Plus } from 'lucide-react';

/**
 * Example Integration Page
 * Shows how to integrate the new modern sidebar with existing pages
 * This replaces the old app-layout structure
 */
export default function ExampleIntegrationPage() {
  return (
    <SidebarLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Example Integration</h1>
          <p className="text-muted-foreground mt-2">
            This page demonstrates how to integrate the new modern sidebar
          </p>
        </div>

        {/* Content Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <BookOpen className="h-6 w-6 text-blue-600" />
                <CardTitle>Integration Steps</CardTitle>
              </div>
              <CardDescription>
                How to integrate the modern sidebar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Import SidebarLayout from components/layout</li>
                <li>Wrap your page content in SidebarLayout</li>
                <li>Remove old app-layout imports</li>
                <li>Your sidebar will automatically adapt to user role</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Users className="h-6 w-6 text-green-600" />
                <CardTitle>Features</CardTitle>
              </div>
              <CardDescription>
                Modern sidebar capabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>Role-based navigation (Student/Teacher)</li>
                <li>Responsive design with mobile overlay</li>
                <li>Collapsible sidebar for desktop</li>
                <li>Active page highlighting</li>
                <li>Search functionality</li>
                <li>Profile integration with auth context</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Plus className="h-6 w-6 text-purple-600" />
                <CardTitle>Benefits</CardTitle>
              </div>
              <CardDescription>
                Improvements over old sidebar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>Modern, sleek design</li>
                <li>Better mobile experience</li>
                <li>Cleaner code structure</li>
                <li>Consistent navigation</li>
                <li>Improved accessibility</li>
                <li>Better performance</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Code Example */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Integration Code Example</CardTitle>
              <CardDescription>
                Here&apos;s how to update your existing pages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-md text-sm font-mono overflow-x-auto">
                <pre>{`// Before (Old Structure):
import { usePageHeader } from '@/components/app-layout'

export default function MyPage() {
  const { setPageHeader } = usePageHeader()
  
  useEffect(() => {
    setPageHeader({
      title: 'My Page',
      description: 'Page description'
    })
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Your content */}
    </div>
  )
}

// After (New Structure):
import { SidebarLayout } from '@/components/layout/sidebar-layout'

export default function MyPage() {
  return (
    <SidebarLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">My Page</h1>
        <p className="text-muted-foreground mb-8">Page description</p>
        {/* Your content */}
      </div>
    </SidebarLayout>
  )
}`}</pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarLayout>
  );
}
