/**
 * Product Service
 * Pure business logic for product operations using SQLite
 */

const { queryDatabase, getOne, executeDatabase } = require('../db/database');

class ProductService {
  /**
   * Get all products with filtering, search, and pagination
   */
  async getAll(options = {}, db) {
    const { category, search, page = 1, limit = 10 } = options;
    
    try {
      let whereClauses = [];
      let params = [];

      // Filter by category
      if (category) {
        whereClauses.push('category = ?');
        params.push(category);
      }

      // Search by title
      if (search) {
        whereClauses.push('title LIKE ?');
        params.push(`%${search}%`);
      }

      // Build WHERE clause
      const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM products ${whereClause}`;
      const countResult = await queryDatabase(db, countQuery, params);
      const totalItems = countResult[0].total;

      // Get paginated results
      const offset = (page - 1) * limit;
      const query = `
        SELECT * FROM products 
        ${whereClause}
        ORDER BY id ASC
        LIMIT ? OFFSET ?
      `;
      const products = await queryDatabase(db, query, [...params, limit, offset]);

      // Calculate pagination info
      const totalPages = Math.ceil(totalItems / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        success: true,
        data: products,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems,
          itemsPerPage: limit,
          hasNextPage,
          hasPrevPage
        }
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
      const product = await getOne(db, 'SELECT * FROM products WHERE id = ?', [id]);
      
      if (!product) {
        return {
          success: false,
          message: 'Product not found',
          data: null
        };
      }

      return {
        success: true,
        data: product
      };
    } catch (error) {
      console.error('Error getting product:', error);
      throw new Error('Failed to get product');
    }
  }

  /**
   * Get products by category
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
      const categories = await queryDatabase(
        db,
        'SELECT DISTINCT category FROM products ORDER BY category'
      );

      return {
        success: true,
        data: categories.map(row => row.category)
      };
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
      const result = await queryDatabase(db, 'SELECT COUNT(*) as total FROM products');
      
      return {
        success: true,
        data: result[0].total
      };
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

      const result = await executeDatabase(
        db,
        'INSERT INTO products (image, title, price, category) VALUES (?, ?, ?, ?)',
        [image, title, price, category]
      );

      return {
        success: true,
        data: { id: result.id, ...productData }
      };
    } catch (error) {
      console.error('Error creating product:', error);
      throw new Error('Failed to create product');
    }
  }
}

module.exports = new ProductService();
