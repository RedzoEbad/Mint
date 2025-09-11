#!/usr/bin/env node

const { migrate } = require('drizzle-orm/node-postgres/migrator');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Database connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 1, // Use single connection for migrations
});

async function runMigrations() {
  console.log('🔄 Starting database migrations...');
  
  try {
    // Get a client from the pool
    const client = await pool.connect();
    
    // Run migrations
    await migrate({ 
      client, 
      migrationsFolder: path.join(__dirname, '../drizzle') 
    });
    
    console.log('✅ Database migrations completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run migrations if this script is executed directly
if (require.main === module) {
  runMigrations().catch((error) => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });
}

module.exports = { runMigrations };
