"use client";

import React, { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/components/theme-provider';
import { apiCall } from '@/utils/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Home, 
  User, 
  LogOut, 
  X, 
  BarChart3,
  FileText,
  Bell,
  Search,
  HelpCircle,
  Users,
  Plus,
  BookOpen,
  School,
  Calendar,
  Eye,
  ChevronUp,
  MessageCircle
} from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface NavigationItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: string;
  roles?: ('student' | 'teacher')[];
}

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

/**
 * Sidebar Drawer Component for Mobile
 * Off-canvas navigation drawer with focus trap and body scroll lock
 * Provides full navigation menu for mobile devices
 */
export function SidebarDrawer({ isOpen, onClose, className = "" }: SidebarDrawerProps) {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const [profilePicture, setProfilePicture] = React.useState<string>("");

  // Fetch user profile picture
  useEffect(() => {
    const fetchProfilePicture = async () => {
      if (!user?.jwtToken) return;

      try {
        const response = await apiCall('profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${user.jwtToken}`
          }
        });

        if (response.success && response.data.profile_picture_url) {
          setProfilePicture(response.data.profile_picture_url);
        }
      } catch (error) {
        console.error('Error fetching profile picture:', error);
      }
    };

    fetchProfilePicture();
  }, [user?.jwtToken]);

  // Get navigation items based on user role
  const getNavigationItems = (role: 'student' | 'teacher'): NavigationItem[] => {
    if (role === 'student') {
      return [
        { id: "my-batches", name: "My Batches", icon: BookOpen, href: "/students/my-batches" },
        { id: "join-batch", name: "Join Batch", icon: Plus, href: "/students/join" },
        { id: "explore", name: "Explore", icon: Search, href: "/students/browse-batches" },
        { id: "message", name: "Message", icon: MessageCircle, href: "#" },
        { id: "profile", name: "Profile", icon: User, href: "/students/profile" },
      ];
    } else {
      return [
        { id: "dashboard", name: "Dashboard", icon: Home, href: "/teachers/dashboard" },
        { id: "my-batches", name: "My Batches", icon: Users, href: "/teachers/my-batches" },
        { id: "explore-batches", name: "Explore Batches", icon: Eye, href: "/teachers/explore-batches" },
        { id: "create-batch", name: "Create Batch", icon: Plus, href: "/teachers/create-batch" },
        { id: "message", name: "Message", icon: MessageCircle, href: "#" },
        { id: "profile", name: "Profile", icon: User, href: "/teachers/profile" },
      ];
    }
  };

  // Focus trap and body scroll lock
  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previousActiveElement.current = document.activeElement as HTMLElement;
      
      // Focus the drawer
      drawerRef.current?.focus();
      
      // Lock body scroll
      document.body.style.overflow = 'hidden';
      
      // Handle escape key
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      
      document.addEventListener('keydown', handleEscape);
      
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'unset';
        
        // Restore focus to the previously focused element
        if (previousActiveElement.current) {
          previousActiveElement.current.focus();
        }
      };
    }
  }, [isOpen, onClose]);

  // Don't render if user is not loaded
  if (!user) {
    return null;
  }

  const navigationItems = getNavigationItems(user.role as 'student' | 'teacher');

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserDisplayName = () => {
    return user?.displayName || user?.email?.split('@')[0] || 'User';
  };

  const handleItemClick = (item: NavigationItem) => {
    // Handle message button with coming soon popup
    if (item.id === 'message') {
      // Show coming soon popup instead of navigating
      alert('Coming Soon! Message feature will be available in a future update.');
      onClose();
      return;
    }
    
    router.push(item.href);
    onClose();
  };

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`
          fixed top-0 left-0 h-full w-80 max-w-[85vw] z-50
          bg-card border-r border-border
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          flex flex-col
          focus:outline-none
          ${className}
        `}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/60">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
              <School className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-foreground text-sm">Practical Portal</span>
              <span className="text-xs text-muted-foreground capitalize">
                {user.role === 'student' ? 'Student' : 'Teacher'}
              </span>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
            aria-label="Close navigation menu"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search pages..."
              className="pl-9 h-9"
              onClick={() => {
                router.push('/students/browse-batches');
                onClose();
              }}
              readOnly
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

              return (
                <li key={item.id}>
                  <Button
                    variant="ghost"
                    onClick={() => handleItemClick(item)}
                    className={`
                      sidebar-nav-item w-full justify-start h-10 px-3
                      ${isActive ? "active" : ""}
                    `}
                  >
                    <Icon className="icon h-4 w-4 mr-3" />
                    <span className="text-sm font-medium">{item.name}</span>
                    {item.badge && (
                      <span className="ml-auto px-2 py-0.5 text-xs font-medium rounded-full bg-primary/20 text-primary">
                        {item.badge}
                      </span>
                    )}
                  </Button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Profile Section */}
        <div className="border-t border-border p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="profile-button w-full justify-start h-12 px-3"
              >
                <div className="profile-avatar w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center mr-3 transition-all duration-200 overflow-hidden">
                  {profilePicture ? (
                    <Image
                      src={profilePicture}
                      alt="Profile Picture"
                      width={32}
                      height={32}
                      className="w-full h-full object-cover rounded-full"
                      onError={() => setProfilePicture("")}
                    />
                  ) : (
                    <User className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="profile-name text-sm font-medium text-foreground truncate transition-all duration-200">
                    {getUserDisplayName()}
                  </p>
                  <p className="profile-role text-xs text-muted-foreground truncate capitalize transition-all duration-200">
                    {user.role}
                  </p>
                </div>
                <ChevronUp className="profile-chevron h-4 w-4 text-muted-foreground transition-all duration-200" />
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="start" side="top" className="w-56">
              <DropdownMenuLabel className="truncate">
                Signed in as {user.email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={() => handleItemClick({ id: "profile", name: "Profile", icon: User, href: `/${user.role}s/profile` })}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              
              
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-700">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </>
  );
}
