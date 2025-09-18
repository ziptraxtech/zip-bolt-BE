const express = require('express');
const { Vehicle } = require('../models');
const { validateVehicleCreation, validateId } = require('../middleware/validation');
const { requireAdmin, requireAllocator } = require('../middleware/auth');

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

router.get('/organization', requireAllocator, async (req, res) => {
  try {
    const vehicles = await Vehicle.findByOrganization(req.user.organizationId);
    res.json({
      success: true,
      data: vehicles
    });
  } catch (error) {
    console.error('Get organization vehicles error:', error);
    res.status(500).json({
      error: 'Failed to get organization vehicles',
      message: 'Internal server error'
    });
  }
});

// ✅ Update vehicle
router.put('/:id', requireAdmin, validateId, async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);

    if (!vehicle || vehicle.organizationId !== req.user.organizationId) {
      return res.status(404).json({
        error: 'Vehicle not found',
        message: 'The specified vehicle does not exist in your organization'
      });
    }

    await vehicle.update(req.body);

    res.json({
      success: true,
      message: 'Vehicle updated successfully',
      data: vehicle
    });
  } catch (error) {
    console.error('Update vehicle error:', error);
    res.status(500).json({
      error: 'Failed to update vehicle',
      message: 'Internal server error'
    });
  }
});

// ✅ Delete vehicle
router.delete('/:id', requireAdmin, validateId, async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);

    if (!vehicle || vehicle.organizationId !== req.user.organizationId) {
      return res.status(404).json({
        error: 'Vehicle not found',
        message: 'The specified vehicle does not exist in your organization'
      });
    }

    await vehicle.destroy();

    res.json({
      success: true,
      message: 'Vehicle deleted successfully'
    });
  } catch (error) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({
      error: 'Failed to delete vehicle',
      message: 'Internal server error'
    });
  }
});

module.exports = router; 