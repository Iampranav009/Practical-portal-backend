"use client";

import { Users, BarChart3, Bell, FileText, Code, Upload, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Features Split Component
 * Alternating image/text sections for Teacher and Student features
 * Uses darker shader-inspired color scheme and improved shadcn/ui components
 * Responsive design with mobile-first approach
 */
export function FeaturesSplit() {
  const teacherFeatures = [
    {
      icon: <Users className="w-6 h-6" />,
      title: "Batch Management",
      description: "Create, organize, and manage multiple practical batches with ease."
    },
    {
      icon: <Bell className="w-6 h-6" />,
      title: "Smart Notifications",
      description: "Send announcements and get notified about new submissions instantly."
    },
    {
      icon: <CheckCircle className="w-6 h-6" />,
      title: "One-Click Approval",
      description: "Review and approve/reject submissions with a single click."
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Analytics Dashboard",
      description: "Track submission patterns, student progress, and assignment statistics."
    }
  ];

  const studentFeatures = [
    {
      icon: <Code className="w-6 h-6" />,
      title: "Direct Code Submission",
      description: "Paste your code directly - no more blurry photos or screenshots."
    },
    {
      icon: <Upload className="w-6 h-6" />,
      title: "File Upload Support",
      description: "Upload documents, images, and other files alongside your code."
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Real-time Status",
      description: "Track your submission status and get instant feedback from teachers."
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Submission History",
      description: "View all your past submissions and track your improvement over time."
    }
  ];

  return (
    <section id="features" className="py-20">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16 js-animate">
          <Badge variant="outline" className="mb-4 bg-white/10 text-white border-white/20">
            Features
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-white">Powerful</span>{" "}
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Features
            </span>
          </h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Everything you need to manage practical submissions efficiently, whether you&apos;re teaching or learning.
          </p>
        </div>

        {/* Teacher Features Section */}
        <div className="mb-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className="js-animate">
              <Badge variant="secondary" className="mb-6 bg-blue-500/20 text-blue-200 border-blue-500/30">
                <Users className="w-4 h-4 mr-2" />
                For Teachers
              </Badge>
              
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Complete Control Over Your Practicals
              </h3>
              
              <p className="text-lg text-white/80 mb-8 leading-relaxed">
                Manage multiple batches, track student progress, and provide feedback all in one place. 
                No more scattered submissions or lost work.
              </p>

              <div className="space-y-6">
                {teacherFeatures.map((feature, index) => (
                  <Card key={index} className="bg-white/5 backdrop-blur-sm border-white/5 hover:bg-white/10 transition-all duration-300 border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-300">
                          {feature.icon}
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-white mb-1">
                            {feature.title}
                          </h4>
                          <p className="text-white/70">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Image Placeholder */}
            <div className="js-animate">
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardContent className="p-8 h-96 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-32 h-32 bg-blue-500/20 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                      <Users className="w-16 h-16 text-blue-300" />
                    </div>
                    <p className="text-blue-200 font-medium">Teacher Dashboard Preview</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Student Features Section */}
        <div className="mb-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Image Placeholder */}
            <div className="js-animate lg:order-1 order-2">
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardContent className="p-8 h-96 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-32 h-32 bg-green-500/20 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                      <Code className="w-16 h-16 text-green-300" />
                    </div>
                    <p className="text-green-200 font-medium">Student Interface Preview</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Content */}
            <div className="js-animate lg:order-2 order-1">
              <Badge variant="secondary" className="mb-6 bg-green-500/20 text-green-200 border-green-500/30">
                <Code className="w-4 h-4 mr-2" />
                For Students
              </Badge>
              
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Submit Your Best Work, Every Time
              </h3>
              
              <p className="text-lg text-white/80 mb-8 leading-relaxed">
                Focus on writing great code instead of taking perfect photos. 
                Submit directly, track your progress, and get feedback instantly.
              </p>

              <div className="space-y-6">
                {studentFeatures.map((feature, index) => (
                  <Card key={index} className="bg-white/5 backdrop-blur-sm border-white/5 hover:bg-white/10 transition-all duration-300 border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center text-green-300">
                          {feature.icon}
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-white mb-1">
                            {feature.title}
                          </h4>
                          <p className="text-white/70">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Features Grid */}
        <div className="js-animate">
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-white text-center mb-8">
                Why Choose Practical Portal?
              </h3>
              
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-primary" />
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">
                    Reliable & Secure
                  </h4>
                  <p className="text-white/70 text-sm">
                    Your submissions are safe with enterprise-grade security and 99.9% uptime.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-accent" />
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">
                    Time Saving
                  </h4>
                  <p className="text-white/70 text-sm">
                    Reduce submission time by 80% and eliminate the need for photo management.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-green-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">
                    Easy to Use
                  </h4>
                  <p className="text-white/70 text-sm">
                    Intuitive interface that works for both technical and non-technical users.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}