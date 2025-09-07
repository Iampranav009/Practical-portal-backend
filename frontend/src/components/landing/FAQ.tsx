"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

/**
 * FAQ Component
 * Accordion with semantic button toggles and proper ARIA attributes
 * Uses darker shader-inspired color scheme and improved shadcn/ui components
 * Includes 6 common questions about submission process and features
 */
export function FAQ() {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const faqs = [
    {
      question: "How does the submission process work?",
      answer: "Teachers create a batch for their practical assignment. Students join the batch using a code and submit their work directly by pasting code or uploading files. Teachers can then review, provide feedback, and approve or reject submissions with a single click."
    },
    {
      question: "Can I resubmit if my work is rejected?",
      answer: "Yes! Students can resubmit their work if it's rejected. The system keeps a complete history of all submissions, so you can see your progress and improvements over time. Teachers can also provide specific feedback to help you improve."
    },
    {
      question: "What file types can I upload?",
      answer: "You can upload code files (.js, .py, .java, .cpp, .html, .css, etc.), documents (.pdf, .doc, .docx), images (.jpg, .png, .gif), and other common file formats. The system also supports direct code pasting for quick submissions."
    },
    {
      question: "How do teachers track student progress?",
      answer: "Teachers get access to a comprehensive dashboard showing submission statistics, student progress, assignment analytics, and detailed reports. You can see who submitted on time, track late submissions, and identify students who might need extra help."
    },
    {
      question: "Is my data secure and private?",
      answer: "Absolutely. We use enterprise-grade security with encrypted data transmission and storage. Your submissions are private to you and your teacher, and we never share your data with third parties. We're also compliant with educational data privacy standards."
    },
    {
      question: "Can I use this for multiple courses or batches?",
      answer: "Yes! Teachers can create multiple batches for different courses, and students can join multiple batches. Each batch is independent, so you can manage different subjects or assignments separately. The system scales to handle any number of batches and students."
    }
  ];

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(item => item !== index)
        : [...prev, index]
    );
  };

  return (
    <section id="faq" className="py-20">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16 js-animate">
          <Badge variant="outline" className="mb-4 bg-white/10 text-white border-white/20">
            FAQ
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-white">Frequently Asked</span>{" "}
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Questions
            </span>
          </h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Everything you need to know about Practical Portal. Can&apos;t find what you&apos;re looking for? 
            <a href="#contact" className="text-blue-300 hover:underline ml-1">Contact us</a>.
          </p>
        </div>

        {/* FAQ Items */}
        <div className="max-w-4xl mx-auto">
          {faqs.map((faq, index) => (
            <Card key={index} className="js-animate mb-4 bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300">
              <Collapsible open={openItems.includes(index)} onOpenChange={() => toggleItem(index)}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full px-6 py-6 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset rounded-2xl hover:bg-white/10 text-white"
                    aria-expanded={openItems.includes(index)}
                    aria-controls={`faq-answer-${index}`}
                  >
                    <h3 className="text-lg font-semibold pr-4">
                      {faq.question}
                    </h3>
                    <div className="flex-shrink-0">
                      {openItems.includes(index) ? (
                        <Minus className="w-6 h-6 text-primary" />
                      ) : (
                        <Plus className="w-6 h-6 text-white/60" />
                      )}
                    </div>
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent
                  id={`faq-answer-${index}`}
                  className="overflow-hidden transition-all duration-300 ease-in-out"
                >
                  <div className="px-6 pb-6">
                    <div className="border-t border-white/20 pt-4">
                      <p className="text-white/80 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>

        {/* Additional Help */}
        <div className="mt-16 text-center js-animate">
          <Card className="bg-white/5 backdrop-blur-sm border-white/10 text-white max-w-4xl mx-auto">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">
                Still Have Questions?
              </h3>
              <p className="text-lg text-white/80 mb-6">
                Our support team is here to help you get the most out of Practical Portal.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  asChild
                  className="bg-white text-black hover:bg-gray-100"
                >
                  <a href="mailto:support@practicalportal.com">
                    Email Support
                  </a>
                </Button>
                <Button 
                  asChild
                  variant="outline" 
                  className="bg-transparent border-white text-white hover:bg-white hover:text-black"
                >
                  <a href="#contact">
                    Contact Us
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}