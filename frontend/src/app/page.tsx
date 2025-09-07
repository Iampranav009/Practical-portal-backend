"use client";

import SimpleBackground from "@/components/ui/simple-background"
import { Navbar } from "@/components/landing/Navbar"
import { Hero } from "@/components/landing/Hero"
import { ProblemSection } from "@/components/landing/ProblemSection"
import { ComparisonCards } from "@/components/landing/ComparisonCards"
import { FeaturesSplit } from "@/components/landing/FeaturesSplit"
import { Testimonials } from "@/components/landing/Testimonials"
import { FAQ } from "@/components/landing/FAQ"
import { FinalCTA } from "@/components/landing/FinalCTA"
import { Footer } from "@/components/landing/Footer"
/**
 * Landing Page Component
 * Complete story-driven landing page with all sections
 * Optimized for instant loading without any delays
 * No animations or transitions for maximum speed
 */
export default function Home() {
  // No animations - instant loading

  return (
    <div className="w-full min-h-screen">
      {/* Fast Loading Background */}
      <SimpleBackground />
      
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
