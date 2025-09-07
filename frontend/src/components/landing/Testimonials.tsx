"use client";

import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Star, Quote } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import "./testimonials.css";

/**
 * Testimonials Component
 * Horizontal scroll-snap gallery with navigation arrows
 * Uses shader-inspired color scheme and improved shadcn/ui components
 * Pure CSS scroll-snap with optional JS for arrow navigation
 */
export function Testimonials() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const testimonials = [
    {
      name: "Dr. Sarah Johnson",
      role: "Computer Science Professor",
      university: "MIT",
      avatar: "SJ",
      rating: 5,
      quote: "Practical Portal has completely transformed how I manage practical submissions. No more blurry photos or lost submissions. My students love the direct code submission feature.",
      color: "bg-blue-500"
    },
    {
      name: "Alex Chen",
      role: "Computer Science Student",
      university: "Stanford University",
      avatar: "AC",
      rating: 5,
      quote: "Finally, a platform that understands students! I can submit my code directly without worrying about photo quality. The feedback system is amazing.",
      color: "bg-green-500"
    },
    {
      name: "Prof. Michael Rodriguez",
      role: "Software Engineering Lecturer",
      university: "UC Berkeley",
      avatar: "MR",
      rating: 5,
      quote: "The analytics dashboard gives me insights I never had before. I can track student progress, identify struggling students, and improve my teaching methods.",
      color: "bg-purple-500"
    },
    {
      name: "Emily Watson",
      role: "Computer Science Student",
      university: "Harvard University",
      avatar: "EW",
      rating: 5,
      quote: "The real-time status updates are a game-changer. I always know where my submission stands and can resubmit if needed. So much better than WhatsApp!",
      color: "bg-pink-500"
    },
    {
      name: "Dr. James Wilson",
      role: "Department Head",
      university: "Carnegie Mellon",
      avatar: "JW",
      rating: 5,
      quote: "We&apos;ve seen a 90% reduction in submission-related issues since implementing Practical Portal. It&apos;s become an essential tool for our department.",
      color: "bg-indigo-500"
    },
    {
      name: "Lisa Park",
      role: "Computer Science Student",
      university: "Caltech",
      avatar: "LP",
      rating: 5,
      quote: "The interface is so intuitive. I can submit assignments in seconds instead of minutes. The submission history feature helps me track my improvement.",
      color: "bg-teal-500"
    }
  ];

  const scrollToIndex = (index: number) => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const itemWidth = container.scrollWidth / testimonials.length;
      container.scrollTo({
        left: index * itemWidth,
        behavior: 'smooth'
      });
      setCurrentIndex(index);
    }
  };

  const scrollPrevious = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : testimonials.length - 1;
    scrollToIndex(newIndex);
  };

  const scrollNext = () => {
    const newIndex = currentIndex < testimonials.length - 1 ? currentIndex + 1 : 0;
    scrollToIndex(newIndex);
  };

  return (
    <section id="testimonials" className="py-20">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16 js-animate">
          <Badge variant="outline" className="mb-4 bg-white/10 text-white border-white/20">
            Testimonials
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-white">What Our</span>{" "}
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Users Say
            </span>
          </h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Join thousands of teachers and students who&apos;ve transformed their practical submission workflow.
          </p>
        </div>

        {/* Testimonials Container */}
        <div className="relative max-w-6xl mx-auto">
          {/* Navigation Arrows */}
          <Button
            onClick={scrollPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-white hover:bg-white/20 hover:shadow-xl transition-all duration-200 border-white/20"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>

          <Button
            onClick={scrollNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-white hover:bg-white/20 hover:shadow-xl transition-all duration-200 border-white/20"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>

          {/* Scrollable Testimonials */}
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth testimonials-scroll"
          >
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-full md:w-1/2 lg:w-1/3 snap-center"
              >
                <Card className="js-animate bg-white/5 backdrop-blur-sm border-white/10 h-full flex flex-col hover:bg-white/10 transition-all duration-300">
                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-4">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                        <Quote className="w-6 h-6 text-white/60" />
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex justify-center mb-4">
                      {[...Array(Math.floor(testimonial.rating || 5))].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </CardHeader>

                  <CardContent className="flex-grow">
                    {/* Quote */}
                    <blockquote className="text-white/90 text-center mb-6 italic leading-relaxed">
                      &ldquo;{testimonial.quote}&rdquo;
                    </blockquote>

                    {/* Author */}
                    <div className="flex items-center justify-center">
                      <div className={`w-12 h-12 ${testimonial.color} rounded-full flex items-center justify-center text-white font-bold text-lg mr-4`}>
                        {testimonial.avatar}
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-white">
                          {testimonial.name}
                        </div>
                        <div className="text-sm text-white/70">
                          {testimonial.role}
                        </div>
                        <div className="text-xs text-white/60">
                          {testimonial.university}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center mt-8 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollToIndex(index)}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  index === currentIndex 
                    ? 'bg-white w-8' 
                    : 'bg-white/30 hover:bg-white/50'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}