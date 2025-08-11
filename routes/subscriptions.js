const express = require('express');
const { SubscriptionPlan, Subscription } = require('../models');
const { validateSubscriptionCreation } = require('../middleware/validation');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get available subscription plans
router.get('/plans', async (req, res) => {
  try {
    const plans = await SubscriptionPlan.findActive();
    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({
      error: 'Failed to get subscription plans',
      message: 'Internal server error'
    });
  }
});

// Create subscription
router.post('/', requireAdmin, validateSubscriptionCreation, async (req, res) => {
  try {
    const { planId } = req.body;
    
    // Get plan details
    const plan = await SubscriptionPlan.findByPk(planId);
    if (!plan) {
      return res.status(400).json({
        error: 'Invalid plan',
        message: 'The specified plan does not exist'
      });
    }

    // Create subscription
    const subscription = await Subscription.create({
      organizationId: req.user.organizationId,
      planId,
      startDate: new Date(),
      endDate: new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000),
      amount: plan.price,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: subscription
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({
      error: 'Failed to create subscription',
      message: 'Internal server error'
    });
  }
});

module.exports = router; 