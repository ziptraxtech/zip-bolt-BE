const express = require('express');
const Razorpay = require('razorpay');
const { Payment, Subscription, Organization } = require('../models');
const { validatePaymentVerification } = require('../middleware/validation');
const { requireAdmin } = require('../middleware/auth');
const { authenticateToken, requireSuperadmin } = require('../middleware/auth');

const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn('Razorpay keys are missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
}

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

    const shortId = subscriptionId.slice(0, 8);
    const receipt = `sub_${shortId}_${Date.now().toString(36)}`;

    const options = {
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      receipt: receipt
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
    const details = error && error.error ? error.error : error;
    console.error('Create payment order error:', details);
    return res.status(500).json({
      error: 'Failed to create payment order',
      message: details && details.description ? details.description : 'Internal server error'
    });
  }
});

// Verify payment
router.post('/verify', validatePaymentVerification, async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    // Resolve actual Razorpay payment id if a local UUID was passed
    let resolvedPaymentId = razorpayPaymentId;
    if (!/^pay_/.test(razorpayPaymentId)) {
      // Load our local payment record by UUID to ensure the order matches
      const local = await Payment.findByPk(razorpayPaymentId);
      if (!local || local.razorpayOrderId !== razorpayOrderId) {
        return res.status(400).json({
          error: 'Invalid payment reference',
          message: 'Payment does not match the provided order'
        });
      }
      // List payments for the order and pick a successful one
      const list = await razorpay.orders.fetchPayments(razorpayOrderId);
      const ok = (list && list.items || []).find(p => ['captured','authorized'].includes(p.status));
      if (!ok) {
        return res.status(400).json({
          error: 'Payment not successful',
          message: 'No successful payment found for this order'
        });
      }
      resolvedPaymentId = ok.id; // pay_...
    }

    // If signature provided, verify using HMAC
    if (razorpaySignature) {
      const text = `${razorpayOrderId}|${resolvedPaymentId}`;
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
    } else {
      // Fallback: No signature was provided. Verify server-to-server with Razorpay API.
      const remotePayment = await razorpay.payments.fetch(resolvedPaymentId);

      if (!remotePayment) {
        return res.status(404).json({
          error: 'Payment not found',
          message: 'Razorpay payment not found'
        });
      }

      // Ensure payment belongs to the provided order
      if (remotePayment.order_id !== razorpayOrderId) {
        return res.status(400).json({
          error: 'Payment-order mismatch',
          message: 'Payment does not belong to the specified order'
        });
      }

      // Accept only successful states
      if (!['captured', 'authorized'].includes(remotePayment.status)) {
        return res.status(400).json({
          error: 'Payment not successful',
          message: `Payment status is ${remotePayment.status}`
        });
      }
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
      razorpayPaymentId: resolvedPaymentId,
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
    const details = error && error.error ? error.error : error;
    console.error('Verify payment error:', details);
    res.status(500).json({
      error: 'Failed to verify payment',
      message: details && details.description ? details.description : 'Internal server error'
    });
  }
});

//get all payments with name of organization (superadmin)
router.get('/superadmin', authenticateToken, requireSuperadmin, async (req, res) => {
  try {
    const payments = await Payment.findAll({
      include: [
        {
          model: Subscription,
          as: 'subscription',
          include: [
            {
              model: Organization,
              as: 'organization',
              attributes: ['name']
            }
          ]
        }
      ]
    });
    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      error: 'Failed to get payments',
      message: 'Internal server error'
    });
  }
});


router.get('/superadmin/csv', authenticateToken, requireSuperadmin, async (req, res) => {
  try {
    const payments = await Payment.findAll({
      include: [
        {
          model: Subscription,
          as: 'subscription',
          include: [
            {
              model: Organization,
              as: 'organization',
              attributes: ['name']
            }
          ]
        }
      ]
    });

    const csvHeaders = [
      'Organization Name',
      'Amount',
      'Currency',
      'Status',
      'Payment Date',
      'Razorpay Order ID',
      'Razorpay Payment ID',
      'Created At',
      'Updated At'
    ];

    const csvRows = payments.map(payment => {
      const paymentData = payment.toJSON();
      return [
        paymentData.subscription?.organization?.name || '',
        paymentData.amount || '',
        paymentData.currency || '',
        paymentData.status || '',
        paymentData.paidAt ? new Date(paymentData.paidAt).toISOString() : '',
        paymentData.razorpayOrderId || '',
        paymentData.razorpayPaymentId || '',
        paymentData.createdAt ? new Date(paymentData.createdAt).toISOString() : '',
        paymentData.updatedAt ? new Date(paymentData.updatedAt).toISOString() : ''
      ];
    });

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => 
        row.map(field => {
          if (typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n')))
          if (typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))) {
            return `"${field.replace(/"/g, '""')}"`;
          }
          return field;
        }).join(',')
      )
    ].join('\n');

    const filename = `payments-export-${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Pragma', 'no-cache');

    res.status(200).send(csvContent);

  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({
      error: 'Failed to export payments to CSV',
      message: 'Internal server error'
    });
  }
});

module.exports = router; 