/**
 * Order Repository
 * src/repositories/OrderRepository.js
 *
 * FIXED vs original:
 *  - insert() now writes to both orders AND order_items tables inside a
 *    single transaction — replaces the JSON blob storage in items TEXT column.
 *  - Added user_id column support so orders are relationally linked to users.
 *  - findAll() now accepts pagination (limit/offset) instead of returning ALL rows.
 *  - findAll() now JOINs order_items so each order carries its line-items.
 *  - findById() also returns joined order_items.
 *  - Added findByUserId() — ownership-safe lookup used by OrdersController.
 *  - Added updateStatus() — allows order lifecycle management (pending → completed).
 */

const { executeDatabase, queryDatabase, getOne } = require('../db/database');

class OrderRepository {

  /**
   * Insert a new order with its line-items in a single transaction.
   * FIXED: Replaces single INSERT with a transaction that writes to both
   * orders and order_items — no more JSON blob in a TEXT column.
   *
   * @param {object} db
   * @param {object} orderData - { id, user_id, email, items, total, status, created_at }
   *   items = [{ id, title, price, quantity, subtotal }]
   */
  async insert(db, { id, user_id, email, items, total, status, created_at }) {
    // Use a serialized transaction via db.serialize + BEGIN/COMMIT
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION', (err) => {
          if (err) return reject(err);
        });

        db.run(
          `INSERT INTO orders (id, user_id, email, total, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [id, user_id || null, email, total, status, created_at],
          (err) => {
            if (err) {
              db.run('ROLLBACK');
              return reject(err);
            }
          }
        );

        // Insert each line-item into order_items
        const stmt = db.prepare(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
           VALUES (?, ?, ?, ?)`
        );

        for (const item of items) {
          stmt.run([id, item.id, item.quantity, item.price], (err) => {
            if (err) {
              db.run('ROLLBACK');
              stmt.finalize();
              return reject(err);
            }
          });
        }

        stmt.finalize((err) => {
          if (err) {
            db.run('ROLLBACK');
            return reject(err);
          }

          db.run('COMMIT', (commitErr) => {
            if (commitErr) {
              db.run('ROLLBACK');
              return reject(commitErr);
            }
            resolve({ id, changes: items.length + 1 });
          });
        });
      });
    });
  }

  /**
   * Get all orders with their line-items.
   * FIXED: Added LIMIT/OFFSET pagination — original fetched every row then
   * sliced in JavaScript, which is a full table scan on every request.
   *
   * @param {object} db
   * @param {string|null} email      - Optional filter by email
   * @param {number}      limit      - Rows per page (default 20)
   * @param {number}      offset     - Skip N rows (default 0)
   */
  async findAll(db, email = null, limit = 20, offset = 0) {
    const where  = email ? 'WHERE o.email = ?' : '';
    const params = email ? [email, limit, offset] : [limit, offset];

    const orders = await queryDatabase(
      db,
      `SELECT o.id, o.user_id, o.email, o.total, o.status, o.created_at
       FROM orders o
       ${where}
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      params
    );

    // Attach line-items to each order
    for (const order of orders) {
      order.items = await queryDatabase(
        db,
        `SELECT oi.id, oi.product_id, oi.quantity, oi.unit_price,
                p.title, p.image
         FROM order_items oi
         LEFT JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [order.id]
      );
    }

    return orders;
  }

  /**
   * Get all orders belonging to a specific user_id.
   * FIXED: Uses user_id FK instead of email for a proper relational lookup.
   *
   * @param {object} db
   * @param {string} userId
   * @param {number} limit
   * @param {number} offset
   */
  async findByUserId(db, userId, limit = 20, offset = 0) {
    const orders = await queryDatabase(
      db,
      `SELECT id, user_id, email, total, status, created_at
       FROM orders
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    for (const order of orders) {
      order.items = await queryDatabase(
        db,
        `SELECT oi.id, oi.product_id, oi.quantity, oi.unit_price,
                p.title, p.image
         FROM order_items oi
         LEFT JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [order.id]
      );
    }

    return orders;
  }

  /**
   * Get a single order by ID, including its line-items.
   *
   * @param {object} db
   * @param {string} orderId
   */
  async findById(db, orderId) {
    const order = await getOne(
      db,
      `SELECT id, user_id, email, total, status, created_at
       FROM orders WHERE id = ?`,
      [orderId]
    );

    if (!order) return null;

    order.items = await queryDatabase(
      db,
      `SELECT oi.id, oi.product_id, oi.quantity, oi.unit_price,
              p.title, p.image
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [orderId]
    );

    return order;
  }

  /**
   * Update the status of an order (pending → completed → refunded).
   *
   * @param {object} db
   * @param {string} orderId
   * @param {string} status
   */
  async updateStatus(db, orderId, status) {
    return executeDatabase(
      db,
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, orderId]
    );
  }
}

module.exports = new OrderRepository();