#!/usr/bin/env node

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 ZipSureAI Database Setup\n');

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupDatabase() {
  try {
    console.log('📋 Checking prerequisites...\n');
    
    // Check if PostgreSQL is running
    try {
      execSync('pg_isready', { stdio: 'ignore' });
      console.log('✅ PostgreSQL is running');
    } catch (error) {
      console.log('❌ PostgreSQL is not running. Please start PostgreSQL first.');
      process.exit(1);
    }

    // Check if database exists
    const dbName = 'zipsure_ai';
    try {
      execSync(`psql -d ${dbName} -c "SELECT 1;"`, { stdio: 'ignore' });
      console.log(`✅ Database '${dbName}' exists`);
    } catch (error) {
      console.log(`❌ Database '${dbName}' does not exist. Creating...`);
      try {
        execSync(`createdb ${dbName}`);
        console.log(`✅ Database '${dbName}' created successfully`);
      } catch (createError) {
        console.log('❌ Failed to create database. Please create it manually:');
        console.log(`   createdb ${dbName}`);
        process.exit(1);
      }
    }

    console.log('\n🔄 Running database migrations...');
    execSync('npx sequelize-cli db:migrate', { stdio: 'inherit' });
    console.log('✅ Migrations completed successfully');

    console.log('\n🌱 Seeding database with demo data...');
    execSync('npx sequelize-cli db:seed:all', { stdio: 'inherit' });
    console.log('✅ Database seeded successfully');

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📝 Demo credentials:');
    console.log('   Superadmin: superadmin@zipsure.ai / password123');
    console.log('   Admin: admin@demologistics.com / password123');
    console.log('   Allocator: allocator@demologistics.com / password123');
    console.log('   Rider: rider1@demologistics.com / password123');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

setupDatabase(); 