const express = require('express');
const { User, Organization, Vehicle, Job, Subscription, Payment } = require('../models');
const { requireSuperadmin, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Superadmin analytics dashboard
router.get('/superadmin', requireSuperadmin, async (req, res) => {
  try {
    // Get total counts
    const totalOrganizations = await Organization.count();
    const totalUsers = await User.count();
    const totalVehicles = await Vehicle.count();
    const totalJobs = await Job.count();
    const totalSubscriptions = await Subscription.count();
    const totalPayments = await Payment.count();

    // Get revenue data
    const totalRevenue = await Payment.sum('amount', {
      where: { status: 'completed' }
    });

    // Get recent activities
    const recentJobs = await Job.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: ['organization', 'allocator', 'rider']
    });

    const recentPayments = await Payment.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: ['subscription']
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalOrganizations,
          totalUsers,
          totalVehicles,
          totalJobs,
          totalSubscriptions,
          totalPayments,
          totalRevenue: totalRevenue || 0
        },
        recentJobs,
        recentPayments
      }
    });
  } catch (error) {
    console.error('Superadmin analytics error:', error);
    res.status(500).json({
      error: 'Failed to get analytics',
      message: 'Internal server error'
    });
  }
});

// Admin analytics dashboard
router.get('/admin', requireAdmin, async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    // Get organization-specific counts
    const totalUsers = await User.count({
      where: { organizationId }
    });

    const totalVehicles = await Vehicle.count({
      where: { organizationId }
    });

    const totalJobs = await Job.count({
      where: { organizationId }
    });

    // Get job status breakdown
    const jobStatuses = await Job.findAll({
      where: { organizationId },
      attributes: ['status'],
      raw: true
    });

    const statusCounts = jobStatuses.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {});

    // Get recent jobs
    const recentJobs = await Job.findAll({
      where: { organizationId },
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: ['allocator', 'rider', 'vehicle']
    });

    // Get subscription info
    const activeSubscription = await Subscription.findActiveByOrganization(organizationId);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalVehicles,
          totalJobs,
          jobStatuses: statusCounts
        },
        recentJobs,
        subscription: activeSubscription
      }
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    res.status(500).json({
      error: 'Failed to get analytics',
      message: 'Internal server error'
    });
  }
});

module.exports = router; 