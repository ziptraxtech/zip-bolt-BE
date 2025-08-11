const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');

/**
 * @swagger
 * components:
 *   schemas:
 *     Organization:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier (UUID)
 *         name:
 *           type: string
 *           description: Organization name
 *         address:
 *           type: string
 *           description: Organization address
 *         city:
 *           type: string
 *           description: City
 *         state:
 *           type: string
 *           description: State/Province
 *         country:
 *           type: string
 *           description: Country
 *         phone:
 *           type: string
 *           description: Contact phone number
 *         email:
 *           type: string
 *           format: email
 *           description: Contact email address
 *         gstNumber:
 *           type: string
 *           description: GST registration number
 *         isActive:
 *           type: boolean
 *           description: Whether the organization is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const Organization = sequelize.define('Organization', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  state: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'India'
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  gstNumber: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'organizations',
  timestamps: true
});

// Instance methods
Organization.prototype.getFullAddress = function() {
  const parts = [this.address, this.city, this.state, this.country];
  return parts.filter(part => part).join(', ');
};

// Class methods
Organization.findActive = function() {
  return this.findAll({ where: { isActive: true } });
};

Organization.findByGST = function(gstNumber) {
  return this.findOne({ where: { gstNumber } });
};

module.exports = Organization; 