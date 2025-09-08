require('dotenv').config(); // Load environment variables from .env file
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Override any existing environment variables with .env values
process.env.DATABASE_HOST = process.env.DATABASE_HOST || 'localhost';
process.env.DATABASE_USER = process.env.DATABASE_USER || 'root';
process.env.DATABASE_PASSWORD = process.env.DATABASE_PASSWORD || '';
process.env.DATABASE_NAME = process.env.DATABASE_NAME || 'practical_portal';

/**
 * Database Update Script
 * Runs the schema updates to create notification tables
 */

async function runDatabaseUpdates() {
  let connection;
  
  try {
    console.log('🔧 Environment variables:');
    console.log('   DATABASE_HOST:', process.env.DATABASE_HOST || 'localhost');
    console.log('   DATABASE_USER:', process.env.DATABASE_USER || 'root');
    console.log('   DATABASE_NAME:', process.env.DATABASE_NAME || 'practical_portal');
    
    // Create database connection using environment variables
    connection = await mysql.createConnection({
      host: process.env.DATABASE_HOST || process.env.DB_HOST,
      user: process.env.DATABASE_USER || process.env.DB_USER,
      password: process.env.DATABASE_PASSWORD || process.env.DB_PASSWORD,
      database: process.env.DATABASE_NAME || process.env.DB_NAME,
      multipleStatements: true
    });

    console.log('✅ Connected to database');

    // Read the schema updates file
    const schemaPath = path.join(__dirname, 'db', 'schema-updates.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    // Split by semicolon and execute each statement
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('DESCRIBE'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.trim()) {
        try {
          console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
          await connection.execute(statement);
          console.log(`✅ Statement ${i + 1} executed successfully`);
        } catch (error) {
          // Some statements might fail if tables/indexes already exist, that's okay
          if (error.code === 'ER_TABLE_EXISTS_ERROR' || 
              error.code === 'ER_DUP_FIELDNAME' || 
              error.code === 'ER_DUP_KEYNAME' ||
              error.code === 'ER_DUP_ENTRY') {
            console.log(`⚠️  Statement ${i + 1} skipped (already exists): ${error.message}`);
          } else {
            console.error(`❌ Error in statement ${i + 1}:`, error.message);
            throw error;
          }
        }
      }
    }

    console.log('🎉 Database updates completed successfully!');
    console.log('📋 Created/Updated tables:');
    console.log('   - notifications');
    console.log('   - notification_settings');
    console.log('   - announcements');
    console.log('   - announcement_reads');

  } catch (error) {
    console.error('❌ Database update failed:');
    console.error('   Error message:', error.message);
    console.error('   Error code:', error.code);
    console.error('   Full error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the updates
runDatabaseUpdates();
