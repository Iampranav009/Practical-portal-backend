"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/components/theme-provider';
import { useStudentBatches } from '@/components/hooks/use-student-batches';
import { useNotifications } from '@/components/hooks/use-notifications';
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
  Menu, 
  X, 
  ChevronLeft, 
  ChevronRight,
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
  GraduationCap,
  Clock,
  MessageCircle
} from 'lucide-react';
import Image from 'next/image';

interface NavigationItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: string;
  roles?: ('student' | 'teacher')[];
}

interface SidebarProps {
  className?: string;
}

// Navigation items for both students and teachers
const getNavigationItems = (role: 'student' | 'teacher', unreadCount: number = 0): NavigationItem[] => {
  if (role === 'student') {
    return [
      { id: "my-batches", name: "My Batches", icon: BookOpen, href: "/students/my-batches" },
      { id: "join-batch", name: "Join Batch", icon: Plus, href: "/students/join" },
      { id: "explore", name: "Explore", icon: Search, href: "/students/browse-batches" },
      { id: "message", name: "Message", icon: MessageCircle, href: "#" },
    ];
  } else {
    return [
      { id: "dashboard", name: "Dashboard", icon: Home, href: "/teachers/dashboard" },
      { 
        id: "notifications", 
        name: "Notifications", 
        icon: Bell, 
        href: "/teachers/notifications",
        badge: unreadCount > 0 ? unreadCount.toString() : undefined
      },
      { id: "my-batches", name: "My Batches", icon: Users, href: "/teachers/my-batches" },
      { id: "explore-batches", name: "Explore Batches", icon: Eye, href: "/teachers/explore-batches" },
      { id: "create-batch", name: "Create Batch", icon: Plus, href: "/teachers/create-batch" },
      { id: "message", name: "Message", icon: MessageCircle, href: "#" },
      { id: "profile", name: "Profile", icon: User, href: "/teachers/profile" },
    ];
  }
};

