const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');

/**
 * @swagger
 * components:
 *   schemas:
 *     Payment:
 *       type: object
 *       required:
 *         - subscriptionId
 *         - amount
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier (UUID)
 *         subscriptionId:
 *           type: string
 *           format: uuid
 *           description: ID of the subscription being paid for
 *         razorpayOrderId:
 *           type: string
 *           description: Razorpay order ID
 *         razorpayPaymentId:
 *           type: string
 *           description: Razorpay payment ID
 *         amount:
 *           type: number
 *           format: float
 *           description: Payment amount in INR
 *         status:
 *           type: string
 *           enum: [pending, completed, failed, refunded]
 *           description: Payment status
 *         currency:
 *           type: string
 *           description: Payment currency (default INR)
 *         paidAt:
 *           type: string
 *           format: date-time
 *           description: When the payment was completed
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  subscriptionId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'subscriptions',
      key: 'id'
    }
  },
  razorpayOrderId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true
  },
  razorpayPaymentId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
    defaultValue: 'pending'
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'INR'
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'payments',
  timestamps: true,
  indexes: [
    {
      fields: ['subscriptionId']
    },
    {
      fields: ['status']
    },
    {
      unique: true,
      fields: ['razorpayOrderId']
    },
    {
      unique: true,
      fields: ['razorpayPaymentId']
    }
  ]
});

// Instance methods
Payment.prototype.isSuccessful = function() {
  return this.status === 'completed';
};

Payment.prototype.isPending = function() {
  return this.status === 'pending';
};

Payment.prototype.isFailed = function() {
  return this.status === 'failed';
};

Payment.prototype.getAmountInPaise = function() {
  return Math.round(this.amount * 100);
};

// Class methods
Payment.findBySubscription = function(subscriptionId) {
  return this.findAll({ where: { subscriptionId } });
};

Payment.findSuccessful = function() {
  return this.findAll({ where: { status: 'completed' } });
};

Payment.findByRazorpayOrder = function(orderId) {
  return this.findOne({ where: { razorpayOrderId: orderId } });
};

Payment.findByRazorpayPayment = function(paymentId) {
  return this.findOne({ where: { razorpayPaymentId: paymentId } });
};

module.exports = Payment; 