const { loadProducts } = require('../utils/dataLoader');

/**
 * Service layer for Products
 * Contains business logic for product operations
 */

class ProductsService {
  constructor() {
    this.products = [];
    this.loadData();
  }

  /**
   * Load products from JSON file
   */
  loadData() {
    try {
      this.products = loadProducts();
    } catch (error) {
      console.error('Failed to load products:', error);
      this.products = [];
    }
  }

  /**
   * Get all products with filtering and pagination
   * @param {Object} options - Filter and pagination options
   * @returns {Object} - Products and pagination info
   */
  async getAll(options = {}) {
    let filtered = [...this.products];

    // Filter by category
    if (options.category) {
      filtered = filtered.filter((product) =>
        product.category
          .toLowerCase()
          .includes(options.category.toLowerCase())
      );
    }

    // Filter by search term
    if (options.search) {
      const searchTerm = options.search.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.title.toLowerCase().includes(searchTerm) ||
          product.category.toLowerCase().includes(searchTerm)
      );
    }

    // Apply pagination - if no limit specified, return all products
    const { page = 1, limit } = options;
    
    // If no limit provided, return all products
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

  /**
   * Get product by ID
   * @param {number} id - Product ID
   * @returns {Object|null} - Product object or null
   */
  async getById(id) {
    return this.products.find((product) => product.id === id) || null;
  }

  /**
   * Get products by category with pagination
   * @param {string} category - Category name
   * @param {Object} options - Pagination options
   * @returns {Object} - Products and pagination info
   */
  async getByCategory(category, options = {}) {
    return this.getAll({
      ...options,
      category,
    });
  }

  /**
   * Get unique categories
   * @returns {Array} - List of unique categories
   */
  async getCategories() {
    const categories = [...new Set(this.products.map((p) => p.category))];
    return categories.sort();
  }

  /**
   * Get product count
   * @returns {number} - Total number of products
   */
  async getCount() {
    return this.products.length;
  }
}

// Export singleton instance
module.exports = new ProductsService();
