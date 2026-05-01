const express = require('express');
const router = express.Router();
const productsController = require('../controllers/products.controller');

/**
 * GET /api/products
 * Retrieve all products with optional filtering and pagination
 * Query params:
 *  - category: Filter by category
 *  - search: Search by title
 *  - page: Page number (default: 1)
 *  - limit: Items per page (default: 10)
 */
router.get('/', productsController.getAllProducts);

/**
 * GET /api/products/:id
 * Retrieve a single product by ID
 */
router.get('/:id', productsController.getProductById);

/**
 * GET /api/products/category/:category
 * Retrieve products by category
 */
router.get('/category/:category', productsController.getProductsByCategory);

module.exports = router;
