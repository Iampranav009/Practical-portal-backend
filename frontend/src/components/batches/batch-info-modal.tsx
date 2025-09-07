"use client"

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Users, 
  School, 
  Calendar, 
  Mail, 
  UserCheck, 
  Hash,
  X,
  Scroll,
  Phone
} from 'lucide-react'

/**
 * Batch Info Modal Component
 * Shows comprehensive batch details and member list
 * Includes scrollable member list with names and roll numbers
 */

interface BatchMember {
  user_id: number
  name: string
  email: string
  role: 'student' | 'teacher'
  joined_at: string
  profile_picture_url?: string
  roll_number?: string
}

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
  members: BatchMember[]
  member_count: number
}

interface BatchInfoModalProps {
  isOpen: boolean
  onClose: () => void
  batch: BatchDetails
}

export function BatchInfoModal({ isOpen, onClose, batch }: BatchInfoModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'members'>('details')
  
  // Filter students from members
  const studentMembers = batch.members.filter(member => member.role === 'student')
  const teacherMember = batch.members.find(member => member.role === 'teacher')

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header with title only - removed duplicate close button */}
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Batch Information
          </DialogTitle>
          <DialogDescription className="sr-only">
            View detailed information about this batch including students, assignments, and statistics
          </DialogDescription>
        </DialogHeader>

        {/* Sticky Tab Navigation - stays at top */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg sticky top-0 z-10">
          <Button
            variant={activeTab === 'details' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('details')}
            className="flex-1"
          >
            <School className="h-4 w-4 mr-2" />
            Details
          </Button>
          <Button
            variant={activeTab === 'members' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('members')}
            className="flex-1"
          >
            <Users className="h-4 w-4 mr-2" />
            Members ({studentMembers.length})
          </Button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto pr-2">
          {activeTab === 'details' ? (
            <div className="space-y-6">
              {/* Batch Header */}
              <div className="text-center">
                <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  {batch.icon_image ? (
                    <img
                      src={batch.icon_image}
                      alt={batch.name}
                      className="w-28 h-28 rounded-full object-cover"
                    />
                  ) : (
                    <School className="h-12 w-12 text-blue-600" />
                  )}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{batch.name}</h2>
                <p className="text-gray-600">{batch.college_name}</p>
              </div>

              {/* Batch Details */}
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                    <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {batch.description || 'No description provided'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Hash className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Batch ID</p>
                        <p className="font-medium">#{batch.batch_id}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Created</p>
                        <p className="font-medium">
                          {new Date(batch.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Teacher Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Teacher Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    {/* Teacher Profile Picture - larger size for better visibility */}
                    <Avatar className="h-16 w-16">
                      <AvatarImage 
                        src={batch.teacher_profile_picture_url || teacherMember?.profile_picture_url} 
                        alt={`${batch.teacher_name} profile`}
                      />
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-lg font-semibold">
                        {batch.teacher_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Teacher Details */}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 text-lg">{batch.teacher_name}</h3>
                      
                      {/* College Name */}
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <School className="h-4 w-4 mr-2" />
                        <span className="truncate">{batch.college_name}</span>
                      </div>
                      
                      {/* Email */}
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <Mail className="h-4 w-4 mr-2" />
                        <span className="truncate">{batch.teacher_email}</span>
                      </div>
                      
                      {/* Contact Number - only show if available */}
                      {batch.teacher_contact_number && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-4 w-4 mr-2" />
                          <span>{batch.teacher_contact_number}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Teacher Badge */}
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      Teacher
                    </Badge>
                  </div>
                </CardContent>
              </Card>


            </div>
          ) : (
            <div className="space-y-4">
              {/* Members Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Batch Members</h3>
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  {studentMembers.length} students
                </Badge>
              </div>

              {/* Scrollable Members List */}
              <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                {studentMembers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No students yet</h3>
                    <p className="text-gray-600">
                      Waiting for students to join this batch
                    </p>
                  </div>
                ) : (
                  studentMembers.map((member, index) => (
                    <Card key={member.user_id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={member.profile_picture_url} />
                              <AvatarFallback className="bg-blue-100 text-blue-600">
                                {member.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-medium text-gray-900">{member.name}</h4>
                              <div className="flex items-center text-sm text-gray-600">
                                <Mail className="h-3 w-3 mr-1" />
                                {member.email}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="flex items-center text-sm text-gray-500 mb-1">
                              <UserCheck className="h-4 w-4 mr-1" />
                              {member.roll_number ? `Roll: ${member.roll_number}` : `Member #${index + 1}`}
                            </div>
                            <p className="text-xs text-gray-400">
                              Joined {new Date(member.joined_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
