# Practical Portal 🎓

A comprehensive web application for managing practical sessions between students and teachers, built with Next.js, Express.js, and MySQL.

## 🟢 Phase 1 - Complete ✅

Phase 1 has been successfully implemented with the following features:

### ✅ Project Setup
- **Frontend**: Next.js 15 + TailwindCSS 4 + shadcn/ui components
- **Backend**: Express.js + MySQL with proper MVC structure
- **Folder Structure**: Organized `/teachers` and `/students` routes with backend separation

### ✅ Authentication System
- **Firebase Authentication** integration with role-based login
- **JWT tokens** for backend API access
- **User roles**: Student and Teacher with appropriate permissions
- **Database integration**: User data stored in MySQL with Firebase UID mapping

### ✅ Theme Support
- **Dark/Light theme toggle** with system preference detection
- **localStorage persistence** for theme preferences
- **shadcn/ui components** with full theme support
- **Mobile-first responsive design**

### ✅ Profile Management
- **Teacher Profile Page**: Name, Email, College Name, Profile Picture
- **Student Profile Page**: Name, Email, Year, Subject, Batch Name, Profile Picture
- **Editable forms** with save functionality
- **Image upload support** (ready for Firebase Storage integration)

### ✅ Navigation & UI
- **Clean navigation bar** with theme toggle and role-based profile access
- **Modern landing page** with role selection cards
- **Responsive design** optimized for mobile devices
- **Consistent UI components** using shadcn/ui

### ✅ Database Schema
- **Users table**: Core user data with Firebase UID mapping
- **Teacher profiles**: Extended teacher-specific information
- **Student profiles**: Extended student-specific information
- **Foreign key relationships** with cascade deletion

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- MySQL 8.0+
- Firebase project with Authentication enabled

### Installation

