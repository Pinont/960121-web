/**
 * Checkout Routes
 * POST endpoint for checkout operations
 */

const express = require('express');
const CheckoutController = require('../controllers/CheckoutController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * POST /api/checkout
 * Process checkout: validate cart and payment, create order
 * Requires: Authorization header with JWT token
 *
 * Request Body:
 * {
 *   "cart": { "1": { "quantity": 2 }, "3": { "quantity": 1 } },
 *   "email": "user@example.com",
 *   "cardNumber": "1234567890123456"
 * }
 *
 * Response (Success - 201):
 * {
 *   "success": true,
 *   "message": "Order created successfully!",
 *   "data": {
 *     "orderId": "ORD-...",
 *     "email": "user@example.com",
 *     "total": 350.00,
 *     "items": [...]
 *   }
 * }
 *
 * Response (Validation Error - 400):
 * {
 *   "success": false,
 *   "message": "Validation failed. Please check the errors below.",
 *   "errors": {
 *     "email": "Invalid email format",
 *     "cardNumber": "Credit card must be 16 digits"
 *   }
 * }
 */
router.post('/', verifyToken, CheckoutController.processCheckout);

module.exports = router;
