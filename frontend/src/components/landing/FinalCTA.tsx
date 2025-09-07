"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle, Users, Star } from "lucide-react";

/**
 * Final CTA Component
 * Bold headline with dual role CTAs and trust indicators
 * Uses shader-inspired color scheme and improved shadcn/ui components
 * Includes social proof and urgency elements
 */
export function FinalCTA() {
  return (
    <section id="get-started" className="py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Headline */}
          <div className="js-animate mb-8">
            <Badge variant="outline" className="mb-4 bg-white/10 text-white border-white/20">
              Get Started
            </Badge>
             <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
               <span className="text-white">Ready to Transform Your</span>
               <br />
               <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                 Practical Submissions?
               </span>
             </h2>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              Join thousands of teachers and students who&apos;ve already made the switch to a better way.
            </p>
          </div>

          {/* Trust Line */}
          <div className="js-animate mb-12">
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 max-w-2xl mx-auto">
              <CardContent className="p-4">
                <p className="text-lg text-white/90 flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Trusted by teachers and students to simplify practical submissions
                </p>
              </CardContent>
            </Card>
          </div>

          {/* CTA Buttons */}
          <div className="js-animate flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
            <Button 
              asChild 
              size="lg" 
              className="bg-white text-black hover:bg-gray-100 px-10 py-4 text-xl font-semibold rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 group"
            >
              <Link href="/auth/login?role=teacher">
                Login as Teacher
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            
            <Button 
              asChild 
              variant="outline" 
              size="lg"
              className="bg-transparent text-white border-2 border-white/50 hover:bg-white hover:text-black px-10 py-4 text-xl font-semibold rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 backdrop-blur-sm group"
            >
              <Link href="/auth/login?role=student">
                Login as Student
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>

          {/* Social Proof Stats */}
          <div className="js-animate grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardContent className="p-6 text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">10+</div>
                <div className="text-white/80">Active Users</div>
              </CardContent>
            </Card>
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardContent className="p-6 text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">50+</div>
                <div className="text-white/80">Submissions Processed</div>
              </CardContent>
            </Card>
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardContent className="p-6 text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">99.9%</div>
                <div className="text-white/80">Uptime Guarantee</div>
              </CardContent>
            </Card>
          </div>

          {/* Trust Indicators */}
          <div className="js-animate">
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 max-w-4xl mx-auto">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-white mb-6">
                  Why Choose Practical Portal?
                </h3>
                
                <div className="grid md:grid-cols-2 gap-6 text-left">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-300 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="text-white font-semibold mb-1">No More Blurry Photos</h4>
                      <p className="text-white/80 text-sm">Submit code directly without worrying about image quality</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-300 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="text-white font-semibold mb-1">Instant Feedback</h4>
                      <p className="text-white/80 text-sm">Get immediate responses and track your progress</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-300 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="text-white font-semibold mb-1">Organized Workflow</h4>
                      <p className="text-white/80 text-sm">Keep all submissions in one place, no more scattered files</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-300 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="text-white font-semibold mb-1">Time Saving</h4>
                      <p className="text-white/80 text-sm">Reduce submission time by 80% for both teachers and students</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Final Trust Line 
          <div className="js-animate mt-12">
            <Card className="bg-white/5 backdrop-blur-sm border-white/20 max-w-2xl mx-auto">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-white/80">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-300 fill-current" />
                    <span className="font-semibold">4.9/5 Rating</span>
                  </div>
                  <div className="hidden sm:block w-1 h-1 bg-white/40 rounded-full"></div>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-300" />
                    <span className="font-semibold">Trusted by 500+ Institutions</span>
                  </div>
                  <div className="hidden sm:block w-1 h-1 bg-white/40 rounded-full"></div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-300" />
                    <span className="font-semibold">Free to Start</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>*/}
        </div>
      </div>
    </section>
  );
}