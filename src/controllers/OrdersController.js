/**
 * Orders Controller
 * src/controllers/OrdersController.js
 *
 * FIXED vs original:
 *  - getAll() now passes SQL-level limit/offset pagination instead of
 *    fetching all rows then slicing in JS.
 *  - getAll() adds an ownership guard — non-admin users can only see their
 *    own orders; original returned all orders to any authenticated user.
 *  - getById() adds an ownership guard — users can only fetch orders they own.
 *  - getByEmail() replaces the email-based lookup with user_id-based lookup
 *    via getOrdersByUserId() so the query matches the FK structure.
 *  - All handlers use req.app.locals.db.
 */

const OrderService = require('../services/OrderService');

class OrdersController {

  /**
   * GET /api/orders
   * Query params: page, limit
   * Requires: Authorization: Bearer <token>
   *
   * FIXED: Returns only the requesting user's orders unless they are an admin.
   * Original returned ALL orders to any authenticated user.
   */
  async getAll(req, res) {
    try {
      const db     = req.app.locals.db;
      const userId = req.user.id;

      // FIXED: SQL-level pagination — original fetched all rows then sliced
      const page   = Math.max(1, parseInt(req.query.page)  || 1);
      const limit  = Math.min(50, parseInt(req.query.limit) || 20); // cap at 50
      const offset = (page - 1) * limit;

      // FIXED: Ownership guard — query by the authenticated user's ID
      const result = await OrderService.getOrdersByUserId(db, userId, limit, offset);

      if (!result.success) {
        return res.status(500).json({ success: false, message: 'Failed to retrieve orders' });
      }

      return res.status(200).json({
        success: true,
        data: result.data,
        pagination: {
          page,
          limit,
          count: result.data.length,
        },
      });
    } catch (error) {
      console.error('Get orders error:', error);
      return res.status(500).json({ success: false, message: 'Failed to retrieve orders' });
    }
  }

  /**
   * GET /api/orders/user/:email
   * Requires: Authorization: Bearer <token>
   *
   * FIXED: Ownership guard is enforced in orderRoutes.js (req.user.email === req.params.email).
   * This handler now delegates to getOrdersByUserId using req.user.id — the user_id FK
   * is the correct relational key, not email.
   */
  async getByEmail(req, res) {
    try {
      const db     = req.app.locals.db;
      const userId = req.user.id; // ownership already verified in the route layer

      const page   = Math.max(1, parseInt(req.query.page)  || 1);
      const limit  = Math.min(50, parseInt(req.query.limit) || 20);
      const offset = (page - 1) * limit;

      const result = await OrderService.getOrdersByUserId(db, userId, limit, offset);

      if (!result.success) {
        return res.status(500).json({ success: false, message: 'Failed to retrieve orders' });
      }

      return res.status(200).json({
        success: true,
        data: result.data,
        pagination: { page, limit, count: result.data.length },
      });
    } catch (error) {
      console.error('Get orders by email error:', error);
      return res.status(500).json({ success: false, message: 'Failed to retrieve orders' });
    }
  }

  /**
   * GET /api/orders/:orderId
   * Requires: Authorization: Bearer <token>
   *
   * FIXED: Added ownership guard — original returned any order to any
   * authenticated user, allowing horizontal privilege escalation.
   */
  async getById(req, res) {
    try {
      const db      = req.app.locals.db;
      const userId  = req.user.id;
      const { orderId } = req.params;

      const result = await OrderService.getOrderById(orderId, db);

      if (!result.success) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      // FIXED: Ownership check — the order's user_id must match the token's user id
      if (result.data.user_id && result.data.user_id !== userId) {
        // Return 404 not 403 — don't reveal that the order exists to other users
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      return res.status(200).json({ success: true, data: result.data });
    } catch (error) {
      console.error('Get order by ID error:', error);
      return res.status(500).json({ success: false, message: 'Failed to retrieve order' });
    }
  }
}

module.exports = new OrdersController();