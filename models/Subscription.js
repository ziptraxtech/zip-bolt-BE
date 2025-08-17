const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');

/**
 * @swagger
 * components:
 *   schemas:
 *     Subscription:
 *       type: object
 *       required:
 *         - organizationId
 *         - planId
 *         - startDate
 *         - endDate
 *         - amount
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier (UUID)
 *         organizationId:
 *           type: string
 *           format: uuid
 *           description: ID of the subscribing organization
 *         planId:
 *           type: string
 *           format: uuid
 *           description: ID of the subscription plan
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Subscription start date
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: Subscription end date
 *         status:
 *           type: string
 *           enum: [active, expired, cancelled, pending]
 *           description: Subscription status
 *         amount:
 *           type: number
 *           format: float
 *           description: Subscription amount in INR
 *         paymentId:
 *           type: string
 *           description: Payment reference ID
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const Subscription = sequelize.define('Subscription', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  organizationId: {
    type: DataTypes.UUIDV4,
    allowNull: false,
    references: {
      model: 'organizations',
      key: 'id'
    }
  },
  planId: {
    type: DataTypes.UUIDV4,
    allowNull: false,
    references: {
      model: 'subscription_plans',
      key: 'id'
    }
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'expired', 'cancelled', 'pending'),
    defaultValue: 'pending'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  paymentId: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'subscriptions',
  timestamps: true
});

// Instance methods
Subscription.prototype.isActive = function() {
  const now = new Date();
  return this.status === 'active' && now >= this.startDate && now <= this.endDate;
};

Subscription.prototype.isExpired = function() {
  const now = new Date();
  return now > this.endDate;
};

Subscription.prototype.getDaysRemaining = function() {
  const now = new Date();
  const end = new Date(this.endDate);
  const diffTime = end - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Class methods
Subscription.findActiveByOrganization = function(organizationId) {
  return this.findOne({
    where: {
      organizationId,
      status: 'active'
    },
    include: ['plan']
  });
};

Subscription.findExpired = function() {
  const now = new Date();
  return this.findAll({
    where: {
      endDate: {
        [sequelize.Op.lt]: now
      },
      status: 'active'
    }
  });
};

module.exports = Subscription; 