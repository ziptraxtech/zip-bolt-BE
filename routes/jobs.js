const express = require('express');
const { Job, JobLog } = require('../models');
const { validateJobCreation, validateJobStatusUpdate, validateId } = require('../middleware/validation');
const { authenticateToken, requireAllocator, requireSuperadmin } = require('../middleware/auth');

const router = express.Router();

// Get all jobs
router.get('/', authenticateToken, async (req, res) => {
  try {
    const jobs = await Job.findByOrganization(req.user.organizationId);
    res.json({
      success: true,
      data: jobs
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({
      error: 'Failed to get jobs',
      message: 'Internal server error'
    });
  }
});

// Create job
router.post('/', requireAllocator, validateJobCreation, async (req, res) => {
  try {
    const job = await Job.create({
      ...req.body,
      organizationId: req.user.organizationId,
      allocatorId: req.user.id
    });

    // Create job log
    await JobLog.createLog(job.id, req.user.id, 'created', 'Job created');

    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: job
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({
      error: 'Failed to create job',
      message: 'Internal server error'
    });
  }
});

// Update job status
router.put('/:id/status', authenticateToken, validateId, async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.id);
    if (!job) {
      return res.status(404).json({
        error: 'Job not found',
        message: 'The specified job does not exist'
      });
    }

    // Check if user has access to this job (same organization)
    if (job.organizationId !== req.user.organizationId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only update jobs from your organization'
      });
    }

    // const { status } = req.body;
    const {riderId, vehicleId} = req.body;
    await job.update({ riderId, vehicleId});
    await job.update({ status: "assigned" });

    // Create job log
    await JobLog.createLog(job.id, req.user.id, 'status_updated', `Job status updated to assigned`);

    res.json({
      success: true,
      message: 'Job status updated successfully',
      data: job
    });
  } catch (error) {
    console.error('Update job status error:', error);
    res.status(500).json({
      error: 'Failed to update job status',
      message: 'Internal server error'
    });
  }
});

//get all jobs superadmin
router.get('/superadmin', authenticateToken, requireSuperadmin, async (req, res) => {
  try {
    const jobs = await Job.findAll();
    res.json({
      success: true,
      data: jobs
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({
      error: 'Failed to get jobs',
      message: 'Internal server error'
    });
  }
});

//get my assigned jobs
router.get('/my-jobs', authenticateToken, async (req, res) => {
  try {
    const jobs = await Job.findByAllocator(req.user.id);
    res.json({
      success: true,
      data: jobs
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({
      error: 'Failed to get jobs',
      message: 'Internal server error'
    });
  }
});

//update my job status
router.put('/my-jobs/:id/status', authenticateToken, validateId, validateJobStatusUpdate, async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.id);
    if (!job) {
      return res.status(404).json({
        error: 'Job not found',
        message: 'The specified job does not exist'
      });
    }

    // Check if user has access to this job (same organization)
    if (job.organizationId !== req.user.organizationId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only update jobs from your organization'
      });
    }

    const { status } = req.body;
    await job.update({ status });

    // Create job log
    await JobLog.createLog(job.id, req.user.id, 'status_updated', `Job status updated to ${status}`);

    res.json({
      success: true,
      message: 'Job status updated successfully',
      data: job
    });
  } catch (error) {
    console.error('Update job status error:', error);
    res.status(500).json({
      error: 'Failed to update job status',
      message: 'Internal server error'
    });
  }
});

module.exports = router; 