/**
 * Orders Routes
 * GET endpoints for order management
 */

const express = require('express');
const OrdersController = require('../controllers/OrdersController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * GET /api/orders
 * Get all orders with optional filtering and pagination
 * Requires: Authorization header with JWT token
 * Query params: email, page, limit
 */
router.get('/', verifyToken, OrdersController.getAll);

/**
 * GET /api/orders/:orderId
 * Get a single order by ID
 * Requires: Authorization header with JWT token
 */
router.get('/:orderId', verifyToken, OrdersController.getById);

/**
 * GET /api/orders/user/:email
 * Get orders for a specific user by email
 * Requires: Authorization header with JWT token
 * Query params: page, limit
 */
router.get('/user/:email', verifyToken, OrdersController.getByEmail);

module.exports = router;