1. **Clone the repository**
   \`\`\`bash
   cd practical-portal
   \`\`\`

2. **Install Dependencies**
   
   **Option 1: Install all at once** (from root directory):
   \`\`\`bash
   npm run install:all
   \`\`\`
   
   **Option 2: Install separately**
   
   **Frontend Setup**:
   \`\`\`bash
   cd frontend
   npm install
   \`\`\`

   **Backend Setup**:
   \`\`\`bash
   cd backend
   npm install
   \`\`\`

4. **Environment Configuration**
   
   **Frontend**: Create `.env.local` in the `frontend` directory:
   \`\`\`
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   \`\`\`

   **Backend**: Create `.env` in the `backend` directory:
   \`\`\`
   DATABASE_HOST=localhost
   DATABASE_USER=root
   DATABASE_PASSWORD=your_mysql_password
   DATABASE_NAME=practical_portal
   JWT_SECRET=your_jwt_secret
   PORT=5000
   \`\`\`

5. **Database Setup**
   \`\`\`sql
   CREATE DATABASE practical_portal;
   \`\`\`

6. **Start the applications**
   
   **Option 1: Start both together** (from root directory):
   \`\`\`bash
   npm run dev
   \`\`\`
   
   **Option 2: Start separately**
   
   **Backend** (from `/backend` directory):
   \`\`\`bash
   npm run dev
   \`\`\`

   **Frontend** (from `/frontend` directory):
   \`\`\`bash
   npm run dev
   \`\`\`

## 📁 Project Structure

\`\`\`
practical-portal/
├── frontend/                   # Next.js frontend application
│   ├── src/
│   │   ├── app/
│   │   │   ├── teachers/profile/    # Teacher profile page
│   │   │   ├── students/profile/    # Student profile page
│   │   │   ├── layout.tsx          # Root layout with theme provider
│   │   │   └── page.tsx            # Landing page
│   │   ├── components/
│   │   │   ├── ui/                 # shadcn/ui components
│   │   │   ├── auth/               # Authentication forms
│   │   │   ├── theme-provider.tsx  # Theme management
│   │   │   ├── theme-toggle.tsx    # Theme switch button
│   │   │   └── navigation.tsx      # Main navigation
│   │   ├── contexts/
│   │   │   └── auth-context.tsx    # Firebase auth context
│   │   └── lib/
│   │       ├── firebase.ts         # Firebase configuration
│   │       └── utils.ts            # Utility functions
│   ├── public/                 # Static assets
│   ├── package.json            # Frontend dependencies
│   └── next.config.ts          # Next.js configuration
├── backend/                    # Express.js backend API
│   ├── controllers/
│   │   ├── authController.js   # Authentication logic
│   │   └── profileController.js # Profile management
│   ├── routes/
│   │   ├── auth.js             # Auth routes
│   │   └── profile.js          # Profile routes
│   ├── middleware/
│   │   └── auth.js             # JWT middleware
│   ├── db/
│   │   └── connection.js       # MySQL connection
│   ├── server.js               # Express server
│   └── package.json            # Backend dependencies
└── README.md                   # Project documentation
\`\`\`

## 🔧 Technologies Used

### Frontend
- **Next.js 15** - React framework with App Router
- **TailwindCSS 4** - Utility-first CSS framework
- **shadcn/ui** - Accessible UI components
- **Firebase Auth** - Authentication service
- **Lucide React** - Icon library

### Backend
- **Express.js** - Web application framework
- **MySQL2** - Database driver
- **JWT** - Token-based authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

## 🎯 Features

### Authentication
- [x] Firebase email/password authentication
- [x] Role-based access (Student/Teacher)
- [x] JWT token management
- [x] Automatic user registration in MySQL

### Profile Management
- [x] Role-specific profile pages
- [x] Editable profile information
- [x] Profile picture upload support
- [x] Form validation and error handling

### UI/UX
- [x] Dark/Light theme with system detection
- [x] Responsive mobile-first design
- [x] Modern component library
- [x] Accessible navigation

### Backend API
- [x] RESTful API design
- [x] JWT authentication middleware
- [x] MySQL database integration
- [x] Error handling and validation

## 🔐 Database Schema

### Users Table
\`\`\`sql
CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  firebase_uid VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role ENUM('student', 'teacher') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
\`\`\`

### Teacher Profiles Table
\`\`\`sql
CREATE TABLE teacher_profiles (
  profile_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  college_name VARCHAR(255),
  profile_picture_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
\`\`\`

### Student Profiles Table
\`\`\`sql
CREATE TABLE student_profiles (
  profile_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  year VARCHAR(50),
  subject VARCHAR(255),
  batch_name VARCHAR(100),
  profile_picture_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
\`\`\`

## 🧪 Testing

### Frontend
Visit the pages to test functionality:
- **Home**: `http://localhost:3000`
- **Teacher Profile**: `http://localhost:3000/teachers/profile`
- **Student Profile**: `http://localhost:3000/students/profile`

### Backend API
Test the API endpoints:
- **Health Check**: `GET http://localhost:5000/health`
- **Register User**: `POST http://localhost:5000/api/auth/register`
- **Get Profile**: `GET http://localhost:5000/api/profile` (requires JWT token)

## 🔄 What's Next (Phase 2)

The foundation is now complete and ready for Phase 2 features:

- [ ] Practical session management
- [ ] Student-teacher assignment system
- [ ] File upload and submission system
- [ ] Real-time notifications
- [ ] Progress tracking and analytics
- [ ] Calendar integration
- [ ] Batch management for teachers

## 👥 Contributing

This project follows clean code principles:
- **Simple and modular** code structure
- **Comprehensive comments** for all functions
- **Minimal necessary changes** approach
- **Clear naming conventions**

## 📝 License

This project is licensed under the MIT License.

---

**Note**: Make sure to create `.env.local` (frontend) and `.env` (backend) files with your actual Firebase and database credentials before running the application. See the example files for required variables.