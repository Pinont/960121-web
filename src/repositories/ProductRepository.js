/**
 * Product Repository
 * src/repositories/ProductRepository.js
 *
 * FIXED vs original:
 *  - findAll() used SELECT * — explicit column list prevents broken queries
 *    if the schema ever gains a new column (e.g. stock, description).
 *  - insert() was missing the stock column — new rows always got stock = 0
 *    with no way to set it at creation time.
 *  - Added updateStock() — required for checkout to decrement stock after
 *    an order is placed; without it stock is never updated.
 *  - Added update() — admin product editing support.
 *  - Added deleteById() — admin product removal.
 *  - search param in findAll() used LIKE with raw input — wrapped in
 *    parameterized binding (already was, confirmed clean — kept as-is).
 */

const { queryDatabase, getOne, executeDatabase } = require('../db/database');

class ProductRepository {

  /**
   * Get all products with optional WHERE filters and SQL-level pagination.
   * FIXED: Explicit column list instead of SELECT *.
   *
   * @param {object}   db
   * @param {string[]} whereClauses  - e.g. ['category = ?', 'title LIKE ?']
   * @param {Array}    params        - bound values matching whereClauses
   * @param {number}   limit
   * @param {number}   offset
   * @returns {{ rows: Array, total: number }}
   */
  async findAll(db, whereClauses = [], params = [], limit = 10, offset = 0) {
    const where = whereClauses.length > 0
      ? `WHERE ${whereClauses.join(' AND ')}`
      : '';

    // Count query uses the same WHERE so pagination totals are accurate
    const countResult = await queryDatabase(
      db,
      `SELECT COUNT(*) as total FROM products ${where}`,
      params
    );

    // FIXED: Explicit columns — avoids SELECT * ambiguity
    const rows = await queryDatabase(
      db,
      `SELECT id, image, title, price, category, stock, created_at
       FROM products ${where}
       ORDER BY id ASC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return { rows, total: countResult[0].total };
  }

  /**
   * Find a single product by its numeric ID.
   * FIXED: Explicit column list.
   *
   * @param {object} db
   * @param {number} id
   */
  async findById(db, id) {
    return getOne(
      db,
      'SELECT id, image, title, price, category, stock, created_at FROM products WHERE id = ?',
      [id]
    );
  }

  /**
   * Get all distinct category names, ordered alphabetically.
   */
  async findCategories(db) {
    return queryDatabase(
      db,
      'SELECT DISTINCT category FROM products ORDER BY category'
    );
  }

  /**
   * Get the total number of products.
   */
  async countAll(db) {
    const result = await queryDatabase(
      db,
      'SELECT COUNT(*) as total FROM products'
    );
    return result[0].total;
  }

  /**
   * Insert a new product.
   * FIXED: Added stock parameter — original always inserted stock = 0
   * with no way to set it at creation time.
   *
   * @param {object} db
   * @param {object} product - { image, title, price, category, stock? }
   */
  async insert(db, { image, title, price, category, stock = 0 }) {
    return executeDatabase(
      db,
      'INSERT INTO products (image, title, price, category, stock) VALUES (?, ?, ?, ?, ?)',
      [image, title, price, category, stock]
    );
  }

  /**
   * Update an existing product's fields.
   * FIXED: Added — was missing in the original, making admin edits impossible.
   *
   * @param {object} db
   * @param {number} id
   * @param {object} fields - { image?, title?, price?, category?, stock? }
   */
  async update(db, id, fields) {
    const allowed = ['image', 'title', 'price', 'category', 'stock'];
    const updates = [];
    const params  = [];

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        updates.push(`${key} = ?`);
        params.push(fields[key]);
      }
    }

    if (updates.length === 0) return { id: 0, changes: 0 };

    params.push(id); // WHERE id = ?

    return executeDatabase(
      db,
      `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
  }

  /**
   * Decrement stock after a successful order.
   * FIXED: Added — without this, stock is never reduced after purchase.
   * Uses MAX(0, stock - ?) to prevent negative stock values.
   *
   * @param {object} db
   * @param {number} productId
   * @param {number} quantity
   */
  async updateStock(db, productId, quantity) {
    return executeDatabase(
      db,
      'UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?',
      [quantity, productId]
    );
  }

  /**
   * Delete a product by ID.
   * Note: Will fail if order_items rows reference this product (RESTRICT FK).
   *
   * @param {object} db
   * @param {number} id
   */
  async deleteById(db, id) {
    return executeDatabase(
      db,
      'DELETE FROM products WHERE id = ?',
      [id]
    );
  }
}

module.exports = new ProductRepository();