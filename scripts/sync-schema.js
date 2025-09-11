#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, description) {
  try {
    log(`🔄 ${description}...`, 'blue');
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    log(`✅ ${description} completed!`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${description} failed: ${error.message}`, 'red');
    return false;
  }
}

async function syncSchema() {
  log('🚀 Starting Drizzle Schema Sync', 'bright');
  log('================================', 'cyan');
  
  // Check if drizzle config exists
  const drizzleConfigPath = path.join(process.cwd(), 'drizzle.config.ts');
  if (!fs.existsSync(drizzleConfigPath)) {
    log('❌ drizzle.config.ts not found!', 'red');
    process.exit(1);
  }
  
  // Check if migrations folder exists
  const migrationsPath = path.join(process.cwd(), 'drizzle');
  if (!fs.existsSync(migrationsPath)) {
    log('📁 Creating migrations folder...', 'yellow');
    fs.mkdirSync(migrationsPath, { recursive: true });
  }
  
  // Step 1: Generate migrations
  const generateSuccess = execCommand(
    'npx drizzle-kit generate',
    'Generating migrations from schema changes'
  );
  
  if (!generateSuccess) {
    log('❌ Migration generation failed. Stopping sync process.', 'red');
    process.exit(1);
  }
  
  // Step 2: Check if there are new migrations
  const migrationFiles = fs.readdirSync(migrationsPath).filter(file => file.endsWith('.sql'));
  if (migrationFiles.length === 0) {
    log('ℹ️  No new migrations to apply.', 'yellow');
    return;
  }
  
  log(`📄 Found ${migrationFiles.length} migration file(s):`, 'cyan');
  migrationFiles.forEach(file => log(`   - ${file}`, 'magenta'));
  
  // Step 3: Apply migrations
  const pushSuccess = execCommand(
    'npx drizzle-kit push',
    'Applying migrations to database'
  );
  
  if (!pushSuccess) {
    log('❌ Migration push failed. You may need to run migrations manually.', 'red');
    process.exit(1);
  }
  
  log('🎉 Schema sync completed successfully!', 'green');
  log('================================', 'cyan');
}

// Handle command line arguments
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'generate':
    log('🔄 Generating migrations only...', 'blue');
    execCommand('npx drizzle-kit generate', 'Generating migrations');
    break;
    
  case 'push':
    log('🔄 Pushing migrations only...', 'blue');
    execCommand('npx drizzle-kit push', 'Pushing migrations');
    break;
    
  case 'studio':
    log('🔄 Opening Drizzle Studio...', 'blue');
    execCommand('npx drizzle-kit studio', 'Opening Drizzle Studio');
    break;
    
  case 'help':
  case '--help':
  case '-h':
    log('📖 Drizzle Schema Sync Commands:', 'bright');
    log('================================', 'cyan');
    log('node scripts/sync-schema.js          - Full sync (generate + push)', 'green');
    log('node scripts/sync-schema.js generate - Generate migrations only', 'green');
    log('node scripts/sync-schema.js push     - Push migrations only', 'green');
    log('node scripts/sync-schema.js studio   - Open Drizzle Studio', 'green');
    log('node scripts/sync-schema.js help     - Show this help', 'green');
    break;
    
  default:
    // Default: full sync
    syncSchema().catch((error) => {
      log(`❌ Sync failed: ${error.message}`, 'red');
      process.exit(1);
    });
    break;
}
