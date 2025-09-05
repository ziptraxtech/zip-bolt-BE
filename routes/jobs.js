const express = require('express');
const axios = require('axios');
const { Job, JobLog } = require('../models');
const { validateJobStatusUpdate, validateId, validateJobCreation } = require('../middleware/validation');
const { authenticateToken, requireAllocator, requireSuperadmin } = require('../middleware/auth');

const router = express.Router();

/**
 * Utility function to get lat/lng from OpenStreetMap Nominatim API
 */
async function geocodeAddress(address) {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: address,
        format: 'json',
        limit: 1
      },
      headers: {
        'User-Agent': 'zip-bolt-app' // required by Nominatim usage policy
      }
    });

    if (response.data && response.data.length > 0) {
      return {
        lat: parseFloat(response.data[0].lat),
        lon: parseFloat(response.data[0].lon)
      };
    }

    return { lat: null, lon: null };
  } catch (error) {
    console.error('Geocoding error:', error.message);
    return { lat: null, lon: null };
  }
}

// Get all jobs
router.get('/', authenticateToken, async (req, res) => {
  try {
    const jobs = await Job.findByOrganization(req.user.organizationId);
    res.json({ success: true, data: jobs });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ error: 'Failed to get jobs', message: 'Internal server error' });
  }
});

// Create job
router.post('/', requireAllocator, validateJobCreation, async (req, res) => {
  try {
    const {
      pickupAddress,
      pickupCity,
      pickupState,
      pickupPin,
      deliveryAddress,
      deliveryCity,
      deliveryState,
      deliveryPin,
      title,
      description,
      scheduleTime,
      vehicleId,
      riderId,
      pickupLatitude,
      pickupLongitude,
      deliveryLatitude,
      deliveryLongitude
    } = req.body;

    const pickupLocation = `${pickupAddress}, ${pickupCity}, ${pickupState} - ${pickupPin}`;
    const deliveryLocation = `${deliveryAddress}, ${deliveryCity}, ${deliveryState} - ${deliveryPin}`;

    const job = await Job.create({
      title,
      description,
      scheduledTime: scheduleTime,
      vehicleId,
      riderId,
      organizationId: req.user.organizationId,
      allocatorId: req.user.id,

      pickupLocation,
      pickupAddress,
      pickupCity,
      pickupState,
      pickupPincode: pickupPin,
      pickupLatitude: pickupLatitude || null,
      pickupLongitude: pickupLongitude || null,

      deliveryLocation,
      deliveryAddress,
      deliveryCity,
      deliveryState,
      deliveryPincode: deliveryPin,
      deliveryLatitude: deliveryLatitude || null,
      deliveryLongitude: deliveryLongitude || null
    });

    await JobLog.createLog(job.id, req.user.id, 'created', 'Job created');

    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: job
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ error: 'Failed to create job', message: 'Internal server error' });
  }
});

// Update job status (assign rider & vehicle)
router.put('/:id/status', authenticateToken, validateId, async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found', message: 'The specified job does not exist' });
    }

    if (job.organizationId !== req.user.organizationId) {
      return res.status(403).json({ error: 'Access denied', message: 'You can only update jobs from your organization' });
    }

    const { riderId, vehicleId } = req.body;
    await job.update({ riderId, vehicleId, status: 'assigned' });

    await JobLog.createLog(job.id, req.user.id, 'status_updated', `Job status updated to assigned`);

    res.json({ success: true, message: 'Job status updated successfully', data: job });
  } catch (error) {
    console.error('Update job status error:', error);
    res.status(500).json({ error: 'Failed to update job status', message: 'Internal server error' });
  }
});

// Get all jobs superadmin
router.get('/superadmin', authenticateToken, requireSuperadmin, async (req, res) => {
  try {
    const jobs = await Job.findAll();
    res.json({ success: true, data: jobs });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ error: 'Failed to get jobs', message: 'Internal server error' });
  }
});

// Get my assigned jobs
router.get('/my-jobs', authenticateToken, async (req, res) => {
  try {
    const jobs = await Job.findAll({ where: { riderId: req.user.id } });
    res.json({ success: true, data: jobs });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ error: 'Failed to get jobs', message: 'Internal server error' });
  }
});

// Update my job status
router.put('/my-jobs/:id/status', authenticateToken, validateId, validateJobStatusUpdate, async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found', message: 'The specified job does not exist' });
    }

    if (job.organizationId !== req.user.organizationId) {
      return res.status(403).json({ error: 'Access denied', message: 'You can only update jobs from your organization' });
    }

    const { status } = req.body;
    await job.update({ status });

    await JobLog.createLog(job.id, req.user.id, 'status_updated', `Job status updated to ${status}`);

    res.json({ success: true, message: 'Job status updated successfully', data: job });
  } catch (error) {
    console.error('Update job status error:', error);
    res.status(500).json({ error: 'Failed to update job status', message: 'Internal server error' });
  }
});

module.exports = router;