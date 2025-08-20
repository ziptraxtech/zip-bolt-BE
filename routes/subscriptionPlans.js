const express = require('express');
const { SubscriptionPlan } = require('../models');
const { validateSubscriptionPlanCreation } = require('../middleware/validation');
const { requireSuperadmin } = require('../middleware/auth');

const router = express.Router();

// Get available subscription plans
router.get('/', async (req, res) => {
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

// Create subscription plan
router.post('/', requireSuperadmin, validateSubscriptionPlanCreation, async (req, res) => {
  try {
    const plan = await SubscriptionPlan.create(req.body);
    res.json({
      success: true,
      message: 'Subscription plan created successfully',
      data: plan
    });
  } catch (error) {
    console.error('Create plan error:', error);
    res.status(500).json({
      error: 'Failed to create subscription plan',
      message: 'Internal server error'
    });
  }
});

// Update subscription plan
router.put('/:id', requireSuperadmin, validateSubscriptionPlanCreation, async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findByPk(req.params.id);
    if (!plan) {
      return res.status(404).json({
        error: 'Subscription plan not found',
        message: 'The specified subscription plan does not exist'
      });
    }

    await plan.update(req.body);

    res.json({
      success: true,
      message: 'Subscription plan updated successfully',
      data: plan
    });
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({
      error: 'Failed to update subscription plan',
      message: 'Internal server error'
    });
  }
});

// Delete subscription plan
router.delete('/:id', requireSuperadmin, async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findByPk(req.params.id);
    if (!plan) {
      return res.status(404).json({
        error: 'Subscription plan not found',
        message: 'The specified subscription plan does not exist'
      });
    }

    await plan.destroy();

    res.json({
      success: true,
      message: 'Subscription plan deleted successfully'
    });
  } catch (error) {
    console.error('Delete plan error:', error);
    res.status(500).json({
      error: 'Failed to delete subscription plan',
      message: 'Internal server error'
    });
  }
});

module.exports = router;
