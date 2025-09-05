# 📢 Announcement Feature Guide

## Overview
The announcement feature allows teachers to send important messages to all students in a batch with real-time updates. Students receive notifications and can mark announcements as read.

## Features

### For Teachers
- **Send Announcements**: Create and send announcements to all batch members
- **Real-time Broadcasting**: Announcements are instantly delivered to all students
- **Character Limit**: 1000 characters per announcement
- **Announcement History**: View all sent announcements in chronological order

### For Students
- **Real-time Notifications**: Receive announcements instantly when teachers send them
- **Unread Count Badge**: See notification badge with unread count on announcement button
- **Mark as Read**: Mark announcements as read to track which ones you've seen
- **Announcement History**: View all announcements in chronological order

## How to Use

### Teachers
1. Navigate to any batch page (either from `/batches/[batch_id]` or `/teachers/batch/[batch_id]`)
2. Click the "Announcements" button in the top navigation bar
3. Type your announcement message in the text area
4. Click "Send" to broadcast to all students
5. The announcement will appear in the list and be sent to all students in real-time

### Students
1. Navigate to any batch page (`/batches/[batch_id]`)
2. Click the "Announcements" button (shows unread count badge if there are unread announcements)
3. View all announcements in chronological order
4. Click "Mark as Read" on unread announcements
5. The unread count badge will update automatically

## Technical Implementation

### Database Schema
- `announcements` table: Stores announcement data
- `announcement_reads` table: Tracks which students have read which announcements

### Real-time Updates
- Uses Socket.IO for real-time communication
- Teachers emit `announcementCreated` events when sending announcements
- Students receive real-time updates and unread count changes

### API Endpoints
- `POST /api/announcements` - Create announcement (teachers only)
- `GET /api/announcements/batch/:batch_id` - Get batch announcements
- `POST /api/announcements/:announcement_id/read` - Mark as read (students only)
- `GET /api/announcements/unread-count/:batch_id` - Get unread count (students only)
- `DELETE /api/announcements/:announcement_id` - Delete announcement (teachers only)

## Components

### AnnouncementModal
- Main modal component for viewing and creating announcements
- Different views for teachers and students
- Real-time updates via Socket.IO

### AnnouncementButton
- Button component with unread count badge
- Updates in real-time when new announcements are created
- Only shows unread count for students

### useAnnouncements Hook
- Custom hook for managing announcement state
- Handles fetching, marking as read, and unread count tracking

## Security
- Role-based access control (teachers can create, students can read)
- JWT authentication required for all endpoints
- Input validation and sanitization
- SQL injection protection via parameterized queries

## Mobile Responsiveness
- Optimized for mobile-first design
- Responsive modal layout
- Touch-friendly buttons and interactions
- Scrollable announcement list

## Future Enhancements
- Rich text formatting for announcements
- File attachments in announcements
- Email notifications for important announcements
- Announcement categories/tags
- Bulk announcement management
