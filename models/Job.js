const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');

/**
 * @swagger
 * components:
 *   schemas:
 *     Job:
 *       type: object
 *       required:
 *         - organizationId
 *         - allocatorId
 *         - title
 *         - pickupLocation
 *         - deliveryLocation
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier (UUID)
 *         organizationId:
 *           type: string
 *           format: uuid
 *           description: ID of the organization managing the job
 *         allocatorId:
 *           type: string
 *           format: uuid
 *           description: ID of the allocator who created the job
 *         riderId:
 *           type: string
 *           format: uuid
 *           description: ID of the rider assigned to the job
 *         vehicleId:
 *           type: string
 *           format: uuid
 *           description: ID of the vehicle assigned to the job
 *         title:
 *           type: string
 *           description: Job title
 *         description:
 *           type: string
 *           description: Detailed job description
 *         pickupLocation:
 *           type: string
 *           description: Pickup location address
 *         deliveryLocation:
 *           type: string
 *           description: Delivery location address
 *         pickupLatitude:
 *           type: number
 *           format: float
 *           description: Pickup location latitude
 *         pickupLongitude:
 *           type: number
 *           format: float
 *           description: Pickup location longitude
 *         deliveryLatitude:
 *           type: number
 *           format: float
 *           description: Delivery location latitude
 *         deliveryLongitude:
 *           type: number
 *           format: float
 *           description: Delivery location longitude
 *         scheduledTime:
 *           type: string
 *           format: date-time
 *           description: Scheduled job time
 *         status:
 *           type: string
 *           enum: [assigned, accepted, in_progress, completed, cancelled]
 *           description: Current job status
 *         assignedAt:
 *           type: string
 *           format: date-time
 *           description: When the job was assigned
 *         startedAt:
 *           type: string
 *           format: date-time
 *           description: When the job was started
 *         completedAt:
 *           type: string
 *           format: date-time
 *           description: When the job was completed
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const Job = sequelize.define('Job', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'organizations',
      key: 'id'
    }
  },
  allocatorId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  riderId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  vehicleId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'vehicles',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  pickupLocation: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  deliveryLocation: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  pickupLatitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true
  },
  pickupLongitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true
  },
  deliveryLatitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true
  },
  deliveryLongitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true
  },
  scheduledTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('assigned', 'accepted', 'in_progress', 'completed', 'cancelled'),
    defaultValue: 'assigned'
  },
  assignedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'jobs',
  timestamps: true,
  indexes: [
    {
      fields: ['organizationId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['riderId']
    },
    {
      fields: ['allocatorId']
    },
    {
      fields: ['scheduledTime']
    }
  ]
});

// Instance methods
Job.prototype.canBeAccepted = function() {
  return this.status === 'assigned';
};

Job.prototype.canBeStarted = function() {
  return this.status === 'accepted';
};

Job.prototype.canBeCompleted = function() {
  return this.status === 'in_progress';
};

Job.prototype.canBeCancelled = function() {
  return ['assigned', 'accepted'].includes(this.status);
};

Job.prototype.getDuration = function() {
  if (!this.startedAt || !this.completedAt) return null;
  return new Date(this.completedAt) - new Date(this.startedAt);
};

// Class methods
Job.findByOrganization = function(organizationId) {
  return this.findAll({ 
    where: { organizationId },
    include: ['allocator', 'rider', 'vehicle']
  });
};

Job.findByRider = function(riderId) {
  return this.findAll({ 
    where: { riderId },
    include: ['allocator', 'vehicle']
  });
};

Job.findByStatus = function(status, organizationId = null) {
  const where = { status };
  if (organizationId) where.organizationId = organizationId;
  
  return this.findAll({ 
    where,
    include: ['allocator', 'rider', 'vehicle']
  });
};

Job.findPending = function(organizationId = null) {
  const where = {
    status: {
      [sequelize.Op.in]: ['assigned', 'accepted']
    }
  };
  if (organizationId) where.organizationId = organizationId;
  
  return this.findAll({ 
    where,
    include: ['allocator', 'rider', 'vehicle']
  });
};

module.exports = Job; 