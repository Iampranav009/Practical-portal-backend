"use client"

import * as React from "react"

/**
 * Light Theme Provider Component
 * Simplified provider that only supports light theme
 * Removes all dark theme and system theme functionality
 */
export function ThemeProvider({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  // Ensure light theme is always applied
  React.useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove("dark")
    root.classList.add("light")
    root.setAttribute('data-theme', 'light')
  }, [])

  return (
    <div {...props}>
      {children}
    </div>
  )
}

/**
 * Hook to use theme context
 * Returns a simplified theme state (always light)
 */
export const useTheme = () => {
  return {
    theme: "light" as const,
    setTheme: () => {
      // No-op function since we only support light theme
      console.log("Theme switching is disabled - only light theme is supported")
    }
  }
}