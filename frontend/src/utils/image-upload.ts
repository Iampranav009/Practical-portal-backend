import { apiCall } from './api'

/**
 * Utility functions for handling image uploads to backend server
 * Converts images to base64 and stores them in MySQL database
 */

/**
 * Convert file to base64 string
 * @param file - The image file to convert
 * @returns Promise<string> - The base64 string
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)
  })
}

/**
 * Upload an image file to backend server as base64
 * @param file - The image file to upload
 * @param userId - The user ID (not used in backend, but kept for compatibility)
 * @param folder - The folder to upload to (not used in backend, but kept for compatibility)
 * @param jwtToken - The JWT authentication token
 * @returns Promise<string> - The base64 image data
 */
export const uploadImage = async (
  file: File, 
  userId: string, 
  folder: string = 'profile-pictures',
  jwtToken: string
): Promise<string> => {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image')
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
      throw new Error('File size must be less than 5MB')
    }

    // Convert file to base64
    const base64Data = await fileToBase64(file)

    // Send base64 data to backend with authentication
    const response = await apiCall('upload/profile-picture', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify({ imageData: base64Data })
    })

    if (response.success) {
      return response.data.imageData
    } else {
      throw new Error(response.message || 'Failed to upload image')
    }
  } catch (error) {
    console.error('Error uploading image:', error)
    throw error
  }
}

/**
 * Delete an image from backend server (clear from database)
 * @param imageData - The base64 image data (not used, but kept for compatibility)
 * @param jwtToken - The JWT authentication token
 */
export const deleteImage = async (imageData: string, jwtToken: string): Promise<void> => {
  try {
    const response = await apiCall('upload/profile-picture', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      }
    })

    if (!response.success) {
      throw new Error(response.message || 'Failed to delete image')
    }
  } catch (error) {
    console.error('Error deleting image:', error)
    throw error
  }
}

/**
 * Validate image file before upload
 * @param file - The file to validate
 * @returns boolean - True if valid, throws error if invalid
 */
export const validateImageFile = (file: File): boolean => {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Only JPEG, PNG, GIF, and WebP images are allowed')
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024 // 5MB in bytes
  if (file.size > maxSize) {
    throw new Error('Image size must be less than 5MB')
  }

  // Check image dimensions (optional - can be added if needed)
  return true
}

/**
 * Compress image file before upload (basic compression)
 * @param file - The image file to compress
 * @param quality - Compression quality (0.1 to 1.0)
 * @returns Promise<File> - The compressed image file
 */
export const compressImage = (file: File, quality: number = 0.8): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Calculate new dimensions (max 800px width/height)
      const maxSize = 800
      let { width, height } = img

      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width
          width = maxSize
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height
          height = maxSize
        }
      }

      canvas.width = width
      canvas.height = height

      // Draw and compress
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              })
              resolve(compressedFile)
            } else {
              reject(new Error('Failed to compress image'))
            }
          },
          file.type,
          quality
        )
      } else {
        reject(new Error('Failed to get canvas context'))
      }
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}
