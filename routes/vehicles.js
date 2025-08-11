const express = require('express');
const { Vehicle } = require('../models');
const { validateVehicleCreation, validateId } = require('../middleware/validation');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all vehicles
router.get('/', requireAdmin, async (req, res) => {
  try {
    const vehicles = await Vehicle.findByOrganization(req.user.organizationId);
    res.json({
      success: true,
      data: vehicles
    });
  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({
      error: 'Failed to get vehicles',
      message: 'Internal server error'
    });
  }
});

// Create vehicle
router.post('/', requireAdmin, validateVehicleCreation, async (req, res) => {
  try {
    const vehicle = await Vehicle.create({
      ...req.body,
      organizationId: req.user.organizationId
    });

    res.status(201).json({
      success: true,
      message: 'Vehicle created successfully',
      data: vehicle
    });
  } catch (error) {
    console.error('Create vehicle error:', error);
    res.status(500).json({
      error: 'Failed to create vehicle',
      message: 'Internal server error'
    });
  }
});

module.exports = router; 