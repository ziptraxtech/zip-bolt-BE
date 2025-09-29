// models/VehicleCategory.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * @swagger
 * components:
 *   schemas:
 *     VehicleCategory:
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
 *           description: Category name (e.g., Two Wheeler, Four Wheeler, Heavy Vehicle)
 *         isActive:
 *           type: boolean
 *           description: Whether the category is active
 *           default: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const VehicleCategory = sequelize.define('VehicleCategory', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: {
      msg: 'Vehicle category name must be unique'
    },
    validate: {
      notEmpty: {
        msg: 'Category name cannot be empty'
      },
      len: {
        args: [2, 100],
        msg: 'Category name must be between 2 and 100 characters'
      }
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  }
}, {
  tableName: 'vehicle_categories',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['name']
    }
  ]
});

// Instance methods
VehicleCategory.prototype.activate = function() {
  return this.update({ isActive: true });
};

VehicleCategory.prototype.deactivate = function() {
  return this.update({ isActive: false });
};

// Class methods
VehicleCategory.findActive = function() {
  return this.findAll({ 
    where: { isActive: true },
    order: [['name', 'ASC']]
  });
};

VehicleCategory.findByName = function(name) {
  return this.findOne({ 
    where: { name }
  });
};

module.exports = VehicleCategory;