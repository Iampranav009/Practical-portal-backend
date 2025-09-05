import Link from "next/link"
import { BookOpen, Users, Calendar } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Navigation } from "@/components/navigation"
import ShaderBackground from "@/components/ui/shader-background"

/**
 * Home Page Component
 * Landing page with role selection and feature overview
 * Clean design showcasing the practical portal functionality
 */
export default function Home() {
  return (
    <div className="w-full">
      <ShaderBackground />
      <Navigation />
      <div className="w-full max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
          Welcome to{" "}
          <span className="text-primary">Practical Portal</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
          A comprehensive platform for managing practical sessions, connecting students and teachers, 
          and streamlining educational workflows.
        </p>
        
        {/* Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6" />
                I&apos;m a Teacher
              </CardTitle>
              <CardDescription>
                Manage students, create practical sessions, and track progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/teachers/my-batches">
                  Access Teacher Portal
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-6 w-6" />
                I&apos;m a Student
              </CardTitle>
              <CardDescription>
                Join practical sessions, submit work, and track your learning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/students/my-batches">
                  Access Student Portal
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="text-center">
          <div className="h-12 w-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-6 w-6 text-primary-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Session Management</h3>
          <p className="text-muted-foreground">
            Easily schedule and manage practical sessions with intuitive tools
          </p>
        </div>

        <div className="text-center">
          <div className="h-12 w-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <Users className="h-6 w-6 text-primary-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Role-Based Access</h3>
          <p className="text-muted-foreground">
            Separate interfaces for teachers and students with appropriate permissions
          </p>
        </div>

        <div className="text-center">
          <div className="h-12 w-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-6 w-6 text-primary-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Progress Tracking</h3>
          <p className="text-muted-foreground">
            Monitor student progress and provide feedback effectively
          </p>
        </div>
      </div>
    </div>
    </div>
  )
}
