"use client";

// This is file with demos of your component
// Each export is one usecase for your component

import { ModernSidebar } from "@/components/ui/modern-side-bar";

const DemoOne = () => {
  return(
    <div className="flex h-screen w-screen">
      <ModernSidebar />
      <div className="flex-1 p-8 bg-gray-50">
        <h1 className="text-2xl font-bold text-gray-900">Demo Content</h1>
        <p className="text-gray-600 mt-2">This is where your main content would go.</p>
      </div>
    </div>
  );
};

export { DemoOne };
