"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { SidebarLayout } from './sidebar-layout';
import { TopAppBar } from './top-app-bar';
import { BottomNav } from './bottom-nav';
import { SidebarDrawer } from './sidebar-drawer';

interface MobileAppShellProps {
  children: React.ReactNode;
  title?: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  searchValue?: string;
  rightAction?: React.ReactNode;
  className?: string;
}

/**
 * Mobile-First App Shell Component
 * Provides responsive layout with mobile-optimized navigation
 * - Desktop: Uses existing SidebarLayout
 * - Mobile: Uses TopAppBar + SidebarDrawer + BottomNav
 */
export function MobileAppShell({
  children,
  title = "Practical Portal",
  showSearch = false,
  searchPlaceholder = "Search...",
  onSearchChange,
  searchValue = "",
  rightAction,
  className = ""
}: MobileAppShellProps) {
  const { user } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchValue);

  // Handle search changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearchChange?.(value);
  };

  // Don't render if user is not loaded
  if (!user) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return (
    <div className={`min-h-screen bg-background ${className}`}>
      {/* Desktop Layout - Use existing SidebarLayout */}
      <div className="hidden md:block h-screen">
        <SidebarLayout>
          {children}
        </SidebarLayout>
      </div>

      {/* Mobile Layout - Custom mobile shell */}
      <div className="md:hidden flex flex-col h-screen">
        {/* Top App Bar */}
        <TopAppBar
          title={title}
          onMenuClick={() => setIsDrawerOpen(true)}
          showSearch={showSearch}
          searchPlaceholder={searchPlaceholder}
          onSearchChange={handleSearchChange}
          searchValue={searchQuery}
          rightAction={rightAction}
        />

        {/* Sidebar Drawer */}
        <SidebarDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto pt-14 pb-16">
          <div className="min-h-full">
            {children}
          </div>
        </main>

        {/* Bottom Navigation */}
        <BottomNav />
      </div>
    </div>
  );
}
