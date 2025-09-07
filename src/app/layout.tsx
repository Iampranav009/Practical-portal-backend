import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { SocketProvider } from "@/contexts/socket-context"
import { ProfileSetupWrapper } from "@/components/auth/profile-setup-wrapper"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Practical Portal - Student & Teacher Management",
  description: "A comprehensive portal for managing practical sessions between students and teachers",
};

/**
 * Root Layout Component
 * Provides theme support and navigation across the entire application
 * Includes font loading and global styling setup
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background font-sans`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <AuthProvider>
            <SocketProvider>
              <ProfileSetupWrapper>
                {children}
              </ProfileSetupWrapper>
            </SocketProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
