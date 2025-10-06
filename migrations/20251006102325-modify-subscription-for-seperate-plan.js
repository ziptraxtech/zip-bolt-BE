'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add planType to subscription_plans table
    await queryInterface.addColumn('subscription_plans', 'plan_type', {
      type: Sequelize.ENUM('user', 'vehicle', 'combo'),
      allowNull: false,
      defaultValue: 'combo',
      after: 'description'
    });

    // Make plan_id nullable in subscriptions table
    await queryInterface.changeColumn('subscriptions', 'plan_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'subscription_plans',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // Add user_plan_id to subscriptions table
    await queryInterface.addColumn('subscriptions', 'user_plan_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'subscription_plans',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      after: 'plan_id'
    });

    // Add vehicle_plan_id to subscriptions table
    await queryInterface.addColumn('subscriptions', 'vehicle_plan_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'subscription_plans',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      after: 'user_plan_id'
    });

    // Make max_vehicles nullable (for user-only plans)
    await queryInterface.changeColumn('subscription_plans', 'max_vehicles', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0
    });

    // Make max_users nullable (for vehicle-only plans)
    await queryInterface.changeColumn('subscription_plans', 'max_users', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('subscriptions', 'vehicle_plan_id');
    await queryInterface.removeColumn('subscriptions', 'user_plan_id');
    
    await queryInterface.changeColumn('subscriptions', 'plan_id', {
      type: Sequelize.UUID,
      allowNull: false
    });

    await queryInterface.changeColumn('subscription_plans', 'max_vehicles', {
      type: Sequelize.INTEGER,
      allowNull: false
    });

    await queryInterface.changeColumn('subscription_plans', 'max_users', {
      type: Sequelize.INTEGER,
      allowNull: false
    });

    await queryInterface.removeColumn('subscription_plans', 'plan_type');
  }
};