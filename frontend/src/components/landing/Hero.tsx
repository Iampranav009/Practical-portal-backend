"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowDown } from "lucide-react";

/**
 * Hero Section Component
 * Preserves existing ShaderBackground animation - DO NOT MODIFY background
 * Uses shader-inspired color scheme and improved shadcn/ui components
 * Features dual CTAs for Teacher and Student roles
 */
export function Hero() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Content Container */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 text-center">
        
        {/* Main headline - More compact */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight">
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Transform Your
          </span>
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Practical Experience
          </span>
          <br />
          <span className="text-white/90 text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
            Forever
          </span>
        </h1>
        
        {/* Compact descriptive paragraph */}
        <p className="text-lg sm:text-xl text-white/90 max-w-4xl mx-auto mb-6 leading-relaxed">
          Say goodbye to blurry photos, WhatsApp chaos, and lost submissions. 
          <br className="hidden sm:block" />
          <span className="text-white font-semibold">Experience the future of practical submission</span> with our intelligent platform.
        </p>

        {/* Compact value proposition */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="flex flex-wrap justify-center items-center gap-4 text-white/80 text-base">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>No More Blurry Photos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>Storage for all your practicals</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span>Organized Workflow</span>
            </div>
          </div>
        </div>
        
        {/* Enhanced call-to-action buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
          <Button 
            asChild 
            size="lg" 
            className="bg-white text-black hover:bg-gray-100 px-10 py-4 text-xl font-semibold rounded-xl shadow-2xl hover:shadow-3xl"
          >
            <Link href="/auth/login?role=teacher">
              Login as Teacher
            </Link>
          </Button>
          
          <Button 
            asChild 
            variant="outline" 
            size="lg"
            className="bg-transparent text-white border-2 border-white/50 hover:bg-white hover:text-black px-10 py-4 text-xl font-semibold rounded-xl shadow-2xl hover:shadow-3xl backdrop-blur-sm"
          >
            <Link href="/auth/login?role=student">
              Login as Student
            </Link>
          </Button>
        </div>

      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="flex flex-col items-center gap-2 text-white/60 hover:text-white cursor-pointer">
          <span className="text-sm font-medium">.</span>
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center hover:border-white/50">
            <ArrowDown className="w-4 h-4 mt-2 animate-bounce" />
          </div>
        </div>
      </div>
    </div>
  );
}