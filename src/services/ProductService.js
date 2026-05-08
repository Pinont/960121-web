/**
 * Product Service
 * Pure business logic for product operations.
 * Never writes SQL — delegates all data access to ProductRepository.
 */
const ProductRepository = require('../repositories/ProductRepository');

class ProductService {
  /**
   * Get all products with filtering, search, and pagination
   */
  async getAll(options = {}, db) {
    const { category, search, page = 1, limit = 10 } = options;

    try {
      const whereClauses = [];
      const params = [];

      if (category) {
        whereClauses.push('category = ?');
        params.push(category);
      }

      if (search) {
        whereClauses.push('title LIKE ?');
        params.push(`%${search}%`);
      }

      const offset = (page - 1) * limit;
      const { rows: products, total: totalItems } =
        await ProductRepository.findAll(db, whereClauses, params, limit, offset);

      const totalPages = Math.ceil(totalItems / limit);

      return {
        success: true,
        data: products,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      console.error('Error getting products:', error);
      throw new Error('Failed to get products');
    }
  }

  /**
   * Get single product by ID
   */
  async getById(id, db) {
    try {
      const product = await ProductRepository.findById(db, id);

      if (!product) {
        return { success: false, message: 'Product not found', data: null };
      }

      return { success: true, data: product };
    } catch (error) {
      console.error('Error getting product:', error);
      throw new Error('Failed to get product');
    }
  }

  /**
   * Get products by category (delegates to getAll)
   */
  async getByCategory(category, options = {}, db) {
    const { page = 1, limit = 10, search } = options;
    return this.getAll({ category, search, page, limit }, db);
  }

  /**
   * Get all unique categories
   */
  async getCategories(db) {
    try {
      const categories = await ProductRepository.findCategories(db);
      return { success: true, data: categories.map(row => row.category) };
    } catch (error) {
      console.error('Error getting categories:', error);
      throw new Error('Failed to get categories');
    }
  }

  /**
   * Get product count
   */
  async getCount(db) {
    try {
      const total = await ProductRepository.countAll(db);
      return { success: true, data: total };
    } catch (error) {
      console.error('Error getting product count:', error);
      throw new Error('Failed to get product count');
    }
  }

  /**
   * Create new product
   */
  async create(productData, db) {
    try {
      const { image, title, price, category } = productData;

      if (!image || !title || !price || !category) {
        throw new Error('Missing required fields: image, title, price, category');
      }

      const result = await ProductRepository.insert(db, productData);
      return { success: true, data: { id: result.id, ...productData } };
    } catch (error) {
      console.error('Error creating product:', error);
      throw new Error('Failed to create product');
    }
  }
}

module.exports = new ProductService();
