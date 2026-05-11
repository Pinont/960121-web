/**
 * Product Controller
 * src/controllers/ProductController.js
 *
 * FIXED vs original:
 *  - Route shadowing: in the original productRoutes.js, /category/:category
 *    was declared AFTER /:id — so GET /api/products/category/electronics
 *    matched /:id with id="category". Fixed by moving static-segment routes
 *    above /:id in productRoutes.js (see that file).
 *  - All handlers use req.app.locals.db.
 *  - getById() validates that :id is a valid integer before querying.
 *  - getAll() clamps limit to max 50 to prevent large data dumps.
 *  - Added getByCategory() handler that was missing in the original controller
 *    (route existed but no matching method was exported).
 */

const ProductService = require('../services/ProductService');

class ProductController {

  /**
   * GET /api/products
   * Query params: category, search, page, limit
   */
  async getAll(req, res) {
    try {
      const db = req.app.locals.db;

      const options = {
        category: req.query.category || null,
        search:   req.query.search   || null,
        page:     Math.max(1, parseInt(req.query.page)  || 1),
        limit:    Math.min(50, parseInt(req.query.limit) || 10), // FIXED: cap at 50
      };

      const result = await ProductService.getAll(options, db);

      return res.status(200).json({
        success: true,
        data:       result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error('Get products error:', error);
      return res.status(500).json({ success: false, message: 'Failed to retrieve products' });
    }
  }

  /**
   * GET /api/products/categories
   * FIXED: Must be registered in productRoutes.js BEFORE /:id
   * to prevent "categories" being treated as an id parameter.
   */
  async getCategories(req, res) {
    try {
      const db     = req.app.locals.db;
      const result = await ProductService.getCategories(db);

      return res.status(200).json({ success: true, data: result.data });
    } catch (error) {
      console.error('Get categories error:', error);
      return res.status(500).json({ success: false, message: 'Failed to retrieve categories' });
    }
  }

  /**
   * GET /api/products/count
   * FIXED: Must be registered in productRoutes.js BEFORE /:id
   * to prevent "count" being treated as an id parameter.
   */
  async getCount(req, res) {
    try {
      const db     = req.app.locals.db;
      const result = await ProductService.getCount(db);

      return res.status(200).json({ success: true, data: result.data });
    } catch (error) {
      console.error('Get product count error:', error);
      return res.status(500).json({ success: false, message: 'Failed to retrieve product count' });
    }
  }

  /**
   * GET /api/products/:id
   * FIXED: Validates :id is a positive integer before querying — the original
   * passed any string directly to the repository, causing confusing SQL errors.
   */
  async getById(req, res) {
    try {
      const db = req.app.locals.db;
      const id = parseInt(req.params.id);

      if (isNaN(id) || id < 1) {
        return res.status(400).json({ success: false, message: 'Invalid product ID' });
      }

      const result = await ProductService.getById(id, db);

      if (!result.success) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      return res.status(200).json({ success: true, data: result.data });
    } catch (error) {
      console.error('Get product by ID error:', error);
      return res.status(500).json({ success: false, message: 'Failed to retrieve product' });
    }
  }

  /**
   * GET /api/products/category/:category
   * FIXED: This handler was missing in the original — the route was declared
   * in productRoutes.js but no matching method existed on the controller,
   * causing a "ProductController.getByCategory is not a function" crash.
   */
  async getByCategory(req, res) {
    try {
      const db       = req.app.locals.db;
      const category = req.params.category;

      if (!category || category.trim() === '') {
        return res.status(400).json({ success: false, message: 'Category is required' });
      }

      const options = {
        page:  Math.max(1, parseInt(req.query.page)  || 1),
        limit: Math.min(50, parseInt(req.query.limit) || 10),
      };

      const result = await ProductService.getByCategory(category, options, db);

      return res.status(200).json({
        success: true,
        data:       result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error('Get by category error:', error);
      return res.status(500).json({ success: false, message: 'Failed to retrieve products' });
    }
  }
}

module.exports = new ProductController();