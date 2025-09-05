"use client";

import React from 'react';
import { Menu, Search, Bell, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth-context';

interface TopAppBarProps {
  title: string;
  onMenuClick: () => void;
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  searchValue?: string;
  rightAction?: React.ReactNode;
  className?: string;
}

/**
 * Top App Bar Component for Mobile
 * Provides a consistent header with hamburger menu, title, and optional search/actions
 * Designed for mobile-first responsive design
 */
export function TopAppBar({
  title,
  onMenuClick,
  showSearch = false,
  searchPlaceholder = "Search...",
  onSearchChange,
  searchValue = "",
  rightAction,
  className = ""
}: TopAppBarProps) {
  const { user } = useAuth();

  return (
    <header 
      className={`
        fixed top-0 left-0 right-0 z-40 
        bg-background/95 backdrop-blur-sm border-b border-border
        px-safe-left pr-safe-right pt-safe-top
        h-14 flex items-center justify-between
        md:hidden
        ${className}
      `}
    >
      {/* Left: Hamburger Menu */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onMenuClick}
        className="h-10 w-10 p-0 ml-2"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Center: Title or Search */}
      <div className="flex-1 mx-3">
        {showSearch ? (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="pl-10 h-9 text-sm"
            />
          </div>
        ) : (
          <h1 className="text-lg font-semibold text-foreground truncate">
            {title}
          </h1>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 mr-2">
        {rightAction || (
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 p-0"
            aria-label="User profile"
          >
            <User className="h-5 w-5" />
          </Button>
        )}
      </div>
    </header>
  );
}
