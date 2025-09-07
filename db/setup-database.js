/**
 * Database Setup Script
 * Applies necessary schema updates for the authentication system
 */

const { pool } = require('./connection');

/**
 * Apply schema updates to the database
 */
async function setupDatabase() {
  console.log('🔧 Setting up database schema...');
  
  try {
    // Add photo_url column to users table (if not exists)
    console.log('Adding photo_url column to users table...');
    try {
      await pool.execute(`
        ALTER TABLE users 
        ADD COLUMN photo_url VARCHAR(500) DEFAULT NULL 
        AFTER email
      `);
      console.log('✅ Added photo_url column to users table');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  photo_url column already exists in users table');
      } else {
        throw error;
      }
    }

    // Add roll_number column to student_profiles table (if not exists)
    console.log('Adding roll_number column to student_profiles table...');
    try {
      await pool.execute(`
        ALTER TABLE student_profiles 
        ADD COLUMN roll_number VARCHAR(50) DEFAULT NULL
      `);
      console.log('✅ Added roll_number column to student_profiles table');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  roll_number column already exists in student_profiles table');
      } else {
        throw error;
      }
    }

    // Add employee_id column to teacher_profiles table (if not exists)
    console.log('Adding employee_id column to teacher_profiles table...');
    try {
      await pool.execute(`
        ALTER TABLE teacher_profiles 
        ADD COLUMN employee_id VARCHAR(50) DEFAULT NULL
      `);
      console.log('✅ Added employee_id column to teacher_profiles table');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  employee_id column already exists in teacher_profiles table');
      } else {
        throw error;
      }
    }

    // Add contact_number column to teacher_profiles table (if not exists)
    console.log('Adding contact_number column to teacher_profiles table...');
    try {
      await pool.execute(`
        ALTER TABLE teacher_profiles 
        ADD COLUMN contact_number VARCHAR(20) DEFAULT NULL
      `);
      console.log('✅ Added contact_number column to teacher_profiles table');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  contact_number column already exists in teacher_profiles table');
      } else {
        throw error;
      }
    }

    // Update profile_picture_url columns to store base64 images
    console.log('Updating profile_picture_url columns to store base64 images...');
    try {
      await pool.execute(`
        ALTER TABLE teacher_profiles 
        MODIFY COLUMN profile_picture_url LONGTEXT DEFAULT NULL
      `);
      console.log('✅ Updated teacher_profiles profile_picture_url column');
    } catch (error) {
      console.log('ℹ️  Could not update teacher_profiles profile_picture_url column:', error.message);
    }

    try {
      await pool.execute(`
        ALTER TABLE student_profiles 
        MODIFY COLUMN profile_picture_url LONGTEXT DEFAULT NULL
      `);
      console.log('✅ Updated student_profiles profile_picture_url column');
    } catch (error) {
      console.log('ℹ️  Could not update student_profiles profile_picture_url column:', error.message);
    }

    // Add practical_name column to submissions table (if not exists)
    console.log('Adding practical_name column to submissions table...');
    try {
      await pool.execute(`
        ALTER TABLE submissions 
        ADD COLUMN practical_name VARCHAR(255) NOT NULL DEFAULT 'Untitled Practical' 
        AFTER student_id
      `);
      console.log('✅ Added practical_name column to submissions table');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  practical_name column already exists in submissions table');
      } else {
        throw error;
      }
    }

    // Add code_sandbox_link column to submissions table (if not exists)
    console.log('Adding code_sandbox_link column to submissions table...');
    try {
      await pool.execute(`
        ALTER TABLE submissions 
        ADD COLUMN code_sandbox_link VARCHAR(500) DEFAULT NULL 
        AFTER file_url
      `);
      console.log('✅ Added code_sandbox_link column to submissions table');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  code_sandbox_link column already exists in submissions table');
      } else {
        throw error;
      }
    }

    // Add code_language column to submissions table (if not exists)
    console.log('Adding code_language column to submissions table...');
    try {
      await pool.execute(`
        ALTER TABLE submissions 
        ADD COLUMN code_language VARCHAR(50) DEFAULT NULL 
        AFTER code_sandbox_link
      `);
      console.log('✅ Added code_language column to submissions table');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  code_language column already exists in submissions table');
      } else {
        throw error;
      }
    }

    // Add cover_image column to batches table (if not exists)
    console.log('Adding cover_image column to batches table...');
    try {
      await pool.execute(`
        ALTER TABLE batches 
        ADD COLUMN cover_image LONGTEXT DEFAULT NULL
      `);
      console.log('✅ Added cover_image column to batches table');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  cover_image column already exists in batches table');
      } else {
        throw error;
      }
    }

    // Rename profile_image to icon_image in batches table (if not already renamed)
    console.log('Renaming profile_image to icon_image in batches table...');
    try {
      await pool.execute(`
        ALTER TABLE batches 
        CHANGE COLUMN profile_image icon_image LONGTEXT DEFAULT NULL
      `);
      console.log('✅ Renamed profile_image to icon_image in batches table');
    } catch (error) {
      if (error.code === 'ER_BAD_FIELD_ERROR') {
        console.log('ℹ️  icon_image column already exists or profile_image does not exist');
      } else {
        throw error;
      }
    }

    // Create indexes for better performance
    console.log('Creating database indexes...');
    
    const indexes = [
      {
        name: 'idx_users_firebase_uid',
        table: 'users',
        column: 'firebase_uid',
        sql: 'CREATE INDEX idx_users_firebase_uid ON users(firebase_uid)'
      },
      {
        name: 'idx_student_profiles_roll_number',
        table: 'student_profiles', 
        column: 'roll_number',
        sql: 'CREATE INDEX idx_student_profiles_roll_number ON student_profiles(roll_number)'
      },
      {
        name: 'idx_teacher_profiles_employee_id',
        table: 'teacher_profiles',
        column: 'employee_id', 
        sql: 'CREATE INDEX idx_teacher_profiles_employee_id ON teacher_profiles(employee_id)'
      },
      {
        name: 'idx_submissions_practical_name',
        table: 'submissions',
        column: 'practical_name',
        sql: 'CREATE INDEX idx_submissions_practical_name ON submissions(practical_name)'
      }
    ];

    for (const index of indexes) {
      try {
        await pool.execute(index.sql);
        console.log(`✅ Created index: ${index.name}`);
      } catch (error) {
        if (error.code === 'ER_DUP_KEYNAME') {
          console.log(`ℹ️  Index ${index.name} already exists`);
        } else {
          console.warn(`⚠️  Could not create index ${index.name}:`, error.message);
        }
      }
    }

    // Verify table structures
    console.log('\n📊 Current table structures:');
    
    const tables = ['users', 'student_profiles', 'teacher_profiles', 'batches', 'submissions'];
    for (const table of tables) {
      console.log(`\n${table}:`);
      const [columns] = await pool.execute(`DESCRIBE ${table}`);
      columns.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(required)'}`);
      });
    }

    console.log('\n✅ Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  }
}

/**
 * Check database connection and schema
 */
async function checkDatabase() {
  try {
    // Test connection
    await pool.execute('SELECT 1');
    console.log('✅ Database connection successful');
    
    // Check required tables exist
    const [tables] = await pool.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME IN ('users', 'student_profiles', 'teacher_profiles', 'batches', 'submissions')
    `);
    
    const tableNames = tables.map(t => t.TABLE_NAME);
    const requiredTables = ['users', 'student_profiles', 'teacher_profiles', 'batches', 'submissions'];
    const missingTables = requiredTables.filter(t => !tableNames.includes(t));
    
    if (missingTables.length > 0) {
      console.error('❌ Missing required tables:', missingTables);
      return false;
    }
    
    console.log('✅ All required tables exist');
    return true;
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
    return false;
  }
}

// Run setup if called directly
if (require.main === module) {
  (async () => {
    try {
      const isReady = await checkDatabase();
      if (isReady) {
        await setupDatabase();
      } else {
        console.error('❌ Database is not ready. Please ensure all required tables exist.');
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    } finally {
      process.exit(0);
    }
  })();
}

module.exports = { setupDatabase, checkDatabase };
