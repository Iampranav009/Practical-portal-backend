-- Database Schema Updates for 2-Step Authentication Flow
-- Run these queries to ensure your database supports all the new features

-- Add photo_url column to users table (for Google profile pictures)
ALTER TABLE users ADD COLUMN photo_url VARCHAR(500) DEFAULT NULL AFTER email;

-- Add roll_number column to student_profiles table (if not exists)
ALTER TABLE student_profiles ADD COLUMN roll_number VARCHAR(50) DEFAULT NULL;

-- Add employee_id column to teacher_profiles table (if not exists)  
ALTER TABLE teacher_profiles ADD COLUMN employee_id VARCHAR(50) DEFAULT NULL;

-- Add contact_number column to teacher_profiles table (if not exists)
ALTER TABLE teacher_profiles ADD COLUMN contact_number VARCHAR(20) DEFAULT NULL;

-- Update profile_picture_url to store base64 images instead of URLs
ALTER TABLE teacher_profiles MODIFY COLUMN profile_picture_url LONGTEXT DEFAULT NULL;
ALTER TABLE student_profiles MODIFY COLUMN profile_picture_url LONGTEXT DEFAULT NULL;

-- Create index for faster lookups
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX idx_student_profiles_roll_number ON student_profiles(roll_number);
CREATE INDEX idx_teacher_profiles_employee_id ON teacher_profiles(employee_id);

-- Add practical_name, code_sandbox_link, and code_language to submissions table for enhanced submission features
ALTER TABLE submissions ADD COLUMN practical_name VARCHAR(255) NOT NULL DEFAULT 'Untitled Practical' AFTER student_id;
ALTER TABLE submissions ADD COLUMN code_sandbox_link VARCHAR(500) DEFAULT NULL AFTER file_url;
ALTER TABLE submissions ADD COLUMN code_language VARCHAR(50) DEFAULT NULL AFTER code_sandbox_link;

-- Create index for faster searches on practical names
CREATE INDEX idx_submissions_practical_name ON submissions(practical_name);

-- Add cover_image column to batches table for batch cover images
ALTER TABLE batches ADD COLUMN cover_image LONGTEXT DEFAULT NULL AFTER profile_image;

-- Rename profile_image to icon_image for clarity (batch icon/avatar)
ALTER TABLE batches CHANGE COLUMN profile_image icon_image LONGTEXT DEFAULT NULL;

-- Create announcements table for batch announcements
CREATE TABLE IF NOT EXISTS announcements (
  announcement_id INT AUTO_INCREMENT PRIMARY KEY,
  batch_id INT NOT NULL,
  teacher_id INT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (batch_id) REFERENCES batches(batch_id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_announcements_batch_id (batch_id),
  INDEX idx_announcements_created_at (created_at)
);

-- Create announcement_reads table to track which students have read announcements
CREATE TABLE IF NOT EXISTS announcement_reads (
  read_id INT AUTO_INCREMENT PRIMARY KEY,
  announcement_id INT NOT NULL,
  student_id INT NOT NULL,
  read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (announcement_id) REFERENCES announcements(announcement_id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
  UNIQUE KEY unique_announcement_student (announcement_id, student_id),
  INDEX idx_announcement_reads_announcement_id (announcement_id),
  INDEX idx_announcement_reads_student_id (student_id)
);

-- Create notifications table for teacher notifications
CREATE TABLE IF NOT EXISTS notifications (
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (batch_id) REFERENCES batches(batch_id) ON DELETE CASCADE,
  FOREIGN KEY (submission_id) REFERENCES submissions(submission_id) ON DELETE CASCADE,
  INDEX idx_notifications_teacher_id (teacher_id),
  INDEX idx_notifications_created_at (created_at),
  INDEX idx_notifications_is_read (is_read),
  INDEX idx_notifications_type (type)
);

-- Create notification settings table for email preferences
CREATE TABLE IF NOT EXISTS notification_settings (
  setting_id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  email_notifications BOOLEAN DEFAULT TRUE,
  submission_notifications BOOLEAN DEFAULT TRUE,
  announcement_notifications BOOLEAN DEFAULT TRUE,
  batch_join_notifications BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(user_id) ON DELETE CASCADE,
  UNIQUE KEY unique_teacher_settings (teacher_id)
);

-- Show current table structures for verification
DESCRIBE users;
DESCRIBE student_profiles;
DESCRIBE teacher_profiles;
DESCRIBE submissions;
DESCRIBE announcements;
DESCRIBE announcement_reads;
DESCRIBE notifications;
DESCRIBE notification_settings;
