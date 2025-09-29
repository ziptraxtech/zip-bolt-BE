// routes/vehicleCategories.js
const express = require('express');
const { VehicleCategory } = require('../models');
const { body, validationResult } = require('express-validator');
const { requireSuperadmin } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateCategoryCreation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Category name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
];

/**
 * @swagger
 * /vehicle-categories:
 *   get:
 *     summary: Get all vehicle categories
 *     tags: [Vehicle Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Vehicle categories retrieved successfully
 */
router.get('/', async (req, res) => {
  try {
    const { isActive } = req.query;
    
    const whereClause = {};
    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    const categories = await VehicleCategory.findAll({
      where: whereClause,
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get vehicle categories error:', error);
    res.status(500).json({
      error: 'Failed to get vehicle categories',
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /vehicle-categories:
 *   post:
 *     summary: Create a new vehicle category (Superadmin only)
 *     tags: [Vehicle Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Two Wheeler"
 *     responses:
 *       201:
 *         description: Vehicle category created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Category already exists
 */
router.post('/', requireSuperadmin, validateCategoryCreation, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { name } = req.body;

    // Check if category already exists
    const existingCategory = await VehicleCategory.findByName(name);

    if (existingCategory) {
      return res.status(409).json({
        error: 'Category already exists',
        message: `Vehicle category "${name}" already exists`
      });
    }

    // Create new category
    const category = await VehicleCategory.create({ name });

    res.status(201).json({
      success: true,
      message: 'Vehicle category created successfully',
      data: category
    });
  } catch (error) {
    console.error('Create vehicle category error:', error);
    res.status(500).json({
      error: 'Failed to create vehicle category',
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /vehicle-categories/{id}:
 *   delete:
 *     summary: Delete vehicle category (Superadmin only)
 *     tags: [Vehicle Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       404:
 *         description: Category not found
 *       409:
 *         description: Category is in use by vehicles
 */
router.delete('/:id', requireSuperadmin, async (req, res) => {
  try {
    const category = await VehicleCategory.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({
        error: 'Category not found',
        message: 'The specified vehicle category does not exist'
      });
    }

    const { Vehicle } = require('../models');
    const vehicleCount = await Vehicle.count({
      where: { vehicleCategoryId: req.params.id }
    });

    if (vehicleCount > 0) {
      return res.status(409).json({
        error: 'Category is in use',
        message: `Cannot delete category. ${vehicleCount} vehicle(s) are using this category.`,
        vehiclesCount: vehicleCount
      });
    }

    await category.destroy();

    res.json({
      success: true,
      message: 'Vehicle category deleted successfully'
    });
  } catch (error) {
    console.error('Delete vehicle category error:', error);
    res.status(500).json({
      error: 'Failed to delete vehicle category',
      message: 'Internal server error'
    });
  }
});

module.exports = router;