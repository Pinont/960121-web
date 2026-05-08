/**
 * Orders Controller
 * Handles HTTP requests for order management
 */

const CheckoutService = require('../services/OrderService');

class OrdersController {
  /**
   * GET /api/orders
   * Get all orders with optional filtering and pagination
   */
  static async getAll(req, res, next) {
    try {
      const { email, page = 1, limit = 10 } = req.query;

      const result = await CheckoutService.getAllOrders(req.db, email);

      if (!result.success) {
        return res.status(500).json(result);
      }

      // Apply pagination
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const paginatedOrders = result.data.slice(startIndex, endIndex);

      res.status(200).json({
        success: true,
        data: paginatedOrders,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(result.data.length / limitNum),
          totalItems: result.data.length,
          itemsPerPage: limitNum,
          hasNextPage: endIndex < result.data.length,
          hasPrevPage: pageNum > 1,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/orders/:orderId
   * Get a single order by ID
   */
  static async getById(req, res, next) {
    try {
      const { orderId } = req.params;

      if (!orderId) {
        return res.status(400).json({
          success: false,
          message: 'Order ID is required',
        });
      }

      const result = await CheckoutService.getOrderById(orderId, req.db);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/orders/user/:email
   * Get orders for a specific user by email
   */
  static async getByEmail(req, res, next) {
    try {
      const { email } = req.params;
      const { page = 1, limit = 10 } = req.query;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required',
        });
      }

      const result = await CheckoutService.getAllOrders(req.db, email);

      if (!result.success) {
        return res.status(500).json(result);
      }

      // Apply pagination
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const paginatedOrders = result.data.slice(startIndex, endIndex);

      res.status(200).json({
        success: true,
        data: paginatedOrders,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(result.data.length / limitNum),
          totalItems: result.data.length,
          itemsPerPage: limitNum,
          hasNextPage: endIndex < result.data.length,
          hasPrevPage: pageNum > 1,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = OrdersController;
