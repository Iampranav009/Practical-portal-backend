"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Calendar, 
  School,
  Share2,
  Trash2,
  Edit,
  Lock,
  ArrowLeft,
  BookOpen,
  BarChart3,
  FileText,
  Clock
} from 'lucide-react'

/**
 * Enhanced Batch Details Header Component
 * Modern header with image, stats, and management controls
 */

interface BatchDetailsHeaderProps {
  batch: {
    batch_id: number
    name: string
    college_name: string
    description: string
    icon_image: string
    cover_image: string
    created_at: string
    teacher_name: string
    member_count: number
  }
  stats: {
    enrolledStudents: number
    totalSubmissions: number
    pendingSubmissions: number
  }
  isTeacher: boolean
  onEdit?: () => void
  onDelete?: () => void
  onShare?: () => void
  onPasswordEdit?: () => void
}

export function BatchDetailsHeader({ 
  batch, 
  stats, 
  isTeacher, 
  onEdit, 
  onDelete, 
  onShare, 
  onPasswordEdit 
}: BatchDetailsHeaderProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  /**
   * Format creation date
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  /**
   * Get initials for fallback image
   */
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('')
  }

  return (
    <div className="relative">
      {/* Back Button */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Batches
        </Button>
      </div>

      {/* Main Header Card */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Header Cover Image Section */}
          <div className="relative h-48 bg-gradient-to-br from-blue-50 to-indigo-100">
            {batch.cover_image ? (
              <img
                src={batch.cover_image}
                alt={`${batch.name} cover`}
                className="w-full h-full object-cover"
              />
            ) : batch.icon_image ? (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200">
                <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-white shadow-lg">
                  <img
                    src={batch.icon_image}
                    alt={`${batch.name} icon`}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200">
                <BookOpen className="h-20 w-20 text-blue-600" />
              </div>
            )}
            
            {/* Creation Date Badge */}
            <div className="absolute top-4 left-4">
              <Badge variant="secondary" className="bg-white/90 text-gray-700 shadow-sm">
                <Calendar className="h-3 w-3 mr-1" />
                Created {formatDate(batch.created_at)}
              </Badge>
            </div>

            {/* Teacher Controls */}
            {isTeacher && (
              <div className="absolute top-4 right-4 flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={onShare}
                  className="bg-white/90 hover:bg-white text-gray-700 shadow-sm"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={onPasswordEdit}
                  className="bg-white/90 hover:bg-white text-gray-700 shadow-sm"
                >
                  <Lock className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={onEdit}
                  className="bg-white/90 hover:bg-white text-gray-700 shadow-sm"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={onDelete}
                  disabled={isDeleting}
                  className="shadow-sm"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="p-6">
            {/* Batch Title and Info */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {batch.name}
              </h1>
              <div className="flex items-center gap-4 text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <School className="h-4 w-4" />
                  <span>{batch.college_name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>By {batch.teacher_name}</span>
                </div>
              </div>
              
              {/* Description */}
              {batch.description && (
                <p className="text-muted-foreground leading-relaxed max-w-3xl">
                  {batch.description}
                </p>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Enrolled Students */}
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Enrolled Students</p>
                  <p className="text-xl font-bold text-foreground">{stats.enrolledStudents}</p>
                </div>
              </div>

              {/* Total Submissions */}
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Submissions</p>
                  <p className="text-xl font-bold text-foreground">{stats.totalSubmissions}</p>
                </div>
              </div>

              {/* Pending Reviews */}
              <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Reviews</p>
                  <p className="text-xl font-bold text-foreground">{stats.pendingSubmissions}</p>
                </div>
              </div>

              {/* Activity Score */}
              <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Activity Score</p>
                  <p className="text-xl font-bold text-foreground">
                    {stats.enrolledStudents > 0 
                      ? Math.round((stats.totalSubmissions / stats.enrolledStudents) * 100) + '%'
                      : '0%'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
