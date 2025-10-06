const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');

/**
 * @swagger
 * components:
 *   schemas:
 *     SubscriptionPlan:
 *       type: object
 *       required:
 *         - name
 *         - price
 *         - maxVehicles
 *         - maxUsers
 *         - durationDays
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier (UUID)
 *         name:
 *           type: string
 *           description: Plan name (e.g., Basic, Premium, Enterprise)
 *         description:
 *           type: string
 *           description: Plan description
 *         price:
 *           type: number
 *           format: float
 *           description: Plan price in INR
 *         maxVehicles:
 *           type: integer
 *           description: Maximum number of vehicles allowed
 *         maxUsers:
 *           type: integer
 *           description: Maximum number of users allowed
 *         durationDays:
 *           type: integer
 *           description: Plan duration in days
 *         isActive:
 *           type: boolean
 *           description: Whether the plan is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const SubscriptionPlan = sequelize.define('SubscriptionPlan', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  planType: {
    type: DataTypes.ENUM('user', 'vehicle', 'combo'),
    allowNull: false,
    defaultValue: 'combo',
    field: 'plan_type'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  maxVehicles: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  maxUsers: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  durationDays: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'subscription_plans',
  timestamps: true
});

// Instance methods
SubscriptionPlan.prototype.getPriceInPaise = function() {
  return Math.round(this.price * 100);
};

SubscriptionPlan.prototype.getDurationInMonths = function() {
  return Math.round(this.durationDays / 30);
};

// Class methods
SubscriptionPlan.findActive = function() {
  return this.findAll({ where: { isActive: true } });
};

SubscriptionPlan.findByName = function(name) {
  return this.findOne({ where: { name } });
};

SubscriptionPlan.findByType = function(planType) {
  return this.findAll({ 
    where: { planType,
      isActive: true 
    } });
};

module.exports = SubscriptionPlan; 