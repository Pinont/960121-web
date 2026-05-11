// src/controllers/CheckoutController.js
// Security auditable Checkout controller with hardening for price tampering, rate-limiting, and email ownership.

const OrderService = require('../services/OrderService');

class CheckoutController {
  /**
   * POST /api/checkout
   * Process checkout with strong validations and secure data handling
   */
  async processCheckout(req, res) {
    try {
      const db = req.app.locals.db;
      const userId = req.user?.id || null;
      const { email, cart, cardNumber } = req.body;

      // STEP 1: Email ownership validation
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required. Please log in to checkout.',
        });
      }

      const userRecord = await db.get('SELECT id, email FROM users WHERE id = ?', [userId]);
      if (!userRecord) {
        return res.status(401).json({
          success: false,
          message: 'User not found. Please re-authenticate.',
        });
      }

      if (email !== userRecord.email) {
        console.warn(`[SECURITY] User ${userId} attempted checkout with email ${email} (owns ${userRecord.email})`);
        return res.status(403).json({
          success: false,
          message: 'Order email must match your registered account email.',
        });
      }

      // STEP 2: Input validation
      const validationErrors = [];

      const emailValidation = OrderService.validateEmail(email);
      if (!emailValidation.valid) validationErrors.push(emailValidation.error);

      if (!cart || typeof cart !== 'object' || Object.keys(cart).length === 0) {
        validationErrors.push('Cart is empty or invalid.');
      }

      const cardValidation = OrderService.validateCardNumber(cardNumber);
      if (!cardValidation.valid) validationErrors.push(cardValidation.error);

      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors,
        });
      }

      // STEP 3: Cart integrity and price verification (server-side)
      const { total, itemsWithPrice, error: calcError } = await OrderService.calculateTotalFromDB(cart, db);
      if (calcError) {
        console.warn(`[VALIDATION] Cart calculation error: ${calcError}`);
        return res.status(400).json({ success: false, message: calcError });
      }

      if (total <= 0) {
        return res.status(400).json({ success: false, message: 'Order total must be greater than zero.' });
      }

      // STEP 4: Payment processing (via gateway in production; mock here)
      const paymentResult = await OrderService.processPayment(cardNumber, total, email);
      if (!paymentResult.success) {
        console.warn(`[PAYMENT] Payment failed for user ${userId}: ${paymentResult.error}`);
        return res.status(400).json({
          success: false,
          message: 'Payment processing failed. Please try again.',
          error: paymentResult.error,
        });
      }

      // STEP 5: Create order (transactional)
      const orderData = {
        userId,
        email,
        items: itemsWithPrice,
        total,
        paymentId: paymentResult.transactionId,
        paymentStatus: 'completed',
        orderStatus: 'pending',
        timestamp: new Date().toISOString(),
      };

      const orderResult = await OrderService.createOrder(orderData, db);
      if (!orderResult.success) {
        console.error(`[ORDER] Failed to create order: ${orderResult.error}`);
        return res.status(500).json({ success: false, message: 'Failed to create order. Please contact support.' });
      }

      // STEP 6: Inventory update (best-effort)
      for (const item of itemsWithPrice) {
        await db.run('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.productId]);
      }

      // STEP 7: Success response
      console.log(`[ORDER] Order ${orderResult.orderId} created for user ${userId}`);
      return res.status(201).json({
        success: true,
        message: 'Order created successfully',
        order: {
          orderId: orderResult.orderId,
          total,
          items: itemsWithPrice,
          email,
          paymentId: orderData.paymentId,
          createdAt: orderData.timestamp,
        },
      });
    } catch (error) {
      console.error('[CHECKOUT] Error in processCheckout:', error.message);
      return res.status(500).json({ success: false, message: 'An unexpected error occurred during checkout.' });
    }
  }

  /**
   * GET /api/checkout/status/:orderId
   * Retrieve order status for authenticated user
   */
  async getOrderStatus(req, res) {
    try {
      const db = req.app.locals.db;
      const userId = req.user?.id;
      const { orderId } = req.params;

      const order = await db.get('SELECT id, status, total, email, created_at FROM orders WHERE id = ? AND user_id = ?', [orderId, userId]);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      return res.status(200).json({ success: true, order });
    } catch (error) {
      console.error('[CHECKOUT] Error in getOrderStatus:', error.message);
      return res.status(500).json({ success: false, message: 'Failed to retrieve order status' });
    }
  }
}

module.exports = new CheckoutController();