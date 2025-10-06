const express = require('express');
const { SubscriptionPlan, Subscription, Vehicle, User } = require('../models');
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

// Get plans by type
router.get('/plans/:type', async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!['user', 'vehicle', 'combo'].includes(type)) {
      return res.status(400).json({
        error: 'Invalid plan type',
        message: 'Plan type must be user, vehicle, or combo'
      });
    }

    const plans = await SubscriptionPlan.findByType(type);
    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Get plans by type error:', error);
    res.status(500).json({
      error: 'Failed to get subscription plans',
      message: 'Internal server error'
    });
  }
});

// Create subscription
router.post('/', requireAdmin, validateSubscriptionCreation, async (req, res) => {
  try {
    const { userPlanId, vehiclePlanId, planId } = req.body;
    
    // Get current counts
    const vehicleCount = await Vehicle.count({ 
      where: { organizationId: req.user.organizationId } 
    });
    
    const userCount = await User.count({ 
      where: { organizationId: req.user.organizationId } 
    });

    let subscriptionData = {
      organizationId: req.user.organizationId,
      startDate: new Date(),
      status: 'pending',
      amount: 0
    };

    let totalAmount = 0;
    let maxEndDate = new Date();

    // Case 1: Combo plan (backward compatibility or when both exist)
    if (planId) {
      const plan = await SubscriptionPlan.findByPk(planId);
      if (!plan) {
        return res.status(400).json({
          error: 'Invalid plan',
          message: 'The specified plan does not exist'
        });
      }

      subscriptionData.planId = planId;
      subscriptionData.endDate = new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000);
      subscriptionData.amount = plan.price;
    } 
    // Case 2: Separate user and/or vehicle plans
    else {
      // Validate based on current counts
      if (userCount === 0 && vehicleCount === 0) {
        // Both are 0 - can subscribe to either or both
        if (!userPlanId && !vehiclePlanId) {
          return res.status(400).json({
            error: 'Invalid request',
            message: 'Please select at least one plan (user plan or vehicle plan)'
          });
        }
      } else if (userCount === 0 && vehicleCount > 0) {
        // Only users are 0 - can only subscribe to user plan
        if (!userPlanId || vehiclePlanId) {
          return res.status(400).json({
            error: 'Invalid request',
            message: 'You can only subscribe to a user plan since you have vehicles but no users'
          });
        }
      } else if (vehicleCount === 0 && userCount > 0) {
        // Only vehicles are 0 - can only subscribe to vehicle plan
        if (!vehiclePlanId || userPlanId) {
          return res.status(400).json({
            error: 'Invalid request',
            message: 'You can only subscribe to a vehicle plan since you have users but no vehicles'
          });
        }
      } else {
        // Both exist - can subscribe to both
        if (!userPlanId || !vehiclePlanId) {
          return res.status(400).json({
            error: 'Invalid request',
            message: 'You must subscribe to both user and vehicle plans since you have both users and vehicles'
          });
        }
      }

      // Process user plan
      if (userPlanId) {
        const userPlan = await SubscriptionPlan.findByPk(userPlanId);
        if (!userPlan || userPlan.planType !== 'user') {
          return res.status(400).json({
            error: 'Invalid user plan',
            message: 'The specified user plan does not exist or is not a user plan'
          });
        }

        subscriptionData.userPlanId = userPlanId;
        totalAmount += parseFloat(userPlan.price);
        
        const userPlanEndDate = new Date(Date.now() + userPlan.durationDays * 24 * 60 * 60 * 1000);
        if (userPlanEndDate > maxEndDate) {
          maxEndDate = userPlanEndDate;
        }
      }

      // Process vehicle plan
      if (vehiclePlanId) {
        const vehiclePlan = await SubscriptionPlan.findByPk(vehiclePlanId);
        if (!vehiclePlan || vehiclePlan.planType !== 'vehicle') {
          return res.status(400).json({
            error: 'Invalid vehicle plan',
            message: 'The specified vehicle plan does not exist or is not a vehicle plan'
          });
        }

        subscriptionData.vehiclePlanId = vehiclePlanId;
        totalAmount += parseFloat(vehiclePlan.price);
        
        const vehiclePlanEndDate = new Date(Date.now() + vehiclePlan.durationDays * 24 * 60 * 60 * 1000);
        if (vehiclePlanEndDate > maxEndDate) {
          maxEndDate = vehiclePlanEndDate;
        }
      }

      subscriptionData.endDate = maxEndDate;
      subscriptionData.amount = totalAmount;
    }

    // Create subscription
    const subscription = await Subscription.create(subscriptionData);

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