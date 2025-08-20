const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');

/**
 * @swagger
 * components:
 *   schemas:
 *     Vehicle:
 *       type: object
 *       required:
 *         - organizationId
 *         - vehicleNumber
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier (UUID)
 *         organizationId:
 *           type: string
 *           format: uuid
 *           description: ID of the organization that owns the vehicle
 *         vehicleNumber:
 *           type: string
 *           description: Vehicle registration number
 *         vehicleType:
 *           type: string
 *           description: Type of vehicle (e.g., Bike, Car, Truck)
 *         model:
 *           type: string
 *           description: Vehicle model
 *         make:
 *           type: string
 *           description: Vehicle manufacturer
 *         year:
 *           type: integer
 *           description: Manufacturing year
 *         color:
 *           type: string
 *           description: Vehicle color
 *         status:
 *           type: string
 *           enum: [active, inactive, maintenance]
 *           description: Vehicle status
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const Vehicle = sequelize.define('Vehicle', {
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
  vehicleNumber: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  vehicleType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'Bike'
  },
  model: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  make: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1900,
      max: new Date().getFullYear() + 1
    }
  },
  color: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'maintenance'),
    defaultValue: 'active'
  }
}, {
  tableName: 'vehicles',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['organization_id', 'vehicle_number']
    }
  ]
});

// Instance methods
Vehicle.prototype.isAvailable = function() {
  return this.status === 'active';
};

Vehicle.prototype.getFullName = function() {
  const parts = [this.make, this.model, this.year, this.color];
  return parts.filter(part => part).join(' ');
};

// Class methods
Vehicle.findByOrganization = function(organizationId) {
  return this.findAll({ where: { organizationId } });
};

Vehicle.findActiveByOrganization = function(organizationId) {
  return this.findAll({ 
    where: { 
      organizationId,
      status: 'active'
    }
  });
};

Vehicle.findByNumber = function(vehicleNumber, organizationId) {
  return this.findOne({ 
    where: { 
      vehicleNumber,
      organizationId
    }
  });
};

module.exports = Vehicle; 