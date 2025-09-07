"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, ChevronDown, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";

/**
 * Enhanced Navbar Component for Landing Page
 * Features sticky behavior, scroll effects, and mobile responsiveness
 * Uses shader-inspired color scheme and improved shadcn/ui components
 * Includes smooth scrolling to sections and backdrop blur on scroll
 */
export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginDropdownOpen, setIsLoginDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  
  // Get authentication state
  const { user, logout, loading } = useAuth();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobileMenuOpen && !(event.target as Element).closest('.mobile-menu')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobileMenuOpen]);

  // Close login dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isLoginDropdownOpen && !(event.target as Element).closest('.login-dropdown')) {
        setIsLoginDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isLoginDropdownOpen]);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isUserDropdownOpen && !(event.target as Element).closest('.user-dropdown')) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isUserDropdownOpen]);

  // Smooth scroll to section
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  // Handle user logout
  const handleLogout = async () => {
    try {
      await logout();
      setIsUserDropdownOpen(false);
      // Redirect to home page after logout
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-black/80 backdrop-blur-md shadow-lg border-b border-white/10' 
          : 'bg-transparent'
      }`}
    >
      {/* Animated gradient bar */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-[gradient-move_6s_linear_infinite]" />
      
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link href="/" className="group flex items-center space-x-2">
              <div className="relative h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
                <span className="text-primary-foreground font-bold text-sm">PP</span>
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-lg bg-[radial-gradient(ellipse_at_center,hsla(var(--primary)/.35),transparent_60%)] opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent bg-[length:200%_100%] animate-[gradient-move_8s_linear_infinite]">
                Practical Portal
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => scrollToSection('features')}
              className="group relative text-white/80 hover:text-white transition-all duration-300 font-medium py-2"
            >
              Features
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 transition-all duration-300 group-hover:w-full"></span>
            </button>
            <button 
              onClick={() => scrollToSection('testimonials')}
              className="group relative text-white/80 hover:text-white transition-all duration-300 font-medium py-2"
            >
              Testimonials
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 transition-all duration-300 group-hover:w-full"></span>
            </button>
            <button 
              onClick={() => scrollToSection('faq')}
              className="group relative text-white/80 hover:text-white transition-all duration-300 font-medium py-2"
            >
              FAQ
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 transition-all duration-300 group-hover:w-full"></span>
            </button>
            <button 
              onClick={() => scrollToSection('contact')}
              className="group relative text-white/80 hover:text-white transition-all duration-300 font-medium py-2"
            >
              Contact
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 transition-all duration-300 group-hover:w-full"></span>
            </button>
          </div>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {loading ? (
              // Show loading state while checking authentication
              <div className="text-white/60 text-sm">Loading...</div>
            ) : user ? (
              // Show user info and logout when logged in
              <div className="flex items-center space-x-3">
                <div className="relative user-dropdown">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                    className="text-white/80 hover:text-white hover:bg-white/10 flex items-center gap-2 transition-all duration-300 hover:scale-105 group"
                  >
                    <User className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                    {user.email}
                    <ChevronDown className="h-4 w-4 transition-transform duration-300 group-hover:rotate-180" />
                  </Button>
                  
                  {isUserDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-black/90 backdrop-blur-md rounded-lg shadow-lg border border-white/20 py-2">
                      <div className="px-4 py-2 text-sm text-white/60 border-b border-white/10">
                        {user.role === 'teacher' ? 'Teacher' : 'Student'}
                      </div>
                      <Link 
                        href={user.role === 'teacher' ? '/teachers/dashboard' : '/students/my-batches'}
                        className="block px-4 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
                        onClick={() => setIsUserDropdownOpen(false)}
                      >
                        Go to Dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white flex items-center gap-2"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Show login and signup buttons when not logged in
              <>
                {/* Login Dropdown */}
                <div className="relative login-dropdown">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setIsLoginDropdownOpen(!isLoginDropdownOpen)}
                    className="text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300 hover:scale-105 group"
                  >
                    Login
                    <ChevronDown className="h-4 w-4 ml-1 transition-transform duration-300 group-hover:rotate-180" />
                  </Button>
                  
                  {isLoginDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-black/90 backdrop-blur-md rounded-lg shadow-lg border border-white/20 py-2">
                      <Link 
                        href="/auth/login?role=teacher"
                        className="block px-4 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
                        onClick={() => setIsLoginDropdownOpen(false)}
                      >
                        Login as Teacher
                      </Link>
                      <Link 
                        href="/auth/login?role=student"
                        className="block px-4 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
                        onClick={() => setIsLoginDropdownOpen(false)}
                      >
                        Login as Student
                      </Link>
                    </div>
                  )}
                </div>

                <Button asChild size="sm" className="bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/25">
                  <Link href="/auth/signup">
                    Get Started
                  </Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-white hover:bg-white/10 transition-all duration-300 hover:scale-110 group"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" />
              ) : (
                <Menu className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="mobile-menu md:hidden absolute top-16 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-white/10 shadow-lg">
            <div className="px-4 py-6 space-y-4">
              <button 
                onClick={() => scrollToSection('features')}
                className="group block w-full text-left text-white/80 hover:text-white transition-all duration-300 font-medium py-2 hover:translate-x-2"
              >
                <span className="relative">
                  Features
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 transition-all duration-300 group-hover:w-full"></span>
                </span>
              </button>
              <button 
                onClick={() => scrollToSection('testimonials')}
                className="group block w-full text-left text-white/80 hover:text-white transition-all duration-300 font-medium py-2 hover:translate-x-2"
              >
                <span className="relative">
                  Testimonials
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 transition-all duration-300 group-hover:w-full"></span>
                </span>
              </button>
              <button 
                onClick={() => scrollToSection('faq')}
                className="group block w-full text-left text-white/80 hover:text-white transition-all duration-300 font-medium py-2 hover:translate-x-2"
              >
                <span className="relative">
                  FAQ
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 transition-all duration-300 group-hover:w-full"></span>
                </span>
              </button>
              <button 
                onClick={() => scrollToSection('contact')}
                className="group block w-full text-left text-white/80 hover:text-white transition-all duration-300 font-medium py-2 hover:translate-x-2"
              >
                <span className="relative">
                  Contact
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 transition-all duration-300 group-hover:w-full"></span>
                </span>
              </button>
              
              <div className="pt-4 border-t border-white/10 space-y-3">
                {user ? (
                  // Show user info and logout when logged in
                  <>
                    <div className="text-center text-white/80 py-2">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <User className="h-4 w-4" />
                        <span className="font-medium">{user.email}</span>
                      </div>
                      <div className="text-sm text-white/60">
                        {user.role === 'teacher' ? 'Teacher' : 'Student'}
                      </div>
                    </div>
                    <Link 
                      href={user.role === 'teacher' ? '/teachers/dashboard' : '/students/my-batches'}
                      className="block w-full text-center text-white/80 hover:text-white transition-colors duration-200 font-medium py-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Go to Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full text-center text-white/80 hover:text-white transition-colors duration-200 font-medium py-2 flex items-center justify-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </>
                ) : (
                  // Show login and signup buttons when not logged in
                  <>
                    <Link 
                      href="/auth/login?role=teacher"
                      className="block w-full text-center text-white/80 hover:text-white transition-colors duration-200 font-medium py-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Login as Teacher
                    </Link>
                    <Link 
                      href="/auth/login?role=student"
                      className="block w-full text-center text-white/80 hover:text-white transition-colors duration-200 font-medium py-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Login as Student
                    </Link>
                    <Button asChild className="w-full bg-primary hover:bg-primary/90">
                      <Link href="/auth/signup" onClick={() => setIsMobileMenuOpen(false)}>
                        Get Started
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}