const { pool } = require('../db/connection');

/**
 * Upload Controller
 * Handles base64 image uploads for profile pictures
 * Stores images directly in MySQL database as base64 strings
 */

/**
 * Validate base64 image data
 * @param {string} base64Data - The base64 image data
 * @returns {object} - Validation result with success and message
 */
const validateBase64Image = (base64Data) => {
  if (!base64Data) {
    return { success: false, message: 'No image data provided' };
  }

  // Check if it's a valid base64 string
  const base64Regex = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;
  if (!base64Regex.test(base64Data)) {
    return { success: false, message: 'Invalid image format. Only JPEG, PNG, GIF, and WebP are allowed' };
  }

  // Extract the base64 part (remove data:image/...;base64, prefix)
  const base64String = base64Data.split(',')[1];
  
  // Check file size (5MB limit)
  const sizeInBytes = (base64String.length * 3) / 4;
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (sizeInBytes > maxSize) {
    return { success: false, message: 'Image size must be less than 5MB' };
  }

  return { success: true };
};

/**
 * Upload profile picture (base64)
 * POST /api/upload/profile-picture
 */
const uploadProfilePicture = async (req, res) => {
  try {
    const { userId, role } = req.user; // From JWT middleware
    const { imageData } = req.body;

    // Validate the base64 image data
    const validation = validateBase64Image(imageData);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    // Return the base64 data (it will be stored in database by profile controller)
    res.json({
      success: true,
      message: 'Profile picture processed successfully',
      data: {
        imageData: imageData
      }
    });

  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process profile picture'
    });
  }
};

/**
 * Upload submission file (base64)
 * POST /api/upload/submission-file
 */
const uploadSubmissionFile = async (req, res) => {
  try {
    const { userId, role } = req.user; // From JWT middleware
    const { batchId, fileData, fileName, fileType } = req.body;

    // Validate required fields
    if (!batchId || !fileData || !fileName) {
      return res.status(400).json({
        success: false,
        message: 'Batch ID, file data, and file name are required'
      });
    }

    // Only students can upload submission files
    if (role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can upload submission files'
      });
    }

    // Check if student is a member of the batch
    const [memberCheck] = await pool.execute(
      'SELECT 1 FROM batch_members WHERE batch_id = ? AND student_id = ?',
      [batchId, userId]
    );

    if (memberCheck.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this batch'
      });
    }

    // Validate file type and size
    const validation = validateSubmissionFile(fileData, fileType);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    // Return the file data (it will be stored in database by submission controller)
    res.json({
      success: true,
      message: 'Submission file processed successfully',
      data: {
        fileData: fileData,
        fileName: fileName,
        fileType: fileType
      }
    });

  } catch (error) {
    console.error('Upload submission file error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process submission file'
    });
  }
};

/**
 * Validate submission file data
 * @param {string} fileData - The base64 file data
 * @param {string} fileType - The MIME type of the file
 * @returns {object} - Validation result with success and message
 */
const validateSubmissionFile = (fileData, fileType) => {
  if (!fileData) {
    return { success: false, message: 'No file data provided' };
  }

  // Check if it's a valid base64 string
  const base64Regex = /^data:[^;]+;base64,/;
  if (!base64Regex.test(fileData)) {
    return { success: false, message: 'Invalid file format. Must be base64 encoded.' };
  }

  // Extract the base64 part (remove data:...;base64, prefix)
  const base64String = fileData.split(',')[1];
  
  // Check file size (10MB limit for submissions)
  const sizeInBytes = (base64String.length * 3) / 4;
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (sizeInBytes > maxSize) {
    return { success: false, message: 'File size must be less than 10MB' };
  }

  // Check file type
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/plain', 'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip', 'application/x-zip-compressed'
  ];

  if (fileType && !allowedTypes.includes(fileType)) {
    return { success: false, message: 'File type not allowed. Allowed types: images, PDF, documents, and archives.' };
  }

  return { success: true };
};

/**
 * Delete profile picture (clear from database)
 * DELETE /api/upload/profile-picture
 */
const deleteProfilePicture = async (req, res) => {
  try {
    const { userId, role } = req.user; // From JWT middleware

    // Clear the profile picture from database
    const tableName = role === 'teacher' ? 'teacher_profiles' : 'student_profiles';
    
    await pool.execute(
      `UPDATE ${tableName} SET profile_picture_url = NULL WHERE user_id = ?`,
      [userId]
    );

    res.json({
      success: true,
      message: 'Profile picture deleted successfully'
    });

  } catch (error) {
    console.error('Delete profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete profile picture'
    });
  }
};

module.exports = {
  uploadProfilePicture,
  deleteProfilePicture,
  uploadSubmissionFile,
  validateBase64Image,
  validateSubmissionFile
};
