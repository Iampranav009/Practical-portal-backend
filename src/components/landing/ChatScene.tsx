"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Users, Code, ArrowRight, Bot } from "lucide-react";

/**
 * ChatScene Floating Assistant Component
 * Floating circular avatar bottom-right with slide-up chat UI
 * Mock responses and quick action chips for demos
 * No backend integration - UI only
 */
export function ChatScene() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{id: number, text: string, isUser: boolean, timestamp: Date}>>([
    {
      id: 1,
      text: "Hi! I'm here to help you learn about Practical Portal. What would you like to know?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickActions = [
    { id: "teacher-demo", text: "Teacher Demo", icon: Users },
    { id: "student-demo", text: "Student Demo", icon: Code },
    { id: "show-features", text: "Show Features", icon: ArrowRight }
  ];

  const mockResponses = {
    "teacher-demo": "Great! As a teacher, you can create batches, manage students, review submissions, and track analytics. Would you like to see how to create your first batch?",
    "student-demo": "Perfect! As a student, you can join batches, submit code directly, track your progress, and get instant feedback. Ready to see how submissions work?",
    "show-features": "Here are the key features: Direct code submission, real-time feedback, batch management, analytics dashboard, and file uploads. Which feature interests you most?",
    "hello": "Hello! I'm here to help you understand Practical Portal. You can ask me about features, pricing, or how to get started!",
    "pricing": "Practical Portal offers a free tier for basic usage and premium plans for advanced features. Would you like to see our pricing options?",
    "features": "Our main features include: Direct code submission, batch management, real-time feedback, analytics, file uploads, and mobile support. What would you like to know more about?",
    "default": "I'd be happy to help! You can ask me about our features, how to get started, pricing, or request a demo. What's on your mind?"
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleQuickAction = (actionId: string) => {
    const action = quickActions.find(a => a.id === actionId);
    if (action) {
      setInputValue(action.text);
      handleSendMessage(action.text);
    }
  };

  const handleSendMessage = (text?: string) => {
    const messageText = text || inputValue.trim();
    if (!messageText) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      text: messageText,
      isUser: true,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");

    // Simulate typing
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      
      // Generate mock response
      const responseKey = messageText.toLowerCase().includes('teacher') ? 'teacher-demo' :
                         messageText.toLowerCase().includes('student') ? 'student-demo' :
                         messageText.toLowerCase().includes('feature') ? 'show-features' :
                         messageText.toLowerCase().includes('hello') ? 'hello' :
                         messageText.toLowerCase().includes('pricing') ? 'pricing' :
                         messageText.toLowerCase().includes('feature') ? 'features' :
                         'default';

      const botMessage = {
        id: Date.now() + 1,
        text: mockResponses[responseKey as keyof typeof mockResponses] || mockResponses.default,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    }, 1000 + Math.random() * 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group ${
          isOpen ? 'scale-0' : 'scale-100'
        }`}
        aria-label="Open chat assistant"
      >
        <MessageCircle className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
      </button>

      {/* Chat Panel */}
      <div className={`fixed bottom-6 right-6 z-50 w-80 h-96 bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-300 ${
        isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
      }`}>
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Practical Portal Assistant</h3>
              <p className="text-xs text-gray-500">Online now</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center transition-colors"
            aria-label="Close chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 h-64">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                  message.isUser
                    ? 'bg-primary text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                }`}
              >
                {message.text}
              </div>
            </div>
          ))}
          
          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 rounded-lg rounded-bl-sm px-3 py-2 text-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2 mb-3">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action.id)}
                className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-medium text-gray-700 transition-colors"
              >
                <action.icon className="w-3 h-3" />
                {action.text}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim()}
              className="w-8 h-8 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
