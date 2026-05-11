// src/routes/checkoutRoutes.js
const express = require('express');
const rateLimit = require('express-rate-limit');
const CheckoutController = require('../controllers/CheckoutController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Rate limiting to mitigate brute force / DoS on checkout
const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // max 5 attempts per user (auth'd) per window
  message: 'Too many checkout attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  handler: (req, res) => {
    console.warn(`[SECURITY] Rate limit exceeded for ${req.user?.id || req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many checkout requests. Please wait 15 minutes before retrying.'
    });
  },
  skip: (req) => process.env.NODE_ENV === 'test',
});

// POST /api/checkout
// Authenticate, apply rate limit, then process securely
router.post('/', verifyToken, checkoutLimiter, CheckoutController.processCheckout);

// GET /api/checkout/status/:orderId
router.get('/status/:orderId', verifyToken, CheckoutController.getOrderStatus);

module.exports = router;