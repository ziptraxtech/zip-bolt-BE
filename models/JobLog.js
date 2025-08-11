const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');

/**
 * @swagger
 * components:
 *   schemas:
 *     JobLog:
 *       type: object
 *       required:
 *         - jobId
 *         - userId
 *         - action
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier (UUID)
 *         jobId:
 *           type: string
 *           format: uuid
 *           description: ID of the job being logged
 *         userId:
 *           type: string
 *           format: uuid
 *           description: ID of the user performing the action
 *         action:
 *           type: string
 *           description: Action performed (e.g., created, assigned, accepted, started, completed)
 *         description:
 *           type: string
 *           description: Detailed description of the action
 *         metadata:
 *           type: object
 *           description: Additional data related to the action
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the log entry was created
 */

const JobLog = sequelize.define('JobLog', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  jobId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'jobs',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'job_logs',
  timestamps: true,
  updatedAt: false, // Only track creation time
  indexes: [
    {
      fields: ['jobId']
    },
    {
      fields: ['userId']
    },
    {
      fields: ['action']
    },
    {
      fields: ['createdAt']
    }
  ]
});

// Instance methods
JobLog.prototype.getFormattedAction = function() {
  return this.action.replace(/_/g, ' ').toUpperCase();
};

// Class methods
JobLog.findByJob = function(jobId) {
  return this.findAll({ 
    where: { jobId },
    include: ['user'],
    order: [['createdAt', 'DESC']]
  });
};

JobLog.findByUser = function(userId) {
  return this.findAll({ 
    where: { userId },
    include: ['job'],
    order: [['createdAt', 'DESC']]
  });
};

JobLog.findByAction = function(action, jobId = null) {
  const where = { action };
  if (jobId) where.jobId = jobId;
  
  return this.findAll({ 
    where,
    include: ['user', 'job'],
    order: [['createdAt', 'DESC']]
  });
};

JobLog.createLog = function(jobId, userId, action, description = null, metadata = null) {
  return this.create({
    jobId,
    userId,
    action,
    description,
    metadata
  });
};

module.exports = JobLog; 