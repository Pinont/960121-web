/**
 * Checkout Controller
 * Handles HTTP requests for checkout operations
 */

const CheckoutService = require('../services/OrderService');

class CheckoutController {
  /**
   * POST /api/checkout
   * Process checkout: validate cart and payment, create order
   */
  static async processCheckout(req, res, next) {
    try {
      const { cart, email, cardNumber } = req.body;
      const fieldErrors = {};

      // Validate cart
      const cartValidation = await CheckoutService.validateCartItems(cart, req.db);
      if (!cartValidation.valid) {
        fieldErrors.cart = cartValidation.errors;
      }

      // Validate email
      const emailValidation = CheckoutService.validateEmail(email);
      if (!emailValidation.valid) {
        fieldErrors.email = emailValidation.error;
      }

      // Validate credit card
      const cardValidation = CheckoutService.validateCreditCard(cardNumber);
      if (!cardValidation.valid) {
        fieldErrors.cardNumber = cardValidation.error;
      }

      // Return validation errors if any
      if (Object.keys(fieldErrors).length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed. Please check the errors below.',
          errors: fieldErrors,
        });
      }

      // Calculate total
      const totalResult = await CheckoutService.calculateTotal(cart, req.db);
      if (totalResult.error) {
        return res.status(400).json({
          success: false,
          message: 'Failed to calculate cart total',
          errors: { cart: totalResult.error },
        });
      }

      // Create order
      const orderResult = await CheckoutService.createOrder({
        email,
        cardNumber,
        items: totalResult.itemsWithPrice,
        total: totalResult.total,
      }, req.db);

      if (!orderResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Failed to save order. Please try again.',
          errors: { order: orderResult.error },
        });
      }

      // Return success
      return res.status(201).json({
        success: true,
        message: 'Order created successfully!',
        data: {
          orderId: orderResult.orderId,
          email,
          total: totalResult.total,
          itemCount: Object.keys(cart).length,
          items: totalResult.itemsWithPrice,
        },
      });
    } catch (error) {
      console.error('Checkout error:', error);
      next(error);
    }
  }
}

module.exports = CheckoutController;
