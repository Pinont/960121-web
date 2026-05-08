// repositories/ProductRepository.js
const { queryDatabase, getOne, executeDatabase } = require('../db/database');

class ProductRepository {
  async findAll(db, whereClauses = [], params = [], limit = 10, offset = 0) {
    const where = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const countResult = await queryDatabase(
      db,
      `SELECT COUNT(*) as total FROM products ${where}`,
      params
    );
    const rows = await queryDatabase(
      db,
      `SELECT * FROM products ${where} ORDER BY id ASC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    return { rows, total: countResult[0].total };
  }

  async findById(db, id) {
    return getOne(db, 'SELECT * FROM products WHERE id = ?', [id]);
  }

  async findCategories(db) {
    return queryDatabase(db, 'SELECT DISTINCT category FROM products ORDER BY category');
  }

  async countAll(db) {
    const result = await queryDatabase(db, 'SELECT COUNT(*) as total FROM products');
    return result[0].total;
  }

  async insert(db, { image, title, price, category }) {
    return executeDatabase(
      db,
      'INSERT INTO products (image, title, price, category) VALUES (?, ?, ?, ?)',
      [image, title, price, category]
    );
  }
}

module.exports = new ProductRepository();
