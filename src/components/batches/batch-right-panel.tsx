"use client"

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  School, 
  User, 
  CheckCircle, 
  XCircle, 
  Clock,
  Users,
  Mail,
  Phone
} from 'lucide-react'

/**
 * Batch Right Panel Component
 * Fixed right sidebar with batch image, description, teacher info, and stats
 * Shows total accepted, rejected, and pending submissions
 */

interface BatchDetails {
  batch_id: number
  name: string
  college_name: string
  description: string
  icon_image: string
  cover_image: string
  created_at: string
  teacher_name: string
  teacher_email: string
  teacher_contact_number?: string
  teacher_profile_picture_url?: string
  members: Array<{
    user_id: number
    name: string
    email: string
    role: 'student' | 'teacher'
    joined_at: string
    profile_picture_url?: string
  }>
  member_count: number
}

interface BatchStats {
  enrolledStudents: number
  totalSubmissions: number
  pendingSubmissions: number
  acceptedSubmissions: number
  rejectedSubmissions: number
}

interface BatchRightPanelProps {
  batch: BatchDetails
  stats: BatchStats
}

export function BatchRightPanel({ batch, stats }: BatchRightPanelProps) {
  // Calculate derived stats
  const acceptedCount = stats.acceptedSubmissions || 0
  const rejectedCount = stats.rejectedSubmissions || 0
  const pendingCount = stats.pendingSubmissions || 0
  const totalCount = stats.totalSubmissions || 0

  return (
    <div className="space-y-4">
      {/* Batch Image Card */}
      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          {batch.cover_image ? (
            <img
              src={batch.cover_image}
              alt={`${batch.name} cover`}
              className="w-full h-full object-cover"
            />
          ) : batch.icon_image ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-white shadow-sm mx-auto mb-2">
                <img
                  src={batch.icon_image}
                  alt={`${batch.name} icon`}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs text-gray-500">Batch Icon</p>
            </div>
          ) : (
            <div className="text-center">
              <School className="h-8 w-8 text-blue-400 mx-auto mb-1" />
              <p className="text-xs text-gray-500">No image</p>
            </div>
          )}
        </div>
      </Card>

      {/* Batch Description */}
      <Card>
        <CardContent className="p-3">
          <h3 className="font-semibold text-gray-900 mb-2 text-sm">About this batch</h3>
          <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
            {batch.description || 'No description provided for this batch.'}
          </p>
        </CardContent>
      </Card>

      {/* Teacher Information */}
      <Card>
        <CardContent className="p-3">
          <h3 className="font-semibold text-gray-900 mb-2 text-sm">Teacher</h3>
          <div className="space-y-2">
            {/* Teacher Profile and Basic Info */}
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage 
                  src={batch.teacher_profile_picture_url || batch.members.find(m => m.role === 'teacher')?.profile_picture_url} 
                  alt={`${batch.teacher_name} profile`}
                />
                <AvatarFallback className="bg-blue-100 text-blue-600 text-xs font-semibold">
                  {batch.teacher_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate text-sm">{batch.teacher_name}</p>
                <p className="text-xs text-gray-600 truncate">{batch.college_name}</p>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs px-1 py-0">
                Teacher
              </Badge>
            </div>
            
            {/* Teacher Contact Information */}
            <div className="space-y-1 pl-1">
              {/* Email */}
              <div className="flex items-center text-xs text-gray-600">
                <Mail className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="truncate">{batch.teacher_email}</span>
              </div>
              
              {/* Contact Number - only show if available */}
              {batch.teacher_contact_number && (
                <div className="flex items-center text-xs text-gray-600">
                  <Phone className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="truncate">{batch.teacher_contact_number}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Grid - Full Size Layout */}
      <div className="grid grid-cols-1 gap-3">
        {/* Accepted Submissions */}
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-900">Accepted</p>
                  <p className="text-xs text-green-700">Approved submissions</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-900">{acceptedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rejected Submissions */}
        <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-red-900">Rejected</p>
                  <p className="text-xs text-red-700">Declined submissions</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-red-900">{rejectedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Submissions */}
        <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-yellow-900">Pending</p>
                  <p className="text-xs text-yellow-700">Awaiting review</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-yellow-900">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


    </div>
  )
}
