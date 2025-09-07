"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Mail, Phone, MapPin, Github, Twitter, Linkedin, ChevronDown, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";

/**
 * Footer Component
 * Multi-column layout with links, newsletter signup, and social icons
 * Uses shader-inspired color scheme and improved shadcn/ui components
 * Includes legal links and contact information
 */
export function Footer() {
  const currentYear = new Date().getFullYear();
  const [isLoginDropdownOpen, setIsLoginDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  
  // Get authentication state
  const { user, logout, loading } = useAuth();

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

  const socialLinks = [
    { name: "GitHub", icon: Github, href: "#github" },
    { name: "Twitter", icon: Twitter, href: "#twitter" },
    { name: "LinkedIn", icon: Linkedin, href: "#linkedin" }
  ];

  const quickLinks = [
    { name: "Features", href: "#features" },
    { name: "Testimonials", href: "#testimonials" },
    { name: "FAQ", href: "#faq" },
    { name: "Contact", href: "#contact" }
  ];


  return (
    <footer id="contact" className="bg-black text-white border-t border-white/20">
      <div className="container mx-auto px-4">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-8">
              {/* Brand Column */}
              <div className="lg:col-span-1">
                <div className="mb-6">
                  <Link href="/" className="group flex items-center space-x-2">
                    <div className="relative h-10 w-10 rounded-lg bg-primary flex items-center justify-center shadow-sm">
                      <span className="text-primary-foreground font-bold text-lg">PP</span>
                      <div className="absolute inset-0 rounded-lg bg-[radial-gradient(ellipse_at_center,hsla(var(--primary)/.35),transparent_60%)] opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                      Practical Portal
                    </span>
                  </Link>
                </div>
                
                <p className="text-gray-400 mb-6 leading-relaxed">
                  The essential platform for managing practical submissions. 
                  No more blurry photos, no more WhatsApp chaos. Just clean, 
                  efficient code submission and feedback.
                </p>

                {/* Contact Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-400">
                    <Mail className="w-4 h-4" />
                    <a href="mailto:support@practicalportal.com" className="hover:text-white transition-colors">
                      support.practicalportal@gmail.com
                    </a>
                  </div>
                  <div className="flex items-center gap-3 text-gray-400">
                    <Phone className="w-4 h-4" />
                    <a href="tel:+919156332109" className="hover:text-white transition-colors">
                      +91 9156332109
                    </a>
                  </div>
                  <div className="flex items-center gap-3 text-gray-400">
                    <MapPin className="w-4 h-4" />
                    <span>India</span>
                  </div>
                </div>
              </div>

              {/* Quick Links Column */}
              <div>
                <h3 className="text-lg font-semibold mb-6 text-white">Quick Access</h3>
                <ul className="space-y-3">
                  {quickLinks.map((link) => (
                    <li key={link.name}>
                      <button
                        onClick={() => scrollToSection(link.href)}
                        className="text-gray-400 hover:text-white transition-colors text-left"
                      >
                        {link.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Login & CTA Column */}
              <div>
                <h3 className="text-lg font-semibold mb-6 text-white">Get Started</h3>
                <div className="space-y-4">
                  {loading ? (
                    // Show loading state while checking authentication
                    <div className="text-center text-gray-400 text-sm py-2">Loading...</div>
                  ) : user ? (
                    // Show user info and logout when logged in
                    <>
                      <div className="relative user-dropdown">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                          className="w-full justify-between text-gray-300 border-gray-600 hover:bg-gray-800 hover:text-white flex items-center gap-2"
                        >
                          <User className="h-4 w-4" />
                          {user.email}
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        
                        {isUserDropdownOpen && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-2 z-10">
                            <div className="px-4 py-2 text-sm text-gray-400 border-b border-gray-600">
                              {user.role === 'teacher' ? 'Teacher' : 'Student'}
                            </div>
                            <Link 
                              href={user.role === 'teacher' ? '/teachers/dashboard' : '/students/my-batches'}
                              className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                              onClick={() => setIsUserDropdownOpen(false)}
                            >
                              Go to Dashboard
                            </Link>
                            <button
                              onClick={handleLogout}
                              className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center gap-2"
                            >
                              <LogOut className="h-4 w-4" />
                              Logout
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    // Show login and signup buttons when not logged in
                    <>
                      {/* Login Dropdown */}
                      <div className="relative login-dropdown">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setIsLoginDropdownOpen(!isLoginDropdownOpen)}
                          className="w-full justify-between text-gray-300 border-gray-600 hover:bg-gray-800 hover:text-white"
                        >
                          Login
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        
                        {isLoginDropdownOpen && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-2 z-10">
                            <Link 
                              href="/auth/login?role=teacher"
                              className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                              onClick={() => setIsLoginDropdownOpen(false)}
                            >
                              Login as Teacher
                            </Link>
                            <Link 
                              href="/auth/login?role=student"
                              className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                              onClick={() => setIsLoginDropdownOpen(false)}
                            >
                              Login as Student
                            </Link>
                          </div>
                        )}
                      </div>

                      {/* Get Started Button */}
                      <Button asChild className="w-full bg-primary hover:bg-primary/90">
                        <Link href="/auth/signup">
                          Get Started
                        </Link>
                      </Button>
                    </>
                  )}

                  {/* Social Links */}
                  <div className="pt-4">
                    <p className="text-sm text-gray-400 mb-3">Follow Us</p>
                    <div className="flex items-center gap-3">
                      {socialLinks.map((social) => (
                        <a
                          key={social.name}
                          href={social.href}
                          className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
                          aria-label={social.name}
                        >
                          <social.icon className="w-5 h-5" />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Footer */}
        <div className="py-6 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <div className="text-gray-400 text-sm">
              © {currentYear} Practical Portal. All rights reserved.
            </div>

            {/* Attribution */}
            <div className="text-sm text-gray-400">
              Made by Pranav Shinde
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}