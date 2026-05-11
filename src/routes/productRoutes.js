/**
 * Product Routes
 * src/routes/productRoutes.js
 *
 * FIXED vs original:
 *  - /category/:category was declared AFTER /:id — Express matched "category"
 *    as an id value, making /category/:category permanently unreachable.
 *  - All static-segment routes (/categories, /count, /category/:category)
 *    are now declared BEFORE the dynamic /:id route.
 */

const express           = require('express');
const ProductController = require('../controllers/ProductController');

const router = express.Router();

/**
 * GET /api/products
 * Get all products with optional filtering, searching, and pagination.
 * Query params: category, search, page, limit
 */
router.get('/', ProductController.getAll);

/**
 * GET /api/products/categories
 * Get all distinct product categories.
 * FIXED: Must be BEFORE /:id — otherwise "categories" matches as an id.
 */
router.get('/categories', ProductController.getCategories);

/**
 * GET /api/products/count
 * Get total product count.
 * FIXED: Must be BEFORE /:id — otherwise "count" matches as an id.
 */
router.get('/count', ProductController.getCount);

/**
 * GET /api/products/category/:category
 * Get products filtered by category with pagination.
 * FIXED: Moved above /:id — previously unreachable due to route shadowing.
 * Query params: page, limit
 */
router.get('/category/:category', ProductController.getByCategory);

/**
 * GET /api/products/:id
 * Get a single product by numeric ID.
 * Declared LAST so static segments above are matched first.
 */
router.get('/:id', ProductController.getById);

module.exports = router;