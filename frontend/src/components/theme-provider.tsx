"use client"

import * as React from "react"

// Define theme options
type Theme = "dark" | "light" | "system"

// Theme provider context interface
type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
  attribute?: string
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}

// Context for theme state and functions
type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

// Create theme context
const ThemeProviderContext = React.createContext<ThemeProviderState>(initialState)

/**
 * Theme Provider Component
 * Manages dark/light theme state with localStorage persistence
 * Supports system theme detection and manual toggle
 */
export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "practical-portal-theme",
  attribute = "class",
  enableSystem = true,
  disableTransitionOnChange = false,
  ...props
}: ThemeProviderProps & React.HTMLAttributes<HTMLDivElement>) {
  // Initialize with default theme to avoid SSR issues
  const [theme, setTheme] = React.useState<Theme>(defaultTheme)
  const [mounted, setMounted] = React.useState(false)

  // Hydrate theme from localStorage after component mounts
  React.useEffect(() => {
    setMounted(true)
    
    // Only access localStorage in the browser
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem(storageKey) as Theme
      if (storedTheme) {
        setTheme(storedTheme)
      }
    }
  }, [storageKey])

  React.useEffect(() => {
    if (!mounted) return // Don't run on server

    const root = window.document.documentElement

    // Remove existing theme classes
    root.classList.remove("light", "dark")

    // Determine the actual theme to apply
    let resolvedTheme = theme
    if (theme === "system" && enableSystem) {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"
      resolvedTheme = systemTheme
    }

    // Apply the resolved theme
    root.classList.add(resolvedTheme)
    
    // Set data attribute for additional styling hooks
    root.setAttribute('data-theme', resolvedTheme)
  }, [theme, enableSystem, mounted])

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      setTheme(newTheme)
      // Only access localStorage in the browser
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, newTheme)
      }
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

/**
 * Hook to use theme context
 * Returns current theme state and setTheme function
 */
export const useTheme = () => {
  const context = React.useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
