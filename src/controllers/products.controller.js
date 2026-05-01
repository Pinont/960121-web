const productsService = require('../services/products.service');

/**
 * Controller for Products
 * Handles request validation and response formatting
 */

/**
 * GET all products with optional filters and pagination
 */
exports.getAllProducts = async (req, res, next) => {
  try {
    const { category, search, page = 1, limit } = req.query;

    const result = await productsService.getAll({
      category,
      search,
      page: parseInt(page),
      limit: limit ? parseInt(limit) : undefined,
    });

    res.status(200).json({
      success: true,
      data: result.products,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET single product by ID
 */
exports.getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      });
    }

    const product = await productsService.getById(parseInt(id));

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET products by category
 */
exports.getProductsByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    const { page = 1, limit } = req.query;

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category is required',
      });
    }

    const result = await productsService.getByCategory(category, {
      page: parseInt(page),
      limit: limit ? parseInt(limit) : undefined,
    });

    res.status(200).json({
      success: true,
      data: result.products,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};
