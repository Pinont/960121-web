// repositories/OrderRepository.js
const { executeDatabase, queryDatabase, getOne } = require('../db/database');

class OrderRepository {
  async insert(db, { id, email, items, total, status, created_at }) {
    return executeDatabase(
      db,
      `INSERT INTO orders (id, email, items, total, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, email, JSON.stringify(items), total, status, created_at]
    );
  }

  async findAll(db, email = null) {
    const query = email
      ? 'SELECT * FROM orders WHERE email = ? ORDER BY created_at DESC'
      : 'SELECT * FROM orders ORDER BY created_at DESC';
    const params = email ? [email] : [];
    return queryDatabase(db, query, params);
  }

  async findById(db, orderId) {
    return getOne(db, 'SELECT * FROM orders WHERE id = ?', [orderId]);
  }
}

module.exports = new OrderRepository();
