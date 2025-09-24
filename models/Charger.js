const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

/**
 * @swagger
 * components:
 *   schemas:
 *     Charger:
 *       type: object
 *       required:
 *         - name
 *         - latitude
 *         - longitude
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier
 *         name:
 *           type: string
 *           description: Charger name
 *         latitude:
 *           type: number
 *           description: Latitude of the charger
 *         longitude:
 *           type: number
 *           description: Longitude of the charger
 *         address:
 *           type: string
 *           description: Address of the charger
 *         status:
 *           type: string
 *           enum: [active, inactive, under_maintenance]
 *           description: Charger status
 *         charger_type:
 *           type: string
 *           description: Charger type (e.g., fast, slow, DC, ,AC, Normal)
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const Charger = sequelize.define(
  "Charger",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'id'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'name'
    },
    latitude: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      field: 'latitude'
    },
    longitude: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      field: 'longitude'
    },
    address: {
      type: DataTypes.STRING,
      field: 'address'
    },
    status: {
      type: DataTypes.ENUM("active", "inactive", "under_maintenance"),
      defaultValue: "active",
      field: 'status'
    },
    charger_type: {
      type: DataTypes.STRING,
      field: 'charger_type'
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'createdAt'
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updatedAt'
    }
  },
  {
    tableName: "chargers",
    timestamps: true,
    underscored: false,  
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  }
);

module.exports = Charger;
