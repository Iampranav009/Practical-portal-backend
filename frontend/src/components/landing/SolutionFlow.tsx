"use client";

import { Users, Code, CheckCircle, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * Solution Flow Component
 * Visual 3-step process showing how Practical Portal works
 * Uses darker shader-inspired color scheme and improved shadcn/ui components
 * Connected with arrows and clear explanations
 */
export function SolutionFlow() {
  const steps = [
    {
      number: "01",
      icon: <Users className="w-8 h-8" />,
      title: "Teacher Creates Batch",
      description: "Set up a new practical assignment with clear instructions and deadlines.",
      color: "bg-blue-500"
    },
    {
      number: "02", 
      icon: <Code className="w-8 h-8" />,
      title: "Students Submit Code",
      description: "Paste code directly or upload files. No more blurry photos!",
      color: "bg-green-500"
    },
    {
      number: "03",
      icon: <CheckCircle className="w-8 h-8" />,
      title: "Teacher Reviews & Approves",
      description: "Review submissions, provide feedback, and accept or reject with one click.",
      color: "bg-purple-500"
    }
  ];

  return (
    <section id="solution" className="py-20 bg-custom-dark">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16 js-animate">
          <Badge variant="outline" className="mb-4 bg-white/10 text-white border-white/20">
            The Solution
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Simple 3-Step Process
          </h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            A streamlined workflow that transforms how practical submissions work for everyone.
          </p>
        </div>

        {/* Steps Container */}
        <div className="max-w-6xl mx-auto">
          {/* Desktop Layout */}
          <div className="hidden lg:flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col items-center">
                {/* Step Card */}
                <Card className="js-animate bg-white/10 backdrop-blur-sm border-white/20 w-80 text-center transform transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:bg-white/15">
                  <CardHeader className="pb-4">
                    <div className="text-6xl font-bold text-white/20 mb-4">
                      {step.number}
                    </div>
                    <div className={`inline-flex p-4 rounded-full ${step.color} text-white mb-6`}>
                      {step.icon}
                    </div>
                    <CardTitle className="text-2xl font-bold text-white">
                      {step.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-white/80 leading-relaxed">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>

                {/* Arrow (except for last step) */}
                {index < steps.length - 1 && (
                  <div className="mx-8 js-animate">
                    <ArrowRight className="w-8 h-8 text-white/40" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Mobile/Tablet Layout */}
          <div className="lg:hidden space-y-8">
            {steps.map((step, index) => (
              <Card key={index} className="js-animate bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Step Number */}
                    <div className="text-4xl font-bold text-white/20 flex-shrink-0">
                      {step.number}
                    </div>
                    
                    <div className="flex-1">
                      {/* Icon and Title */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-full ${step.color} text-white`}>
                          {step.icon}
                        </div>
                        <h3 className="text-xl font-bold text-white">
                          {step.title}
                        </h3>
                      </div>
                      
                      {/* Description */}
                      <p className="text-white/80 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </CardContent>

                {/* Arrow for mobile */}
                {index < steps.length - 1 && (
                  <div className="flex justify-center py-4">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-white/40 rotate-90" />
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16 js-animate">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white max-w-4xl mx-auto">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">
                Ready to Transform Your Workflow?
              </h3>
              <p className="text-lg text-white/80 mb-6">
                Join thousands of teachers and students who&apos;ve already made the switch.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="bg-white text-black hover:bg-gray-100">
                  Try as Teacher
                </Button>
                <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-black">
                  Try as Student
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}