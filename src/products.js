/**
 * CONSOLIDATED PRODUCTS SERVICE
 * Routes + Controller + Service + Utilities in one file
 * Handles all product operations: fetching, filtering, searching, pagination
 */

const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// ============================================================================
// UTILITIES - Data Loading
// ============================================================================

function loadProducts() {
  try {
    const dataPath = path.join(__dirname, '../data/products.json');
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const products = JSON.parse(rawData);

    if (!Array.isArray(products)) {
      throw new Error('Products data must be an array');
    }

    return products;
  } catch (error) {
    console.error('Error loading products:', error.message);
    throw new Error(`Failed to load products data: ${error.message}`);
  }
}

function saveProducts(products) {
  try {
    const dataPath = path.join(__dirname, '../data/products.json');
    fs.writeFileSync(dataPath, JSON.stringify(products, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error saving products:', error.message);
    throw new Error(`Failed to save products data: ${error.message}`);
  }
}

// ============================================================================
// SERVICE - Business Logic (ProductsService Class)
// ============================================================================

class ProductsService {
  constructor() {
    this.products = [];
    this.loadData();
  }

  loadData() {
    try {
      this.products = loadProducts();
    } catch (error) {
      console.error('Failed to load products:', error);
      this.products = [];
    }
  }

  async getAll(options = {}) {
    let filtered = [...this.products];

    if (options.category) {
      filtered = filtered.filter((product) =>
        product.category
          .toLowerCase()
          .includes(options.category.toLowerCase())
      );
    }

    if (options.search) {
      const searchTerm = options.search.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.title.toLowerCase().includes(searchTerm) ||
          product.category.toLowerCase().includes(searchTerm)
      );
    }

    const { page = 1, limit } = options;

    if (!limit) {
      return {
        products: filtered,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: filtered.length,
          itemsPerPage: filtered.length,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = filtered.slice(startIndex, endIndex);

    return {
      products: paginatedProducts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(filtered.length / limit),
        totalItems: filtered.length,
        itemsPerPage: limit,
        hasNextPage: endIndex < filtered.length,
        hasPrevPage: page > 1,
      },
    };
  }

  async getById(id) {
    return this.products.find((product) => product.id === id) || null;
  }

  async getByCategory(category, options = {}) {
    return this.getAll({
      ...options,
      category,
    });
  }

  async getCategories() {
    const categories = [...new Set(this.products.map((p) => p.category))];
    return categories.sort();
  }

  async getCount() {
    return this.products.length;
  }
}

// Singleton instance
const productsService = new ProductsService();

// ============================================================================
// CONTROLLER - Request Handlers
// ============================================================================

async function getAllProductsHandler(req, res, next) {
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
}

async function getProductByIdHandler(req, res, next) {
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
}

async function getProductsByCategoryHandler(req, res, next) {
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
}

// ============================================================================
// ROUTES
// ============================================================================

/**
 * GET /api/products
 * Get all products with optional filtering, searching, and pagination
 * Query params: category, search, page, limit
 */
router.get('/', getAllProductsHandler);

/**
 * GET /api/products/:id
 * Get a single product by ID
 */
router.get('/:id', getProductByIdHandler);

/**
 * GET /api/products/category/:category
 * Get products by category with pagination
 */
router.get('/category/:category', getProductsByCategoryHandler);

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = router;
