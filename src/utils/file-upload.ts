/**
 * File Upload Utility
 * Handles file uploads to Firebase Storage with validation and error handling
 * Provides consistent file upload functionality across the application
 */

import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { buildApiUrl } from '@/utils/api';

// File upload configuration
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Validate file before upload
 * Checks file size, type, and other constraints
 */
export const validateFile = (file: File, allowedTypes: string[] = ALLOWED_IMAGE_TYPES): string | null => {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`;
  }

  return null; // No errors
};

/**
 * Upload file to Firebase Storage
 * @param file - File to upload
 * @param path - Storage path (e.g., 'profile-pictures', 'submissions')
 * @param fileName - Custom file name (optional)
 * @param allowedTypes - Allowed file types (optional)
 */
export const uploadFile = async (
  file: File,
  path: string,
  fileName?: string,
  allowedTypes: string[] = ALLOWED_IMAGE_TYPES
): Promise<UploadResult> => {
  try {
    // Validate file
    const validationError = validateFile(file, allowedTypes);
    if (validationError) {
      return {
        success: false,
        error: validationError
      };
    }

    // Generate unique file name
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const finalFileName = fileName || `${timestamp}_${Math.random().toString(36).substring(2)}.${fileExtension}`;
    
    // Create storage reference
    const storageRef = ref(storage, `${path}/${finalFileName}`);
    
    // Upload file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return {
      success: true,
      url: downloadURL
    };
    
  } catch (error) {
    console.error('File upload error:', error);
    return {
      success: false,
      error: 'Failed to upload file. Please try again.'
    };
  }
};

/**
 * Upload profile picture
 * @param file - Image file
 * @param userId - User ID for unique path
 */
export const uploadProfilePicture = async (file: File, userId: string): Promise<UploadResult> => {
  return uploadFile(file, `profile-pictures/${userId}`, undefined, ALLOWED_IMAGE_TYPES);
};

/**
 * Upload submission attachment to backend server
 * @param file - File to upload
 * @param batchId - Batch ID for organization
 * @param jwtToken - JWT authentication token
 */
export const uploadSubmissionFile = async (
  file: File,
  batchId: string,
  jwtToken: string
): Promise<UploadResult> => {
  try {
    // Validate file
    const allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];
    const validationError = validateFile(file, allowedTypes);
    if (validationError) {
      return {
        success: false,
        error: validationError
      };
    }

    // Convert file to base64
    const base64Data = await fileToBase64(file);

    // Send to backend API
    const response = await fetch(buildApiUrl('upload/submission-file'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify({
        batchId,
        fileData: base64Data,
        fileName: file.name,
        fileType: file.type
      })
    });

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        url: result.data.fileData // Return base64 data as URL for now
      };
    } else {
      return {
        success: false,
        error: result.message || 'Failed to upload file'
      };
    }

  } catch (error) {
    console.error('File upload error:', error);
    return {
      success: false,
      error: 'Failed to upload file. Please try again.'
    };
  }
};

/**
 * Convert file to base64 string
 * @param file - The file to convert
 * @returns Promise<string> - The base64 string
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

/**
 * Delete file from Firebase Storage
 * @param url - File URL to delete
 */
export const deleteFile = async (url: string): Promise<boolean> => {
  try {
    // Extract path from URL
    const urlParts = url.split('/');
    const pathIndex = urlParts.findIndex(part => part === 'o');
    if (pathIndex === -1) {
      throw new Error('Invalid file URL');
    }
    
    const encodedPath = urlParts[pathIndex + 1];
    const decodedPath = decodeURIComponent(encodedPath);
    
    // Create storage reference and delete
    const storageRef = ref(storage, decodedPath);
    await deleteObject(storageRef);
    
    return true;
  } catch (error) {
    console.error('File deletion error:', error);
    return false;
  }
};

/**
 * Get file size in human readable format
 * @param bytes - File size in bytes
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Get file type category
 * @param mimeType - File MIME type
 */
export const getFileTypeCategory = (mimeType: string): string => {
  if (ALLOWED_IMAGE_TYPES.includes(mimeType)) {
    return 'image';
  } else if (ALLOWED_DOCUMENT_TYPES.includes(mimeType)) {
    return 'document';
  } else {
    return 'other';
  }
};
