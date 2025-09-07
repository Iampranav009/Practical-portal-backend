"use client"

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { SidebarLayout } from '@/components/layout/sidebar-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  FileText, 
  CheckCircle, 
  Clock, 
  XCircle, 
  TrendingUp,
  Plus,
  Eye,
  Copy
} from 'lucide-react'
import { getApiBaseUrl } from '@/utils/api'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

/**
 * Teacher Analytics Dashboard Page
 * Comprehensive dashboard showing teacher analytics, recent activity, and batch overview
 * Includes charts, metrics cards, and quick actions
 */

// Interface for dashboard analytics overview
interface AnalyticsOverview {
  totalBatches: number
  totalStudents: number
  pendingSubmissions: number
  acceptedSubmissions: number
  rejectedSubmissions: number
  totalSubmissions: number
}

// Interface for recent submission activity
interface RecentActivity {
  submission_id: number
  content: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  updated_at: string
  student_name: string
  batch_name: string
  batch_id: number
}

// Interface for batch overview
interface BatchOverview {
  batch_id: number
  name: string
  description: string
  created_at: string
  student_count: number
  submission_count: number
  pending_count: number
}

// Interface for chart data
interface ChartData {
  submission_date: string
  count: number
  accepted_count: number
  rejected_count: number
}

