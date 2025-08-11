#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🔄 Resetting ZipSureAI Database...\n');

try {
  console.log('🗑️  Dropping database...');
  execSync('npx sequelize-cli db:drop', { stdio: 'inherit' });
  
  console.log('🏗️  Creating database...');
  execSync('npx sequelize-cli db:create', { stdio: 'inherit' });
  
  console.log('📊 Running migrations...');
  execSync('npx sequelize-cli db:migrate', { stdio: 'inherit' });
  
  console.log('🌱 Seeding database...');
  execSync('npx sequelize-cli db:seed:all', { stdio: 'inherit' });
  
  console.log('\n✅ Database reset completed successfully!');
  console.log('\n📝 Demo credentials:');
  console.log('   Superadmin: superadmin@zipsure.ai / password123');
  console.log('   Admin: admin@demologistics.com / password123');
  console.log('   Allocator: allocator@demologistics.com / password123');
  console.log('   Rider: rider1@demologistics.com / password123');
  
} catch (error) {
  console.error('❌ Database reset failed:', error.message);
  process.exit(1);
} 