/**
 * Product Routes
 * GET endpoints for product operations
 */

const express = require('express');
const ProductController = require('../controllers/ProductController');

const router = express.Router();

/**
 * GET /api/products
 * Get all products with optional filtering, searching, and pagination
 * Query params: category, search, page, limit
 */
router.get('/', ProductController.getAll);

/**
 * GET /api/products/count
 * Get total product count
 */
router.get('/count', ProductController.getCount);

/**
 * GET /api/products/categories
 * Get all product categories
 */
router.get('/categories', ProductController.getCategories);

/**
 * GET /api/products/:id
 * Get a single product by ID
 */
router.get('/:id', ProductController.getById);

/**
 * GET /api/products/category/:category
 * Get products by category with pagination
 * Query params: page, limit
 */
router.get('/category/:category', ProductController.getByCategory);

module.exports = router;
