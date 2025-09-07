"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, GraduationCap, CheckCircle, ArrowRight, Sparkles, Star, Zap, Shield, Clock, BarChart3, FileText, MessageSquare, Upload, Eye, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

/**
 * Enhanced Comparison Cards Component
 * Premium, animated role selection with advanced shadcn/ui components
 * Features hover effects, gradient backgrounds, and smooth animations
 * Makes this section a centerpiece of the landing page
 */
export function ComparisonCards() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const teacherBenefits = [
    {
      icon: <Users className="w-5 h-5" />,
      text: "Create and manage multiple batches",
      highlight: "Batch Management"
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      text: "Send announcements to all students",
      highlight: "Communication"
    },
    {
      icon: <CheckCircle className="w-5 h-5" />,
      text: "Review submissions with one-click approval",
      highlight: "Quick Approval"
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      text: "Track submission analytics and progress",
      highlight: "Analytics"
    },
    {
      icon: <Shield className="w-5 h-5" />,
      text: "Secure file storage and access control",
      highlight: "Security"
    },
    {
      icon: <Award className="w-5 h-5" />,
      text: "Grade and provide detailed feedback",
      highlight: "Grading"
    }
  ];

  const studentBenefits = [
    {
      icon: <Upload className="w-5 h-5" />,
      text: "Submit code directly (no photos needed)",
      highlight: "Direct Upload"
    },
    {
      icon: <FileText className="w-5 h-5" />,
      text: "Upload files and documents easily",
      highlight: "File Management"
    },
    {
      icon: <Eye className="w-5 h-5" />,
      text: "Track submission status in real-time",
      highlight: "Real-time Tracking"
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      text: "Receive instant feedback and comments",
      highlight: "Instant Feedback"
    },
    {
      icon: <Clock className="w-5 h-5" />,
      text: "Never miss deadlines with smart reminders",
      highlight: "Deadline Alerts"
    },
    {
      icon: <Zap className="w-5 h-5" />,
      text: "Lightning-fast submission process",
      highlight: "Speed"
    }
  ];

  return (
    <section id="comparison" className="py-16 bg-black relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        {/* Enhanced Section Header */}
        <div className="text-center mb-16 js-animate">
          <Badge 
            variant="outline" 
            className="mb-6 bg-white/10 text-white border-white/20 px-6 py-2 text-sm font-medium backdrop-blur-sm"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Choose Your Role
          </Badge>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            <span className="text-white">Built for</span>{" "}
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Everyone
            </span>
          </h2>
          
          <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            Practical Portal works differently for teachers and students. 
            <br className="hidden md:block" />
            Experience the power of role-based design.
          </p>
        </div>

        {/* Enhanced Cards Container - Smaller and More Compact */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Teacher Card - Compact Rounded Design */}
          <Card 
            className={`js-animate group relative overflow-hidden transition-all duration-500 transform hover:scale-105 rounded-3xl ${
              hoveredCard === 'teacher' 
                ? 'bg-white/10 border-white/30 shadow-2xl shadow-white/10' 
                : 'bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/8'
            }`}
            onMouseEnter={() => setHoveredCard('teacher')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <CardHeader className="text-center pb-6 relative z-10">
              <CardTitle className="text-2xl md:text-3xl font-bold text-white mb-3 flex items-center justify-center gap-3">
                <Users className="w-7 h-7 text-blue-400" />
                For Teachers
              </CardTitle>
              
              <p className="text-white/70 text-sm leading-relaxed">
                Complete control over practical submissions and student management
              </p>
            </CardHeader>

            <CardContent className="pt-0 relative z-10">
              {/* Compact Benefits List */}
              <div className="space-y-3 mb-6">
                {teacherBenefits.slice(0, 4).map((benefit, index) => (
                  <div 
                    key={index} 
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-all duration-300 group/benefit"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover/benefit:scale-110 group-hover/benefit:bg-blue-500/30 transition-all duration-300">
                      {benefit.icon}
                    </div>
                    <div className="flex-1">
                      <div className="text-white/90 font-medium text-sm mb-1">{benefit.highlight}</div>
                      <div className="text-white/70 text-xs">{benefit.text}</div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="mb-6 bg-white/10" />

              {/* White CTA Button with Animation */}
              <Button 
                asChild 
                size="lg"
                className="w-full bg-white text-black hover:bg-white/90 border-0 px-6 py-3 text-base font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group/button"
              >
                <Link href="/auth/login?role=teacher">
                  Get Started as Teacher
                  <ArrowRight className="w-4 h-4 ml-2 group-hover/button:translate-x-1 transition-transform duration-300" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Student Card - Compact Rounded Design */}
          <Card 
            className={`js-animate group relative overflow-hidden transition-all duration-500 transform hover:scale-105 rounded-3xl ${
              hoveredCard === 'student' 
                ? 'bg-white/10 border-white/30 shadow-2xl shadow-white/10' 
                : 'bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/8'
            }`}
            onMouseEnter={() => setHoveredCard('student')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <CardHeader className="text-center pb-6 relative z-10">
              <CardTitle className="text-2xl md:text-3xl font-bold text-white mb-3 flex items-center justify-center gap-3">
                <GraduationCap className="w-7 h-7 text-green-400" />
                For Students
              </CardTitle>
              
              <p className="text-white/70 text-sm leading-relaxed">
                Simple, fast, and reliable way to submit your practical work
              </p>
            </CardHeader>

            <CardContent className="pt-0 relative z-10">
              {/* Compact Benefits List */}
              <div className="space-y-3 mb-6">
                {studentBenefits.slice(0, 4).map((benefit, index) => (
                  <div 
                    key={index} 
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-all duration-300 group/benefit"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400 group-hover/benefit:scale-110 group-hover/benefit:bg-green-500/30 transition-all duration-300">
                      {benefit.icon}
                    </div>
                    <div className="flex-1">
                      <div className="text-white/90 font-medium text-sm mb-1">{benefit.highlight}</div>
                      <div className="text-white/70 text-xs">{benefit.text}</div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="mb-6 bg-white/10" />

              {/* White CTA Button with Animation */}
              <Button 
                asChild 
                size="lg"
                className="w-full bg-white text-black hover:bg-white/90 border-0 px-6 py-3 text-base font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group/button"
              >
                <Link href="/auth/login?role=student">
                  Get Started as Student
                  <ArrowRight className="w-4 h-4 ml-2 group-hover/button:translate-x-1 transition-transform duration-300" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

      </div>
    </section>
  );
}