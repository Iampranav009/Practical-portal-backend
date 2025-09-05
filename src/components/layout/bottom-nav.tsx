"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { 
  Home, 
  BookOpen, 
  Search, 
  Plus, 
  User,
  Users,
  BarChart3,
  Eye,
  MessageCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  roles?: ('student' | 'teacher')[];
}

interface BottomNavProps {
  className?: string;
}

/**
 * Bottom Navigation Component for Mobile
 * Provides primary navigation routes in a bottom tab bar
 * Only visible on mobile devices (hidden on md+ screens)
 */
export function BottomNav({ className = "" }: BottomNavProps) {
  const { user } = useAuth();
  const pathname = usePathname();

  // Navigation items based on user role
  const getNavigationItems = (role: 'student' | 'teacher'): BottomNavItem[] => {
    if (role === 'student') {
      return [
        { id: "my-batches", label: "My Batches", icon: BookOpen, href: "/students/my-batches" },
        { id: "browse", label: "Browse", icon: Search, href: "/students/browse-batches" },
        { id: "message", label: "Message", icon: MessageCircle, href: "#" },
        { id: "join", label: "Join", icon: Plus, href: "/students/join" },
        { id: "profile", label: "Profile", icon: User, href: "/students/profile" },
      ];
    } else {
      return [
        { id: "dashboard", label: "Dashboard", icon: Home, href: "/teachers/dashboard" },
        { id: "my-batches", label: "My Batches", icon: Users, href: "/teachers/my-batches" },
        { id: "explore", label: "Explore", icon: Eye, href: "/teachers/explore-batches" },
        { id: "message", label: "Message", icon: MessageCircle, href: "#" },
        { id: "create", label: "Create", icon: Plus, href: "/teachers/create-batch" },
        { id: "profile", label: "Profile", icon: User, href: "/teachers/profile" },
      ];
    }
  };

  // Don't render if user is not loaded or on desktop
  if (!user) {
    return null;
  }

  const navigationItems = getNavigationItems(user.role as 'student' | 'teacher');

  return (
    <nav 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40",
        "bg-background/95 backdrop-blur-sm border-t border-border",
        "px-safe-left pr-safe-right pb-safe-bottom",
        "md:hidden",
        className
      )}
    >
      <div className="flex items-center justify-around h-16">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          // Handle message button with coming soon popup
          if (item.id === 'message') {
            return (
              <button
                key={item.id}
                onClick={() => alert('Coming Soon! Message feature will be available in a future update.')}
                className={cn(
                  "flex flex-col items-center justify-center",
                  "min-w-0 flex-1 h-full px-2 py-1",
                  "transition-colors duration-200",
                  "hover:bg-accent/50 rounded-lg",
                  "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium truncate">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center",
                "min-w-0 flex-1 h-full px-2 py-1",
                "transition-colors duration-200",
                "hover:bg-accent/50 rounded-lg",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn(
                "h-5 w-5 mb-1",
                isActive ? "text-primary" : "text-muted-foreground"
              )} />
              <span className={cn(
                "text-xs font-medium truncate",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
