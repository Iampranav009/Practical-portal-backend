"use client";

import React, { useState, useEffect } from 'react';
import { ModernSidebar } from '@/components/ui/modern-side-bar';

interface SidebarLayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Sidebar Layout Component
 * Wraps pages with the modern sidebar navigation
 * Provides consistent layout structure for both student and teacher dashboards
 * Handles sidebar collapse state properly for content expansion
 */
export function SidebarLayout({ children, className = "" }: SidebarLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Listen for sidebar collapse state changes
  useEffect(() => {
    const handleSidebarToggle = (event: CustomEvent) => {
      setIsCollapsed(event.detail.isCollapsed);
    };

    // Listen for custom events from ModernSidebar
    window.addEventListener('sidebar-toggle', handleSidebarToggle as EventListener);
    
    return () => {
      window.removeEventListener('sidebar-toggle', handleSidebarToggle as EventListener);
    };
  }, []);

  return (
    <div className="no-page-scroll bg-background flex">
      {/* Fixed Sidebar */}
      <div className="fixed left-0 top-0 h-full z-40">
        <ModernSidebar />
      </div>
      
      {/* Main Content Area - Adjusts margin based on sidebar state */}
      <div className={`flex-1 ml-0 ${isCollapsed ? 'md:ml-20' : 'md:ml-72'} h-full flex flex-col transition-all duration-300 ${className}`}>
        <main className="h-full overflow-y-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}

/**
 * Alternative layout without sidebar for public pages
 */
export function PublicLayout({ children, className = "" }: SidebarLayoutProps) {
  return (
    <div className={`min-h-screen bg-background ${className}`}>
      {children}
    </div>
  );
}
