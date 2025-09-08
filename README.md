# Practical Portal Backend

A Node.js/Express.js backend API for the Practical Portal collaborative learning platform.

## Features

- **User Authentication**: Firebase-based authentication with JWT tokens
- **Role-based Access**: Separate interfaces for teachers and students
- **Batch Management**: Create and manage classroom batches
- **Submission System**: Students can submit practical work with file attachments
- **Real-time Notifications**: Socket.IO integration for live updates
- **Announcements**: Teachers can post announcements to batches
- **Profile Management**: User profile management with role-specific fields
- **File Upload**: Base64 image upload support for profile pictures

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MySQL with mysql2 driver
- **Authentication**: Firebase Admin SDK + JWT
- **Real-time**: Socket.IO
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Express Validator

## Prerequisites

- Node.js 18.0.0 or higher
- MySQL 5.7 or higher
- Firebase project with Authentication enabled

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Iampranav009/Practical-portal-backend.git
   cd Practical-portal-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory with the following variables:
   ```env
   # Server Configuration
   NODE_ENV=development
   PORT=5000

   # Database Configuration
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=practical_portal

   # JWT Configuration
   JWT_SECRET=your_super_secure_jwt_secret_key_here

   # Firebase Configuration
   FIREBASE_PROJECT_ID=your-firebase-project-id
   FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nyour-firebase-private-key\n-----END PRIVATE KEY-----\n
   FIREBASE_CLIENT_EMAIL=your-firebase-client-email@your-project.iam.gserviceaccount.com

   # CORS Configuration
   FRONTEND_URL=http://localhost:3000
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Database Setup**
   The application will automatically create the required database tables on startup.

5. **Start the server**
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/google-signin` - Google Sign In
- `POST /api/auth/signin` - Email/Password Sign In
- `GET /api/auth/user/:firebaseUid` - Get user by Firebase UID
- `POST /api/auth/logout` - Logout user

### Batches
- `POST /api/batches/create` - Create new batch (Teacher)
- `GET /api/batches/teacher/my-batches` - Get teacher's batches
- `GET /api/batches/student/my-batches` - Get student's batches
- `GET /api/batches/browse` - Browse all batches
- `GET /api/batches/:batchId` - Get batch details
- `PUT /api/batches/edit/:batchId` - Update batch (Teacher)
- `DELETE /api/batches/delete/:batchId` - Delete batch (Teacher)
- `POST /api/batches/join` - Join batch (Student)

### Submissions
- `POST /api/submissions/create` - Create submission (Student)
- `GET /api/submissions/batch/:batchId` - Get batch submissions
- `GET /api/submissions/my-submissions` - Get student's submissions
- `GET /api/submissions/explore` - Get public submissions
- `PUT /api/submissions/:submissionId/status` - Update status (Teacher)
- `PUT /api/submissions/:submissionId/edit` - Edit submission (Student)
- `DELETE /api/submissions/:submissionId` - Delete submission (Student)
- `GET /api/submissions/batch/:batchId/stats` - Get batch statistics

### Announcements
- `POST /api/announcements` - Create announcement (Teacher)
- `GET /api/announcements/batch/:batch_id` - Get batch announcements
- `POST /api/announcements/:announcement_id/read` - Mark as read (Student)
- `GET /api/announcements/unread-count/:batch_id` - Get unread count
- `DELETE /api/announcements/:announcement_id` - Delete announcement (Teacher)

### Notifications
- `GET /api/notifications/teacher/:teacherId` - Get teacher notifications
- `PUT /api/notifications/:notificationId/read` - Mark notification as read
- `PUT /api/notifications/teacher/:teacherId/mark-all-read` - Mark all as read
- `DELETE /api/notifications/teacher/:teacherId/delete-all` - Delete all notifications
- `GET /api/notifications/settings/:teacherId` - Get notification settings
- `PUT /api/notifications/settings/:teacherId` - Update notification settings

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile

### Upload
- `POST /api/upload/profile-picture` - Upload profile picture
- `DELETE /api/upload/profile-picture` - Delete profile picture
- `POST /api/upload/submission-file` - Upload submission file

### Dashboard
- `GET /api/dashboard/teacher/:id` - Get teacher analytics

## Database Schema

The application uses the following main tables:
- `users` - User authentication and basic info
- `teacher_profiles` - Teacher-specific profile data
- `student_profiles` - Student-specific profile data
- `batches` - Classroom/batch information
- `batch_members` - Student enrollment in batches
- `submissions` - Student practical submissions
- `announcements` - Batch announcements
- `announcement_reads` - Track announcement read status
- `notifications` - Teacher notifications
- `notification_settings` - Email notification preferences

## Security Features

- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Comprehensive input sanitization
- **CORS Protection**: Configurable cross-origin resource sharing
- **Security Headers**: Helmet.js for security headers
- **JWT Authentication**: Secure token-based authentication
- **SQL Injection Prevention**: Parameterized queries

## Deployment

### Render.com Deployment

1. **Create a new Web Service** on Render
2. **Connect your GitHub repository**
3. **Configure environment variables** in Render dashboard
4. **Set build command**: `npm install`
5. **Set start command**: `npm start`

### Environment Variables for Production

```env
NODE_ENV=production
PORT=10000
DB_HOST=your-production-db-host
DB_USER=your-production-db-user
DB_PASSWORD=your-production-db-password
DB_NAME=your-production-db-name
JWT_SECRET=your-production-jwt-secret
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
FRONTEND_URL=https://your-frontend-domain.com
CORS_ORIGIN=https://your-frontend-domain.com
```

### Debug and Scaling Flags

- `DEBUG_DB_TIMEOUT`: set `true` temporarily to extend DB timeouts for diagnostics (default false). Remember to set back to `false` after triage.
- `DB_POOL_LIMIT`: override pool size for stronger DB plans. Default is very small to avoid exhausting connection limits on shared hosts.

Notes:
- CORS whitelist compares normalized origins (no trailing slash). Ensure `FRONTEND_URL` is set without a trailing slash.
- COOP header is set to `same-origin-allow-popups` to support OAuth popups.

## Health Check

The API provides a health check endpoint at `/health` that returns:
- Server status
- Database connection status
- Connection pool statistics

## Error Handling

The API uses consistent error response format:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // Optional validation errors
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support, please open an issue in the GitHub repository or contact the development team.
