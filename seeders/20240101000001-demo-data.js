'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create demo organization
    const organization = await queryInterface.bulkInsert('organizations', [{
      id: uuidv4(),
      name: 'Demo Logistics Pvt Ltd',
      address: '123 Main Street, Tech Park',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      phone: '+91-9876543210',
      email: 'info@demologistics.com',
      gst_number: '27AABCD1234Z1Z5',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }], { returning: true });

    const orgId = organization[0].id;

    // Create demo users
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    await queryInterface.bulkInsert('users', [
      {
        id: uuidv4(),
        email: 'superadmin@zipsure.ai',
        password: hashedPassword,
        first_name: 'Super',
        last_name: 'Admin',
        phone: '+91-9999999999',
        role: 'superadmin',
        organization_id: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        email: 'admin@demologistics.com',
        password: hashedPassword,
        first_name: 'John',
        last_name: 'Admin',
        phone: '+91-8888888888',
        role: 'admin',
        organization_id: orgId,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        email: 'allocator@demologistics.com',
        password: hashedPassword,
        first_name: 'Sarah',
        last_name: 'Allocator',
        phone: '+91-7777777777',
        role: 'allocator',
        organization_id: orgId,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        email: 'rider1@demologistics.com',
        password: hashedPassword,
        first_name: 'Mike',
        last_name: 'Rider',
        phone: '+91-6666666666',
        role: 'rider',
        organization_id: orgId,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        email: 'rider2@demologistics.com',
        password: hashedPassword,
        first_name: 'Lisa',
        last_name: 'Driver',
        phone: '+91-5555555555',
        role: 'rider',
        organization_id: orgId,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    // Create subscription plans
    await queryInterface.bulkInsert('subscription_plans', [
      {
        id: uuidv4(),
        name: 'Basic',
        description: 'Perfect for small fleets',
        price: 999.00,
        max_vehicles: 10,
        max_users: 20,
        duration_days: 30,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Premium',
        description: 'Ideal for growing businesses',
        price: 1999.00,
        max_vehicles: 25,
        max_users: 50,
        duration_days: 30,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Enterprise',
        description: 'For large scale operations',
        price: 3999.00,
        max_vehicles: 100,
        max_users: 200,
        duration_days: 30,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    // Create demo vehicles
    await queryInterface.bulkInsert('vehicles', [
      {
        id: uuidv4(),
        organization_id: orgId,
        vehicle_number: 'MH01AB1234',
        vehicle_type: 'Bike',
        model: 'Activa',
        make: 'Honda',
        year: 2022,
        color: 'White',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        organization_id: orgId,
        vehicle_number: 'MH02CD5678',
        vehicle_type: 'Bike',
        model: 'Scooty',
        make: 'TVS',
        year: 2021,
        color: 'Red',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        organization_id: orgId,
        vehicle_number: 'MH03EF9012',
        vehicle_type: 'Car',
        model: 'Swift',
        make: 'Maruti',
        year: 2020,
        color: 'Blue',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('vehicles', null, {});
    await queryInterface.bulkDelete('subscription_plans', null, {});
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('organizations', null, {});
  }
}; 