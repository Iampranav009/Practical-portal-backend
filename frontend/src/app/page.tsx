"use client";

import { useEffect } from "react";
import ShaderBackground from "@/components/ui/shader-background"
import { Navbar } from "@/components/landing/Navbar"
import { Hero } from "@/components/landing/Hero"
import { ProblemSection } from "@/components/landing/ProblemSection"
import { ComparisonCards } from "@/components/landing/ComparisonCards"
import { FeaturesSplit } from "@/components/landing/FeaturesSplit"
import { Testimonials } from "@/components/landing/Testimonials"
import { FAQ } from "@/components/landing/FAQ"
import { FinalCTA } from "@/components/landing/FinalCTA"
import { Footer } from "@/components/landing/Footer"
import { initScrollAnimations } from "@/utils/observeInView"

/**
 * Landing Page Component
 * Complete story-driven landing page with all sections
 * Preserves existing ShaderBackground animation
 * Includes scroll animations and mobile responsiveness
 */
export default function Home() {
  // Initialize scroll animations on component mount
  useEffect(() => {
    initScrollAnimations();
  }, []);

  return (
    <div className="w-full min-h-screen">
      {/* Background Animation - PRESERVED AS REQUESTED */}
      <ShaderBackground />
      
      {/* Landing Page Components */}
      <Navbar />
      <Hero />
      
      {/* Black background sections */}
      <div className="bg-black">
        <ProblemSection />
        <ComparisonCards />
        <FeaturesSplit />
        <Testimonials />
        <FAQ />
        <FinalCTA />
        <Footer />
      </div>
      
      {/* Floating Chat Assistant */}
  
    </div>
  )
}