export function ModernSidebar({ className = "" }: SidebarProps) {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string>("");
  const [activeItem, setActiveItem] = useState("");
  const [showMessagePopup, setShowMessagePopup] = useState(false);

  // Get student batches for sidebar display
  const { batches: studentBatches, loading: batchesLoading } = useStudentBatches();

  // Get notifications for teachers
  const { unreadCount } = useNotifications();

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
  const navigationItems = user?.role ? getNavigationItems(user.role as 'student' | 'teacher', unreadCount) : [];

  // Auto-open sidebar on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update active item based on current path
  useEffect(() => {
    const currentItem = navigationItems.find(item => 
      pathname === item.href || pathname.startsWith(item.href + '/')
    );
    if (currentItem) {
      setActiveItem(currentItem.id);
    }
  }, [pathname, navigationItems]);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const toggleCollapse = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    
    // Dispatch custom event to notify other components about sidebar state change
    const event = new CustomEvent('sidebar-toggle', {
      detail: { isCollapsed: newCollapsedState }
    });
    window.dispatchEvent(event);
  };

  const handleItemClick = (item: NavigationItem) => {
    // Handle message button with coming soon popup
    if (item.id === 'message') {
      // Show coming soon popup instead of navigating
      setShowMessagePopup(true);
      // Auto-hide popup after 3 seconds
      setTimeout(() => setShowMessagePopup(false), 3000);
      return;
    }
    
    setActiveItem(item.id);
    router.push(item.href);
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Don't render if user is not loaded
  if (!user) {
    return null;
  }

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

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-6 left-6 z-50 p-3 rounded-lg bg-card shadow-md border border-border md:hidden hover:bg-accent transition-all duration-200"
        aria-label="Toggle sidebar"
      >
        {isOpen ? 
          <X className="h-5 w-5 text-foreground" /> : 
          <Menu className="h-5 w-5 text-foreground" />
        }
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300" 
          onClick={toggleSidebar} 
        />
      )}

      {/* Coming Soon Popup */}
      {showMessagePopup && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-card border border-border rounded-lg shadow-lg p-4 max-w-sm mx-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Coming Soon!</h3>
              <p className="text-sm text-muted-foreground">Message feature will be available in a future update.</p>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`
          h-full bg-card border-r border-border transition-all duration-300 ease-in-out flex flex-col
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          ${isCollapsed ? "w-20" : "w-72"}
          md:translate-x-0
          ${className}
        `}
      >
        {/* Header with logo and collapse button */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-muted/60">
          {!isCollapsed && (
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center shadow-sm">
                <School className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-foreground text-base">Practical Portal</span>
                <span className="text-xs text-muted-foreground capitalize">
                  {user.role === 'student' ? 'Student Dashboard' : 'Teacher Dashboard'}
                </span>
              </div>
            </div>
          )}

          {isCollapsed && (
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center mx-auto shadow-sm">
              <School className="h-5 w-5 text-primary-foreground" />
            </div>
          )}

          {/* Desktop collapse button */}
          <button
            onClick={toggleCollapse}
            className="hidden md:flex p-1.5 rounded-md hover:bg-accent transition-all duration-200"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </div>

        {/* Search Bar */}
        {!isCollapsed && (
          <div className="px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search pages..."
                className="w-full pl-9 pr-4 py-2 bg-muted border border-border rounded-md text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                onClick={() => router.push('/students/browse-batches')}
                readOnly
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          <ul className="space-y-0.5">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleItemClick(item)}
                    className={`
                      sidebar-nav-item w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-md text-left
                      ${isActive ? "active" : ""}
                      ${isCollapsed ? "justify-center px-2" : ""}
                    `}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <div className="flex items-center justify-center min-w-[24px]">
                      <Icon
                        className={`
                          icon h-4.5 w-4.5 flex-shrink-0
                          ${isActive 
                            ? "text-primary" 
                            : "text-muted-foreground"
                          }
                        `}
                      />
                    </div>
                    
                    {!isCollapsed && (
                      <div className="flex items-center justify-between w-full">
                        <span className={`text-sm ${isActive ? "font-medium" : "font-normal"}`}>
                          {item.name}
                        </span>
                        {item.badge && (
                          <span className={`
                            px-1.5 py-0.5 text-xs font-medium rounded-full
                            ${isActive
                              ? "bg-primary/20 text-primary"
                              : "bg-muted text-muted-foreground"
                            }
                          `}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Badge for collapsed state */}
                    {isCollapsed && item.badge && (
                      <div className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center rounded-full bg-primary/20 border border-background">
                        <span className="text-[10px] font-medium text-primary">
                          {parseInt(item.badge) > 9 ? '9+' : item.badge}
                        </span>
                      </div>
                    )}

                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 border border-border">
                        {item.name}
                        {item.badge && (
                          <span className="ml-1.5 px-1 py-0.5 bg-muted rounded-full text-[10px]">
                            {item.badge}
                          </span>
                        )}
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-1.5 h-1.5 bg-popover rotate-45" />
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Student Batches Section - Only show for students when not collapsed */}
          {user?.role === 'student' && !isCollapsed && (
            <div className="mt-6">
              <div className="flex items-center space-x-2 px-3 py-2 mb-3">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium text-foreground">Your Batches</h3>
              </div>
              
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {batchesLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Clock className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-xs text-muted-foreground">Loading...</span>
                  </div>
                ) : studentBatches.length === 0 ? (
                  <div className="text-center py-4">
                    <BookOpen className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No batches joined</p>
                  </div>
                ) : (
                  studentBatches.map((batch) => (
                    <button
                      key={batch.batch_id}
                      onClick={() => router.push(`/batches/${batch.batch_id}`)}
                      className="w-full flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-purple-50 hover:text-purple-600 transition-all duration-200 group relative"
                    >
                      {/* Batch Icon - Circular */}
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-purple-100 transition-colors duration-200">
                        {batch.icon_image ? (
                          <img 
                            src={batch.icon_image} 
                            alt={batch.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <School className="h-6 w-6 text-primary group-hover:text-purple-600 transition-colors duration-200" />
                        )}
                      </div>
                      
                      {/* Batch Info */}
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium text-foreground truncate group-hover:text-purple-600 transition-colors duration-200">
                          {batch.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate group-hover:text-purple-500 transition-colors duration-200">
                          {batch.teacher_name}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </nav>

        {/* Bottom section with user profile dropdown */}
        <div className="mt-auto border-t border-border">
          <div className="p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`
                    profile-button w-full flex items-center rounded-md text-left border border-border
                    ${isCollapsed ? "justify-center p-2.5" : "space-x-3 px-3 py-3"}
                  `}
                >
                  <div className="profile-avatar w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 overflow-hidden">
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
                  
                  {!isCollapsed && (
                    <>
                      <div className="flex-1 min-w-0">
                        <p className="profile-name text-sm font-medium text-foreground truncate transition-all duration-200">
                          {getUserDisplayName()}
                        </p>
                        <p className="profile-role text-xs text-muted-foreground truncate capitalize transition-all duration-200">
                          {user.role}
                        </p>
                      </div>
                      <ChevronUp className="profile-chevron h-4 w-4 text-muted-foreground transition-all duration-200" />
                    </>
                  )}
                  
                  <div className="w-2 h-2 bg-green-500 rounded-full absolute -bottom-1 -right-1" title="Online" />
                </button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="start" side="top" className="w-56">
                <DropdownMenuLabel className="truncate">
                  Signed in as {user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* Profile Settings - Always available in dropdown */}
                <DropdownMenuItem onClick={() => router.push(`/${user.role}s/profile`)}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                
                
                
                {/* Logout Button */}
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-700">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </>
  );
}
