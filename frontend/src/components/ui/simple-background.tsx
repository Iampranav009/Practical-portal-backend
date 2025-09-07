"use client";

import React from 'react';

/**
 * Simple Background Component
 * Fast loading background without complex shaders
 * Provides immediate visual feedback
 */
const SimpleBackground = () => {
  return (
    <div className="fixed top-0 left-0 w-full h-full -z-10 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Simple animated elements for visual interest */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-pink-500/30 rounded-full blur-2xl animate-pulse animation-delay-4000"></div>
      </div>
    </div>
  );
};

export default SimpleBackground;
