"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Users, 
  Calendar, 
  School, 
  BookOpen,
  Clock,
  Eye,
  Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Modern Batch Card Component
 * Displays batch information in a social media-style card layout
 * Includes image, metadata, and interactive elements
 */

interface BatchCardProps {
  batch: {
    batch_id: number
    name: string
    college_name: string
    description: string
    icon_image: string
    cover_image: string
    created_at: string
    member_count: number
    teacher_name?: string
    is_own_batch?: boolean
    is_member?: boolean // For student pages to show join/view status
  }
  showTeacherInfo?: boolean
  className?: string
  customButtonText?: string
  customButtonAction?: () => void
  buttonVariant?: 'default' | 'join' | 'view' // For different button styles
  linkPath?: string // Custom link path, defaults to teacher path
}

export function BatchCard({ 
  batch, 
  showTeacherInfo = false, 
  className = "",
  customButtonText,
  customButtonAction,
  buttonVariant = 'default',
  linkPath
}: BatchCardProps) {
  const [imageError, setImageError] = useState(false)

  /**
   * Format creation date to relative time
   */
  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const createdDate = new Date(dateString)
    const diffMs = now.getTime() - createdDate.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffMonths = Math.floor(diffDays / 30)

    if (diffMonths > 0) {
      return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`
    } else if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    } else {
      return 'Today'
    }
  }

  /**
   * Get initials from batch name for fallback avatar
   */
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('')
  }

  // Determine the correct link path
  const defaultLinkPath = linkPath || `/teachers/batch/${batch.batch_id}`
  
  // If we have custom button actions, don't wrap in Link
  const cardContent = (
    <Card className={`group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden card-lighter ${className}`}>
        {/* Batch Cover Image area: show cover image if available; fallback to centered icon/initials */}
        <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100">
          {batch.cover_image && !imageError ? (
            <img
              src={batch.cover_image}
              alt={`${batch.name} cover`}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              {batch.icon_image ? (
                <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-white shadow-sm">
                  <img
                    src={batch.icon_image}
                    alt={`${batch.name} icon`}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-white shadow-sm bg-muted flex items-center justify-center">
                  <span className="text-lg font-semibold text-primary">
                    {getInitials(batch.name)}
                  </span>
                </div>
              )}
            </div>
          )}
          
          {/* Creation Date Badge */}
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-background/90 text-foreground shadow-sm border border-border">
              <Clock className="h-3 w-3 mr-1" />
              {formatTimeAgo(batch.created_at)}
            </Badge>
          </div>

          {/* Ownership Badge */}
          {batch.is_own_batch && (
            <div className="absolute top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-green-500/90 text-white shadow-sm">
                <Users className="h-3 w-3 mr-1" />
                My Batch
              </Badge>
            </div>
          )}

          {/* Member Count Badge */}
          <div className="absolute top-3 right-3">
            <Badge variant="default" className="bg-primary text-primary-foreground shadow-sm">
              <Users className="h-3 w-3 mr-1" />
              {batch.member_count}
            </Badge>
          </div>
        </div>

        {/* Card Content */}
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                {batch.name}
              </CardTitle>
              <CardDescription className="flex items-center mt-1 text-sm text-muted-foreground">
                <School className="h-4 w-4 mr-1" />
                {batch.college_name}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Description */}
          {batch.description && (
            <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
              {batch.description}
            </p>
          )}

          {/* Teacher Info (if showing) */}
          {showTeacherInfo && batch.teacher_name && (
            <div className="flex items-center gap-2 mb-4 p-2 bg-muted/50 rounded-lg">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs bg-primary/20 text-primary">
                  {getInitials(batch.teacher_name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">By {batch.teacher_name}</span>
            </div>
          )}

          {/* Stats and Action Footer */}
          <div className="space-y-3 pt-3 border-t border-border">
            {/* Stats Row */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span className="font-medium">{batch.member_count} member{batch.member_count !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Created {formatTimeAgo(batch.created_at)}</span>
              </div>
            </div>
            
            {/* Action Button */}
            {customButtonText && customButtonAction ? (
              <Button 
                variant={buttonVariant === 'join' ? 'default' : buttonVariant === 'view' ? 'default' : 'ghost'}
                size="sm" 
                className={`w-full ${
                  buttonVariant === 'join' 
                    ? "bg-primary hover:bg-primary/90 text-white" 
                    : buttonVariant === 'view'
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "text-primary hover:text-purple-600"
                }`}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  customButtonAction()
                }}
              >
                {buttonVariant === 'join' ? (
                  <Plus className="h-4 w-4 mr-2" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                {customButtonText}
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-primary hover:text-purple-600"
              >
                <Eye className="h-4 w-4 mr-2" />
                View
              </Button>
            )}
          </div>
        </CardContent>
    </Card>
  )

  // Return with or without Link wrapper based on custom actions
  if (customButtonText && customButtonAction) {
    return cardContent
  } else {
    return (
      <Link href={defaultLinkPath} className="block">
        {cardContent}
      </Link>
    )
  }
}
