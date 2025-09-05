'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('jobs', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      organization_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'organizations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      allocator_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      rider_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      vehicle_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'vehicles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },

      // --- Pickup details ---
      pickup_location: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      pickup_address: {
        type: Sequelize.STRING(255),
        allowNull: false   
      },
      pickup_city: {
        type: Sequelize.STRING(100),
        allowNull: false   
      },
      pickup_state: {
        type: Sequelize.STRING(100),
        allowNull: false   
      },
      pickup_pincode: {
        type: Sequelize.STRING(20),
        allowNull: false   
      },
      pickup_latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: true
      },
      pickup_longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: true
      },

      // --- Delivery details ---
      delivery_location: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      delivery_address: {
        type: Sequelize.STRING(255),
        allowNull: false   
      },
      delivery_city: {
        type: Sequelize.STRING(100),
        allowNull: false   
      },
      delivery_state: {
        type: Sequelize.STRING(100),
        allowNull: false   
      },
      delivery_pincode: {
        type: Sequelize.STRING(20),
        allowNull: false   
      },
      delivery_latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: true
      },
      delivery_longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: true
      },

      scheduled_time: {
        type: Sequelize.DATE,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('assigned', 'accepted', 'in_progress', 'completed', 'cancelled'),
        defaultValue: 'assigned'
      },
      assigned_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      started_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for performance
    await queryInterface.addIndex('jobs', ['organization_id']);
    await queryInterface.addIndex('jobs', ['status']);
    await queryInterface.addIndex('jobs', ['rider_id']);
    await queryInterface.addIndex('jobs', ['allocator_id']);
    await queryInterface.addIndex('jobs', ['scheduled_time']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('jobs');
  }
};