export default function TeacherDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  
  // State management for analytics dashboard
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [batchOverview, setBatchOverview] = useState<BatchOverview[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [loadingDashboard, setLoadingDashboard] = useState(true)
  const [updatingSubmission, setUpdatingSubmission] = useState<number | null>(null)

  // Redirect if not teacher or not authenticated
  useEffect(() => {
    if (!loading && (!user || user.role !== 'teacher')) {
      router.push('/auth/login')
      return
    }
  }, [user, loading, router])

  // Fetch dashboard analytics on component mount
  useEffect(() => {
    if (user && user.role === 'teacher') {
      fetchDashboardAnalytics()
    }
  }, [user])

  /**
   * Fetch comprehensive dashboard analytics
   */
  const fetchDashboardAnalytics = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/dashboard/teacher/${user?.userId}`, {
        headers: {
          'Authorization': `Bearer ${user?.jwtToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        const dashboardData = data.data
        
        // Set analytics overview
        setAnalytics(dashboardData.overview)
        
        // Set recent activity
        setRecentActivity(dashboardData.recentActivity || [])
        
        // Set batch overview
        setBatchOverview(dashboardData.batchOverview || [])
        
        // Set chart data for trends
        setChartData(dashboardData.submissionTrend || [])
      } else {
        console.error('Failed to fetch dashboard analytics')
      }
    } catch (error) {
      console.error('Error fetching dashboard analytics:', error)
    } finally {
      setLoadingDashboard(false)
    }
  }

  /**
   * Update submission status (Accept/Reject)
   */
  const updateSubmissionStatus = async (submissionId: number, newStatus: 'accepted' | 'rejected') => {
    setUpdatingSubmission(submissionId)
    
    try {
      const response = await fetch(`${getApiBaseUrl()}/submissions/${submissionId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user?.jwtToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        // Update the recent activity list
        setRecentActivity(prev => 
          prev.map(activity => 
            activity.submission_id === submissionId 
              ? { ...activity, status: newStatus, updated_at: new Date().toISOString() }
              : activity
          )
        )
        
        // Refresh analytics to get updated counts
        fetchDashboardAnalytics()
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to update submission status')
      }
    } catch (error) {
      console.error('Error updating submission status:', error)
      alert('Failed to update submission status')
    } finally {
      setUpdatingSubmission(null)
    }
  }

  /**
   * Format date for display
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  /**
   * Get status badge color and icon
   */
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return { color: 'bg-green-100 text-green-800', icon: CheckCircle }
      case 'rejected':
        return { color: 'bg-red-100 text-red-800', icon: XCircle }
      default:
        return { color: 'bg-yellow-100 text-yellow-800', icon: Clock }
    }
  }

  // Loading state
  if (loading || loadingDashboard) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <SidebarLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header with actions (navbar-style) */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Teacher Dashboard</h1>
            <p className="text-muted-foreground mt-1">Analytics overview and batch management</p>
          </div>
          <div className="flex shrink-0 gap-3">
            <Button
              onClick={() => router.push('/teachers/my-batches')}
              variant="outline"
            >
              <Eye className="h-4 w-4 mr-2" />
              View All Batches
            </Button>
            <Button
              onClick={() => router.push('/teachers/create-batch')}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Batch
            </Button>
          </div>
        </div>
        {/* Analytics Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="card-light">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Batches</p>
                  <p className="text-2xl font-bold text-foreground">{analytics?.totalBatches || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-light">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                  <p className="text-2xl font-bold text-foreground">{analytics?.totalStudents || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-light">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Pending Submissions</p>
                  <p className="text-2xl font-bold text-foreground">{analytics?.pendingSubmissions || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-light">
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Accepted Submissions</p>
                  <p className="text-2xl font-bold text-foreground">{analytics?.acceptedSubmissions || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Submission Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Submission Trends (Last 7 Days)
              </CardTitle>
              <CardDescription>Daily submission activity breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="submission_date" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      formatter={(value, name) => [value, name === 'count' ? 'Total' : name === 'accepted_count' ? 'Accepted' : 'Rejected']}
                    />
                    <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} name="count" />
                    <Line type="monotone" dataKey="accepted_count" stroke="#10b981" strokeWidth={2} name="accepted_count" />
                    <Line type="monotone" dataKey="rejected_count" stroke="#ef4444" strokeWidth={2} name="rejected_count" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Submission Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Submission Status Overview
              </CardTitle>
              <CardDescription>Total submissions by status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Pending', count: analytics?.pendingSubmissions || 0, color: '#f59e0b' },
                    { name: 'Accepted', count: analytics?.acceptedSubmissions || 0, color: '#10b981' },
                    { name: 'Rejected', count: analytics?.rejectedSubmissions || 0, color: '#ef4444' }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity and Batch Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Submissions Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Submissions</CardTitle>
              <CardDescription>Latest student submissions requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Limit visible items to ~5 and enable scrolling for more */}
              <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                {recentActivity.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No recent submissions</p>
                ) : (
                  // Render all, but the container above shows only ~5 at a time with scroll
                  recentActivity.map((activity) => {
                    const statusConfig = getStatusBadge(activity.status)
                    const StatusIcon = statusConfig.icon
                    
                    return (
                      <div key={activity.submission_id} className="flex items-start justify-between p-4 bg-muted/50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-sm text-foreground">{activity.student_name}</h4>
                            <Badge className={`${statusConfig.color} border-none text-xs`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {activity.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">{activity.batch_name}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(activity.created_at)}</p>
                          <p className="text-sm mt-2 line-clamp-2 text-foreground">{activity.content}</p>
                        </div>
                        
                        {activity.status === 'pending' && (
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              onClick={() => updateSubmissionStatus(activity.submission_id, 'accepted')}
                              disabled={updatingSubmission === activity.submission_id}
                              className="bg-green-600 hover:bg-green-700 h-8 px-3"
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => updateSubmissionStatus(activity.submission_id, 'rejected')}
                              disabled={updatingSubmission === activity.submission_id}
                              variant="destructive"
                              className="h-8 px-3"
                            >
                              <XCircle className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Batch Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Batch Overview</CardTitle>
              <CardDescription>Your active batches with quick stats</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Limit visible items to ~5 and enable scrolling for more */}
              <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                {batchOverview.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No batches created yet</p>
                    <Button onClick={() => router.push('/teachers/create-batch')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Batch
                    </Button>
                  </div>
                ) : (
                  // Render all, but the container above shows only ~5 at a time with scroll
                  batchOverview.map((batch) => (
                    <div key={batch.batch_id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm mb-1 text-foreground">{batch.name}</h4>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            {batch.student_count} students
                          </span>
                          <span className="flex items-center">
                            <FileText className="h-3 w-3 mr-1" />
                            {batch.submission_count} submissions
                          </span>
                          {batch.pending_count > 0 && (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              {batch.pending_count} pending
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => router.push(`/teachers/batch/${batch.batch_id}`)}
                        variant="outline"
                        className="h-8"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarLayout>
  )
}
