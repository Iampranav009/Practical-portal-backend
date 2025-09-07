"use client";

import { useState } from "react";
import Link from "next/link";
import { X, Users, GraduationCap, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * LoginModal Component
 * Reusable modal for role-based authentication
 * Accepts role prop (teacher|student) and shows relevant information
 * Includes form fields and role-specific benefits
 */
interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  role?: 'teacher' | 'student';
}

export function LoginModal({ isOpen, onClose, role = 'teacher' }: LoginModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false
  });

  const teacherBenefits = [
    "Create and manage multiple batches",
    "Send announcements to students",
    "Review submissions with one-click approval",
    "Track analytics and student progress",
    "Export data for grading systems"
  ];

  const studentBenefits = [
    "Submit code directly (no photos needed)",
    "Upload files and documents easily",
    "Track submission status in real-time",
    "Receive instant feedback and comments",
    "Resubmit if needed with full history"
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle login logic here
    console.log('Login attempt:', { ...formData, role });
    // For now, just redirect to the appropriate login page
    window.location.href = `/auth/login?role=${role}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex flex-col lg:flex-row h-full">
          {/* Left Side - Role Information */}
          <div className={`lg:w-1/2 p-8 ${
            role === 'teacher' 
              ? 'bg-gradient-to-br from-blue-50 to-blue-100' 
              : 'bg-gradient-to-br from-green-50 to-green-100'
          }`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                role === 'teacher' ? 'bg-blue-500' : 'bg-green-500'
              } text-white`}>
                {role === 'teacher' ? <Users className="w-6 h-6" /> : <GraduationCap className="w-6 h-6" />}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {role === 'teacher' ? 'Teacher' : 'Student'} Login
                </h2>
                <p className="text-gray-600">
                  {role === 'teacher' ? 'Manage your practical batches' : 'Submit your practical work'}
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                What you get as a {role}:
              </h3>
              {(role === 'teacher' ? teacherBenefits : studentBenefits).map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>

            <div className="bg-white/50 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                <strong>New to Practical Portal?</strong> Sign up is free and takes less than 2 minutes. 
                You can start using it immediately after registration.
              </p>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="lg:w-1/2 p-8">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="max-w-sm mx-auto">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Welcome Back
                </h3>
                <p className="text-gray-600">
                  Sign in to your {role} account
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Enter your password"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="remember"
                      checked={formData.remember}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <span className="ml-2 text-sm text-gray-600">Remember me</span>
                  </label>
                  <a href="#" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </a>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-white py-3 text-lg font-semibold group"
                >
                  Sign In as {role === 'teacher' ? 'Teacher' : 'Student'}
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </form>

              {/* Divider */}
              <div className="my-6 flex items-center">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="px-4 text-sm text-gray-500">or</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              {/* Sign Up Link */}
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Don&apos;t have an account?
                </p>
                <Link
                  href={`/auth/signup?role=${role}`}
                  className="inline-flex items-center text-primary hover:underline font-medium"
                >
                  Create {role} account
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>

              {/* Role Switch */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-center text-sm text-gray-600 mb-3">
                  Looking for {role === 'teacher' ? 'student' : 'teacher'} features?
                </p>
                <Link
                  href={`/auth/login?role=${role === 'teacher' ? 'student' : 'teacher'}`}
                  className="block w-full text-center py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Switch to {role === 'teacher' ? 'Student' : 'Teacher'} Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
