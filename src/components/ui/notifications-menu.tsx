"use client"

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Check } from "lucide-react";

// Notification type definition for teacher notifications
export type Notification = {
  id: number;
  type: 'submission' | 'announcement' | 'batch_join';
  user: {
    name: string;
    avatar?: string;
    fallback: string;
    roll_number?: string;
    email?: string;
  };
  action: string;
  target?: string;
  content?: string;
  timestamp: string;
  timeAgo: string;
  isRead: boolean;
  submission_id?: number;
  batch_id?: number;
  batch_name?: string;
};

interface NotificationsMenuProps {
  notifications: Notification[];
  onMarkAsRead?: (notificationId: number) => void;
  onMarkAllAsRead?: () => void;
  onNotificationClick?: (notification: Notification) => void;
  loading?: boolean;
}

/**
 * Notification Item Component
 * Displays individual notification with student info and submission details
 */
function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  onNotificationClick 
}: { 
  notification: Notification;
  onMarkAsRead?: (notificationId: number) => void;
  onNotificationClick?: (notification: Notification) => void;
}) {
  const handleClick = () => {
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <div 
      className="w-full py-4 first:pt-0 last:pb-0 cursor-pointer hover:bg-muted/50 rounded-lg px-2 -mx-2 transition-colors"
      onClick={handleClick}
    >
      <div className="flex gap-3">
        <Avatar className="size-11">
          <AvatarImage
            src={notification.user.avatar || "/placeholder.svg"}
            alt={`${notification.user.name}'s profile picture`}
            className="object-cover ring-1 ring-border"
          />
          <AvatarFallback>{notification.user.fallback}</AvatarFallback>
        </Avatar>

        <div className="flex flex-1 flex-col space-y-2">
          <div className="w-full items-start">
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm">
                  <span className="font-medium">{notification.user.name}</span>
                  {notification.user.roll_number && (
                    <span className="text-muted-foreground ml-1">
                      ({notification.user.roll_number})
                    </span>
                  )}
                  <span className="text-muted-foreground">
                    {" "}
                    {notification.action}{" "}
                  </span>
                  {notification.target && (
                    <span className="font-medium">{notification.target}</span>
                  )}
                </div>
                {!notification.isRead && (
                  <div className="size-1.5 rounded-full bg-emerald-500"></div>
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {notification.timestamp}
                </div>
                <div className="text-xs text-muted-foreground">
                  {notification.timeAgo}
                </div>
              </div>
            </div>
          </div>

          {notification.content && (
            <div className="rounded-lg bg-muted p-2.5 text-sm tracking-[-0.006em]">
              {notification.content}
            </div>
          )}

          {notification.batch_name && (
            <div className="text-xs text-muted-foreground">
              Batch: <span className="font-medium">{notification.batch_name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Notifications Menu Component
 * Main component for displaying teacher notifications
 */
export function NotificationsMenu({ 
  notifications, 
  onMarkAsRead, 
  onMarkAllAsRead, 
  onNotificationClick,
  loading = false 
}: NotificationsMenuProps) {
  const [activeTab, setActiveTab] = React.useState<string>("all");

  // Count notifications by type
  const submissionCount = notifications.filter(n => n.type === 'submission').length;
  const announcementCount = notifications.filter(n => n.type === 'announcement').length;
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getFilteredNotifications = () => {
    switch (activeTab) {
      case "submissions":
        return notifications.filter(n => n.type === 'submission');
      case "announcements":
        return notifications.filter(n => n.type === 'announcement');
      case "unread":
        return notifications.filter(n => !n.isRead);
      default:
        return notifications;
    }
  };

  const filteredNotifications = getFilteredNotifications();

  if (loading) {
    return (
      <Card className="flex w-full max-w-[800px] flex-col gap-6 p-4 shadow-none md:p-8">
        <CardContent className="h-full p-0">
          <div className="flex flex-col items-center justify-center space-y-2.5 py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">Loading notifications...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex w-full max-w-[800px] flex-col gap-6 p-4 shadow-none md:p-8">
      <CardHeader className="p-0">
        <div className="flex items-center justify-between">
          <h3 className="text-base leading-none font-semibold tracking-[-0.006em]">
            Your notifications
          </h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button 
                className="size-8" 
                variant="ghost" 
                size="icon"
                onClick={onMarkAllAsRead}
                title="Mark all as read"
              >
                <Check className="size-4.5 text-muted-foreground" />
              </Button>
            )}
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full flex-col justify-start"
        >
          <div className="flex items-center justify-between">
            <TabsList className="**:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:bg-muted-foreground/30 [&_button]:gap-1.5">
              <TabsTrigger value="all">
                View all
                <Badge variant="secondary">{notifications.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="submissions">
                Submissions <Badge variant="secondary">{submissionCount}</Badge>
              </TabsTrigger>
              <TabsTrigger value="unread">
                Unread <Badge variant="secondary">{unreadCount}</Badge>
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
      </CardHeader>

      <CardContent className="h-full p-0">
        <div className="space-y-0 divide-y divide-dashed divide-border">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={onMarkAsRead}
                onNotificationClick={onNotificationClick}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center space-y-2.5 py-12 text-center">
              <div className="rounded-full bg-muted p-4">
                <Bell className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium tracking-[-0.006em] text-muted-foreground">
                No notifications yet.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
