/**
 * Product Controller
 * Handles HTTP requests for product operations
 */

const ProductService = require('../services/ProductService');

class ProductController {
  /**
   * GET /api/products
   * Get all products with filtering, searching, and pagination
   */
  static async getAll(req, res, next) {
    try {
      const { category, search, page = 1, limit = 10 } = req.query;

      const result = await ProductService.getAll({
        category,
        search,
        page: parseInt(page),
        limit: parseInt(limit),
      }, req.db);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products/:id
   * Get a single product by ID
   */
  static async getById(req, res, next) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid product ID',
        });
      }

      const result = await ProductService.getById(id, req.db);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products/category/:category
   * Get products by category
   */
  static async getByCategory(req, res, next) {
    try {
      const { category } = req.params;
      const { page = 1, limit = 10, search } = req.query;

      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Category is required',
        });
      }

      const result = await ProductService.getByCategory(
        category,
        {
          page: parseInt(page),
          limit: parseInt(limit),
          search
        },
        req.db
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products/categories
   * Get all product categories
   */
  static async getCategories(req, res, next) {
    try {
      const result = await ProductService.getCategories(req.db);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products/count
   * Get total product count
   */
  static async getCount(req, res, next) {
    try {
      const result = await ProductService.getCount(req.db);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ProductController;
