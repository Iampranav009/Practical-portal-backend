"use client"

import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { SidebarLayout } from '@/components/layout/sidebar-layout';
import { NotificationsMenu } from '@/components/ui/notifications-menu';
import { useNotifications } from '@/components/hooks/use-notifications';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, Settings, Trash2 } from 'lucide-react';

/**
 * Teacher Notifications Page
 * Displays all notifications for teachers with filtering and management options
 * Includes real-time updates and navigation to relevant content
 */
export default function TeacherNotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const {
    notifications,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteAllNotifications,
    handleNotificationClick,
    unreadCount
  } = useNotifications();

  // Redirect if not teacher or not authenticated
  React.useEffect(() => {
    if (!authLoading && (!user || user.role !== 'teacher')) {
      router.push('/auth/login');
      return;
    }
  }, [user, authLoading, router]);

  // Loading state
  if (authLoading || loading) {
    return (
      <SidebarLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading notifications...</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <SidebarLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Error Loading Notifications</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchNotifications} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      {/* Sticky Navigation Bar */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 border-b border-border/50 shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 max-w-4xl mx-auto">
            {/* Left Section - Back Button & Title */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="h-9 w-9 hover:bg-muted/50 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold text-foreground tracking-tight">
                  Notifications
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className={`h-2 w-2 rounded-full ${unreadCount > 0 ? 'bg-primary animate-pulse' : 'bg-muted'}`} />
                  <p className="text-sm text-muted-foreground">
                    {unreadCount > 0 
                      ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
                      : 'All caught up!'
                    }
                  </p>
                </div>
              </div>
            </div>
            
            {/* Right Section - Action Buttons */}
            <div className="flex items-center gap-3">
              <Button
                onClick={fetchNotifications}
                variant="outline"
                size="sm"
                disabled={loading}
                className="h-9 px-4 hover:bg-muted/50 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              {unreadCount > 0 && (
                <Button
                  onClick={markAllAsRead}
                  variant="default"
                  size="sm"
                  className="h-9 px-4 bg-primary hover:bg-primary/90 transition-colors"
                >
                  <span className="hidden sm:inline">Mark All Read</span>
                  <span className="sm:hidden">Mark Read</span>
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  onClick={() => setShowDeleteConfirm(true)}
                  variant="destructive"
                  size="sm"
                  className="h-9 px-4 bg-red-600 hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Delete All</span>
                  <span className="sm:hidden">Delete</span>
                </Button>
              )}
              <Button
                onClick={() => router.push('/teachers/notification-settings')}
                variant="ghost"
                size="icon"
                className="h-9 w-9 hover:bg-muted/50 transition-colors"
                title="Notification settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Notifications Content */}
        <div className="flex justify-center">
          <NotificationsMenu
            notifications={notifications}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onNotificationClick={handleNotificationClick}
            loading={loading}
          />
        </div>

        {/* Empty State */}
        {notifications.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="rounded-full bg-muted p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
              <svg className="h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 1 0-15 0v5h5l-5 5-5-5h5v-5a10 10 0 1 1 20 0v5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No notifications yet</h3>
            <p className="text-muted-foreground mb-4">
              You&apos;ll receive notifications when students submit work or join your batches.
            </p>
            <Button onClick={() => router.push('/teachers/dashboard')} variant="outline">
              Go to Dashboard
            </Button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete All Notifications</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete all {notifications.length} notifications? 
              This action cannot be undone and will permanently remove all your notifications.
            </p>
            
            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setShowDeleteConfirm(false)}
                variant="outline"
                className="px-4"
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  await deleteAllNotifications();
                  setShowDeleteConfirm(false);
                }}
                variant="destructive"
                className="px-4 bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete All
              </Button>
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
}
