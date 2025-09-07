"use client";

import { MessageCircle, User, GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Problem Section Component
 * Shows role-based quotes describing current pain points
 * Uses shader-inspired color scheme and improved shadcn/ui components
 * Animates on scroll using IntersectionObserver
 */
export function ProblemSection() {
  const quotes = [
    {
      role: "Student",
      icon: <GraduationCap className="w-6 h-6" />,
      quote: "I spend more time taking photos of my code than actually writing it. The quality is terrible and teachers can't even read it!",
      name: "Computer Science Student",
      color: "bg-blue-500/10 border-blue-500/20 text-blue-600"
    },
    {
      role: "Teacher", 
      icon: <User className="w-6 h-6" />,
      quote: "My WhatsApp is flooded with blurry code screenshots. I can't organize submissions or give proper feedback. It's chaos!",
      name: "Prof of Computer Science Department",
      color: "bg-purple-500/10 border-purple-500/20 text-purple-600"
    },
    {
      role: "Admin",
      icon: <MessageCircle className="w-6 h-6" />,
      quote: "Tracking practical submissions is a nightmare. No centralized system, lost submissions, and zero accountability.",
      name: "Department Head",
      color: "bg-indigo-500/10 border-indigo-500/20 text-indigo-600"
    }
  ];

  return (
    <section id="problem" className="py-20">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16 js-animate">
          <Badge variant="outline" className="mb-4 bg-white/10 text-white border-white/20">
            The Problem
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-white">Current Methods Are</span>{" "}
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Broken
            </span>
          </h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Traditional practical submission methods are frustrating, inefficient, and create problems for everyone involved.
          </p>
        </div>

        {/* Quotes Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {quotes.map((item, index) => (
            <Card 
              key={index}
              className={`js-animate bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-500 hover:scale-105 hover:shadow-2xl ${item.color}`}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-white/20">
                    {item.icon}
                  </div>
                  <CardTitle className="text-lg">{item.role}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <blockquote className="text-lg leading-relaxed mb-4 italic text-white/90">
                  &ldquo;{item.quote}&rdquo;
                </blockquote>
                <cite className="text-sm font-medium not-italic text-white/70">
                  — {item.name}
                </cite>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Problem Summary */}
        <div className="mt-16 text-center js-animate">
          <Card className="bg-white/5 backdrop-blur-sm border-white/10 max-w-4xl mx-auto">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-white mb-4">
                Sound Familiar?
              </h3>
              <p className="text-lg text-white/80 leading-relaxed">
                These problems affect thousands of students and teachers every day. 
                There has to be a better way to handle practical submissions that works for everyone.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}