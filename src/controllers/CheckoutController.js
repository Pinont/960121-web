/**
 * Checkout Controller
 * src/controllers/CheckoutController.js
 *
 * FIXED vs original:
 *  - Passes req.user.id (from JWT) as userId into OrderService.createOrder()
 *    so the order is relationally linked to the user.
 *  - cardNumber is validated here then explicitly NOT forwarded to the service
 *    layer — card data must never reach the database.
 *  - Uses req.app.locals.db instead of a module-level import.
 *  - Added structured validation response that lists all errors at once
 *    instead of returning on the first failure.
 */

const OrderService = require('../services/OrderService');

class CheckoutController {

  /**
   * POST /api/checkout
   * Requires: Authorization: Bearer <token>  (verifyToken middleware)
   *
   * Expected body:
   * {
   *   "email":      "user@example.com",
   *   "cart":       { "1": { "quantity": 2 }, "3": { "quantity": 1 } },
   *   "cardNumber": "1234567890123456"   ← validated here, never stored
   * }
   */
  async processCheckout(req, res) {
    try {
      const db = req.app.locals.db;

      // FIXED: Extract userId from the JWT payload set by verifyToken middleware.
      // Original had no user_id linkage at all.
      const userId = req.user?.id || null;

      const { email, cart, cardNumber } = req.body;

      // ── Step 1: Collect all validation errors before responding ────────────
      const validationErrors = [];

      const emailValidation = OrderService.validateEmail(email);
      if (!emailValidation.valid) validationErrors.push(emailValidation.error);

      // FIXED: Validate card format here — then cardNumber is intentionally
      // dropped and never passed further into the service or repository layer.
      const cardValidation = OrderService.validateCreditCard(cardNumber);
      if (!cardValidation.valid) validationErrors.push(cardValidation.error);

      if (!cart || typeof cart !== 'object' || Object.keys(cart).length === 0) {
        validationErrors.push('Cart cannot be empty');
      }

      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors,
        });
      }

      // ── Step 2: Validate cart items against the Product service ────────────
      const cartValidation = await OrderService.validateCartItems(cart);
      if (!cartValidation.valid) {
        return res.status(400).json({
          success: false,
          message: 'Cart validation failed',
          errors: cartValidation.errors,
        });
      }

      // ── Step 3: Calculate server-side total ────────────────────────────────
      // Never trust the client's total — always recalculate on the server.
      const { total, itemsWithPrice, error: calcError } = await OrderService.calculateTotal(cart);
      if (calcError) {
        return res.status(400).json({
          success: false,
          message: calcError,
        });
      }

      // ── Step 4: Persist the order ──────────────────────────────────────────
      // FIXED: userId is passed — cardNumber is deliberately NOT passed.
      const result = await OrderService.createOrder(
        {
          email,
          items:  itemsWithPrice,
          total,
          userId,           // FIXED: links order to authenticated user
          // cardNumber intentionally omitted — validated above, never stored
        },
        db
      );

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to create order. Please try again.',
        });
      }

      // ── Step 5: Respond ────────────────────────────────────────────────────
      return res.status(201).json({
        success: true,
        message: 'Order placed successfully',
        data: {
          orderId: result.orderId,
          total,
          items: itemsWithPrice,
        },
      });
    } catch (error) {
      console.error('Checkout error:', error);
      return res.status(500).json({
        success: false,
        message: 'Checkout failed. Please try again.',
      });
    }
  }
}

module.exports = new CheckoutController();