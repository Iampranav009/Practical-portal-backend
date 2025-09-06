# Profile Setup Completion Flow

This document explains the profile setup completion flow implemented for new users in the Practical Portal application.

## Overview

The profile setup flow ensures that both teachers and students complete their profile information before accessing the main application features. This creates a better user experience and ensures all necessary data is collected.

## Components

### 1. ProfileSetupModal (`/components/auth/profile-setup-modal.tsx`)

A modal component that displays the profile setup form with different fields based on user role:

**For Teachers:**
- Full Name (required)
- College/Institution Name (required)
- Contact Number (optional)
- Profile Picture (optional)

**For Students:**
- Full Name (required)
- Academic Year (required)
- Subject/Course (required)
- Roll Number (required)
- Batch Name (optional)
- Profile Picture (optional)

### 2. ProfileSetupWrapper (`/components/auth/profile-setup-wrapper.tsx`)

A wrapper component that:
- Checks if the user's profile is complete
- Shows the setup modal if profile is incomplete
- Displays a banner for incomplete profiles
- Prevents access to main app until profile is complete

### 3. ProfileCompletionBanner (`/components/auth/profile-completion-banner.tsx`)

A banner component that appears at the top of the app when profile is incomplete, providing quick access to profile setup.

### 4. Auth Context Updates (`/contexts/auth-context.tsx`)

Enhanced authentication context with:
- `profileComplete` property on user object
- `checkProfileCompletion()` method
- `refreshUserProfile()` method
- Automatic profile completion checking on login

## How It Works

### 1. User Login
When a user logs in, the auth context:
1. Fetches user data from the backend
2. Checks profile completion status
3. Sets the `profileComplete` flag on the user object

### 2. Profile Completion Check
The system checks if all required fields are filled:

**Teacher Requirements:**
- Name (minimum 2 characters)
- College name (not empty)

**Student Requirements:**
- Name (minimum 2 characters)
- Academic year (selected)
- Subject (not empty)
- Roll number (not empty)

### 3. Access Control
- If profile is incomplete: Shows setup modal (blocking access)
- If profile is complete: Shows main application
- If profile becomes incomplete: Shows banner with setup button

### 4. Profile Update
When user completes profile setup:
1. Data is saved to backend
2. Profile completion status is refreshed
3. User gains access to main application
4. Page refreshes to ensure all components get updated data

## Integration

The profile setup flow is integrated into the main layout (`/app/layout.tsx`) through the `ProfileSetupWrapper` component, ensuring it applies to all pages in the application.

## Testing

A test page is available at `/test-profile-setup` to verify the flow works correctly. This page shows:
- Current user information
- Profile completion status
- Buttons to test the setup modal
- Instructions for testing

## Database Requirements

The profile completion check relies on the existing profile tables:
- `users` table for basic user info
- `teacher_profiles` table for teacher-specific data
- `student_profiles` table for student-specific data

## User Experience

### For New Users
1. User signs up/logs in
2. Profile setup modal appears immediately
3. User fills required information
4. User gains access to main application

### For Existing Users
1. User logs in
2. System checks profile completion
3. If incomplete: Shows banner with setup button
4. If complete: Normal app access

## Benefits

1. **Data Completeness**: Ensures all users have necessary profile information
2. **Better UX**: Clear guidance for new users
3. **Role-Specific**: Different requirements for teachers vs students
4. **Non-Intrusive**: Banner option for existing users
5. **Secure**: Prevents access until profile is complete

## Future Enhancements

- Add progress indicators for profile completion
- Allow partial profile saving
- Add profile completion reminders
- Implement profile completion analytics
