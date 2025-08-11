const express = require('express');
const Razorpay = require('razorpay');
const { Payment, Subscription } = require('../models');
const { validatePaymentVerification } = require('../middleware/validation');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create payment order
router.post('/create-order', requireAdmin, async (req, res) => {
  try {
    const { subscriptionId, amount } = req.body;

    const subscription = await Subscription.findByPk(subscriptionId);
    if (!subscription) {
      return res.status(404).json({
        error: 'Subscription not found',
        message: 'The specified subscription does not exist'
      });
    }

    const options = {
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      receipt: `sub_${subscriptionId}_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);

    // Create payment record
    const payment = await Payment.create({
      subscriptionId,
      razorpayOrderId: order.id,
      amount,
      status: 'pending'
    });

    res.json({
      success: true,
      message: 'Payment order created successfully',
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        paymentId: payment.id
      }
    });
  } catch (error) {
    console.error('Create payment order error:', error);
    res.status(500).json({
      error: 'Failed to create payment order',
      message: 'Internal server error'
    });
  }
});

// Verify payment
router.post('/verify', validatePaymentVerification, async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    // Verify signature
    const text = `${razorpayOrderId}|${razorpayPaymentId}`;
    const crypto = require('crypto');
    const signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    if (signature !== razorpaySignature) {
      return res.status(400).json({
        error: 'Invalid signature',
        message: 'Payment verification failed'
      });
    }

    // Update payment record
    const payment = await Payment.findByRazorpayOrder(razorpayOrderId);
    if (!payment) {
      return res.status(404).json({
        error: 'Payment not found',
        message: 'Payment record not found'
      });
    }

    await payment.update({
      razorpayPaymentId,
      status: 'completed',
      paidAt: new Date()
    });

    // Update subscription status
    const subscription = await Subscription.findByPk(payment.subscriptionId);
    if (subscription) {
      await subscription.update({ status: 'active' });
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: payment
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      error: 'Failed to verify payment',
      message: 'Internal server error'
    });
  }
});

module.exports = router; 