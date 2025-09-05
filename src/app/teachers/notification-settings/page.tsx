"use client"

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { SidebarLayout } from '@/components/layout/sidebar-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Bell, Mail, Settings } from 'lucide-react';
import { getApiBaseUrl } from '@/utils/api';

/**
 * Notification Settings Page
 * Allows teachers to manage their notification preferences
 * Includes email settings and notification types
 */
export default function NotificationSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [settings, setSettings] = useState({
    email_notifications: true,
    submission_notifications: true,
    announcement_notifications: true,
    batch_join_notifications: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not teacher or not authenticated
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'teacher')) {
      router.push('/auth/login');
      return;
    }
  }, [user, authLoading, router]);

  // Fetch notification settings
  useEffect(() => {
    if (user && user.role === 'teacher') {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${getApiBaseUrl()}/notifications/settings/${user?.userId}`, {
        headers: {
          'Authorization': `Bearer ${user?.jwtToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.data);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch settings');
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!user) return;

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`${getApiBaseUrl()}/notifications/settings/${user.userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.jwtToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        // Show success message or redirect
        alert('Settings saved successfully!');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save settings');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (key: keyof typeof settings, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <SidebarLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Notification Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage your notification preferences and email settings
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Settings Cards */}
        <div className="space-y-6">
          {/* Email Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Notifications
              </CardTitle>
              <CardDescription>
                Control whether you receive email notifications for various activities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Enable Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email notifications for all activities
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={settings.email_notifications}
                  onCheckedChange={(checked) => handleSettingChange('email_notifications', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Types */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Types
              </CardTitle>
              <CardDescription>
                Choose which types of activities you want to be notified about
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="submission-notifications">Student Submissions</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when students submit new work
                  </p>
                </div>
                <Switch
                  id="submission-notifications"
                  checked={settings.submission_notifications}
                  onCheckedChange={(checked) => handleSettingChange('submission_notifications', checked)}
                  disabled={!settings.email_notifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="announcement-notifications">Announcements</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about new announcements in your batches
                  </p>
                </div>
                <Switch
                  id="announcement-notifications"
                  checked={settings.announcement_notifications}
                  onCheckedChange={(checked) => handleSettingChange('announcement_notifications', checked)}
                  disabled={!settings.email_notifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="batch-join-notifications">Batch Joins</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when students join your batches
                  </p>
                </div>
                <Switch
                  id="batch-join-notifications"
                  checked={settings.batch_join_notifications}
                  onCheckedChange={(checked) => handleSettingChange('batch_join_notifications', checked)}
                  disabled={!settings.email_notifications}
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={saveSettings}
              disabled={saving}
              className="min-w-[120px]"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
