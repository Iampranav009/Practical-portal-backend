# Notification System for Teachers

This document describes the comprehensive notification system implemented for teachers in the Practical Portal application.

## Features

### 1. Real-time Notifications
- **Instant Updates**: Teachers receive real-time notifications when students submit work
- **Socket.IO Integration**: Uses WebSocket connections for live updates
- **Notification Badge**: Shows unread count in the sidebar navigation

### 2. Email Notifications
- **Automatic Email Alerts**: Teachers receive email notifications for new submissions
- **Rich Email Content**: Includes student details, submission content, and direct links
- **Customizable Settings**: Teachers can control which notifications they receive via email

### 3. Notification Types
- **Submission Notifications**: When students submit new work
- **Announcement Notifications**: When announcements are created
- **Batch Join Notifications**: When students join batches

### 4. User Interface
- **Dedicated Notifications Page**: `/teachers/notifications`
- **Notification Settings Page**: `/teachers/notification-settings`
- **Sidebar Integration**: Notification button with unread count badge
- **Filtering Options**: Filter by type (all, submissions, unread)

## Technical Implementation

### Frontend Components

#### 1. Notification UI Component (`src/components/ui/notifications-menu.tsx`)
- Reusable notification display component
- Supports filtering and real-time updates
- Click-to-navigate functionality

#### 2. Notification Hook (`src/components/hooks/use-notifications.ts`)
- Manages notification state and API calls
- Handles real-time updates via Socket.IO
- Provides notification actions (mark as read, etc.)

#### 3. Notification Pages
- **Main Page**: `src/app/teachers/notifications/page.tsx`
- **Settings Page**: `src/app/teachers/notification-settings/page.tsx`

### Backend Implementation

#### 1. Database Schema
```sql
-- Notifications table
CREATE TABLE notifications (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  student_id INT NOT NULL,
  batch_id INT NOT NULL,
  submission_id INT DEFAULT NULL,
  type ENUM('submission', 'announcement', 'batch_join') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Notification settings table
CREATE TABLE notification_settings (
  setting_id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  email_notifications BOOLEAN DEFAULT TRUE,
  submission_notifications BOOLEAN DEFAULT TRUE,
  announcement_notifications BOOLEAN DEFAULT TRUE,
  batch_join_notifications BOOLEAN DEFAULT TRUE
);
```

#### 2. API Endpoints
- `GET /api/notifications/teacher/:teacherId` - Get teacher notifications
- `PUT /api/notifications/:notificationId/read` - Mark notification as read
- `PUT /api/notifications/teacher/:teacherId/mark-all-read` - Mark all as read
- `GET /api/notifications/settings/:teacherId` - Get notification settings
- `PUT /api/notifications/settings/:teacherId` - Update notification settings

#### 3. Email Service (`backend/utils/emailService.js`)
- Uses Nodemailer for email delivery
- Rich HTML email templates
- Configurable SMTP settings

#### 4. Real-time Updates
- Socket.IO integration for live notifications
- Teacher-specific notification rooms
- Automatic notification creation on student submissions

## Configuration

### Environment Variables
Add these to your `.env` file:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FRONTEND_URL=http://localhost:3000
```

### Database Setup
Run the database schema updates:
```bash
mysql -u your_username -p your_database < backend/db/schema-updates.sql
```

## Usage

### For Teachers

1. **View Notifications**: Click the bell icon in the sidebar
2. **Manage Settings**: Click the settings icon in the notifications page
3. **Real-time Updates**: Notifications appear instantly when students submit work
4. **Email Alerts**: Check your email for detailed notification summaries

### For Developers

1. **Adding New Notification Types**: Update the `type` enum in the database schema
2. **Customizing Email Templates**: Modify `backend/utils/emailService.js`
3. **Adding Notification Triggers**: Update relevant controllers to call `createNotification`

## Testing

### Manual Testing
1. Create a teacher account and student account
2. Create a batch and add the student
3. Submit work as a student
4. Check teacher notifications page and email

### API Testing
```bash
# Get notifications
curl -H "Authorization: Bearer YOUR_JWT" \
  http://localhost:5000/api/notifications/teacher/1

# Mark as read
curl -X PUT -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"teacherId": 1}' \
  http://localhost:5000/api/notifications/1/read
```

## Troubleshooting

### Common Issues

1. **Email Not Sending**: Check SMTP configuration and credentials
2. **Real-time Updates Not Working**: Verify Socket.IO connection
3. **Notifications Not Creating**: Check database foreign key constraints
4. **Badge Not Updating**: Ensure notification hook is properly connected

### Debug Steps

1. Check browser console for JavaScript errors
2. Verify backend logs for API errors
3. Test database connections
4. Validate JWT tokens and authentication

## Future Enhancements

- Push notifications for mobile devices
- Notification scheduling and batching
- Advanced filtering and search
- Notification analytics and reporting
- Custom notification templates
- Integration with external notification services
