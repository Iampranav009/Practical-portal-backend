/**
 * Authentication Setup Test Utility
 * Use this to verify Firebase and backend configuration
 */

// Test Firebase configuration
export const testFirebaseConfig = () => {
  const requiredEnvVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID'
  ];

  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('❌ Missing Firebase environment variables:', missing);
    return false;
  }
  
  console.log('✅ Firebase configuration looks good!');
  return true;
};

// Test API endpoint connectivity
export const testAPIConnection = async () => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const response = await fetch(`${apiUrl}/api/auth/test`, {
      method: 'GET',
    });
    
    if (response.ok) {
      console.log('✅ Backend API connection successful!');
      return true;
    } else {
      console.error('❌ Backend API connection failed:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Backend API connection error:', error);
    return false;
  }
};

// Database schema requirements
export const getDatabaseRequirements = () => {
  return {
    tables: {
      users: ['firebase_uid', 'name', 'email', 'role', 'photo_url'],
      student_profiles: ['user_id', 'roll_number'],
      teacher_profiles: ['user_id', 'employee_id']
    },
    endpoints: [
      'POST /api/auth/register',
      'GET /api/auth/user/:firebaseUid',
      'POST /api/auth/google-signin',
      'POST /api/auth/signin'
    ]
  };
};

// Authentication flow verification
export const verifyAuthFlow = () => {
  console.log('🔍 Authentication Flow Verification:');
  console.log('');
  console.log('📍 Routes Available:');
  console.log('   • /auth/login - 2-step login (role selection + credentials)');
  console.log('   • /auth/signup - 2-step signup (role selection + registration)');
  console.log('   • /login - Redirects to /auth/login for backward compatibility');
  console.log('');
  console.log('🔐 Authentication Methods:');
  console.log('   • Email/Password with role-specific fields');
  console.log('   • Google OAuth with role selection');
  console.log('');
  console.log('👥 User Roles:');
  console.log('   • Student: Email, Password, Roll Number');
  console.log('   • Teacher: Email, Password, Employee ID');
  console.log('');
  console.log('📊 Database Schema:');
  const requirements = getDatabaseRequirements();
  Object.entries(requirements.tables).forEach(([table, columns]) => {
    console.log(`   • ${table}: ${columns.join(', ')}`);
  });
  console.log('');
  console.log('🌐 API Endpoints:');
  requirements.endpoints.forEach(endpoint => {
    console.log(`   • ${endpoint}`);
  });
};

export default {
  testFirebaseConfig,
  testAPIConnection,
  getDatabaseRequirements,
  verifyAuthFlow
};
