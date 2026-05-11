// src/services/OrderService.js
const crypto = require('crypto');

class OrderService {
  /**
   * SECURITY FIX #1: Calculate order total from database
   * Never trust client-provided prices
   */
  static async calculateTotalFromDB(cart, db) {
    try {
      const itemsWithPrice = [];
      let total = 0;

      if (!cart || typeof cart !== 'object') {
        return { total: null, itemsWithPrice: null, error: 'Invalid cart structure' };
      }

      const cartEntries = Object.entries(cart);
      if (cartEntries.length === 0) {
        return { total: null, itemsWithPrice: null, error: 'Cart is empty' };
      }

      for (const [productId, itemData] of cartEntries) {
        if (!/^\d+$/.test(productId)) {
          return { total: null, itemsWithPrice: null, error: `Invalid product ID format: ${productId}` };
        }

        const { quantity } = itemData;
        if (!Number.isInteger(quantity) || quantity <= 0) {
          return { total: null, itemsWithPrice: null, error: `Invalid quantity for product ${productId}.` };
        }

        const product = await db.get('SELECT id, name, price, stock FROM products WHERE id = ?', [productId]);
        if (!product) {
          return { total: null, itemsWithPrice: null, error: `Product ${productId} not found in catalog` };
        }

        if (quantity > product.stock) {
          return { total: null, itemsWithPrice: null, error: `Insufficient stock for ${product.name}.` };
        }

        if (typeof product.price !== 'number' || product.price < 0) {
          return { total: null, itemsWithPrice: null, error: `Invalid price for product ${product.id}` };
        }

        const itemTotal = parseFloat((product.price * quantity).toFixed(2));
        itemsWithPrice.push({
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity,
          itemTotal
        });

        total += itemTotal;
      }

      total = parseFloat(total.toFixed(2));
      return { total, itemsWithPrice, error: null };
    } catch (error) {
      console.error('[OrderService] Error in calculateTotalFromDB:', error);
      return { total: null, itemsWithPrice: null, error: `Failed to calculate cart total: ${error.message}` };
    }
  }

  /**
   * Validate that all cart items exist in catalog
   */
  static async validateCartItems(cart, db) {
    try {
      const validationErrors = [];
      for (const productId of Object.keys(cart)) {
        const product = await db.get('SELECT id FROM products WHERE id = ?', [productId]);
        if (!product) validationErrors.push(`Product ${productId} does not exist`);
      }
      return { valid: validationErrors.length === 0, errors: validationErrors };
    } catch (error) {
      return { valid: false, errors: [error.message] };
    }
  }

  /**
   * Validate that provided email belongs to the authenticated user (ownership)
   * This function can be expanded to support multiple emails per user if required
   */
  static validateEmailOwnership(userEmail, providedEmail) {
    return { valid: userEmail === providedEmail, error: userEmail === providedEmail ? null : 'Provided email does not match account email' };
  }

  /**
   * Validate email format
   */
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string') {
      return { valid: false, error: 'Email is required and must be a string' };
    }
    if (!emailRegex.test(email)) {
      return { valid: false, error: 'Invalid email format' };
    }
    if (email.length > 254) {
      return { valid: false, error: 'Email is too long (max 254 characters)' };
    }
    return { valid: true, error: null };
  }

  /**
   * Validate card number (basic format)
   * IMPORTANT: In production, use a PCI-compliant gateway (Stripe/Adyen/etc.)
   * and NEVER store raw card numbers
   */
  static validateCardNumber(cardNumber) {
    const clean = (cardNumber || '').replace(/[\s-]/g, '');
    if (!/^\d{13,19}$/.test(clean)) {
      return { valid: false, error: 'Invalid card number format. 13-19 digits required.' };
    }
    if (!this.luhnCheck(clean)) {
      return { valid: false, error: 'Invalid card number (failed Luhn check)' };
    }
    return { valid: true, error: null };
  }

  static luhnCheck(num) {
    let sum = 0;
    let shouldDouble = false;
    for (let i = num.length - 1; i >= 0; i--) {
      let digit = parseInt(num.charAt(i), 10);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  }

  /**
   * Mock payment processing
   * Replace with real gateway integration in production
   */
  static async processPayment(cardNumber, amount, email) {
    try {
      // Basic format check again
      const cardValidation = this.validateCardNumber(cardNumber);
      if (!cardValidation.valid) {
        return { success: false, error: cardValidation.error, transactionId: null };
      }

      // Mock gateway delay
      await new Promise((r) => setTimeout(r, 100));

      // Simple deterministic mock: fail 5% of the time
      if (Math.random() < 0.05) {
        return { success: false, error: 'Payment declined by gateway', transactionId: null };
      }

      const transactionId = `TXN-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
      return { success: true, transactionId, amount, email, timestamp: new Date().toISOString() };
    } catch (error) {
      console.error('[OrderService] Payment error:', error);
      return { success: false, error: 'Payment processing error', transactionId: null };
    }
  }

  /**
   * Persist the order (and items) to DB
   */
  static async createOrder(orderData, db) {
    try {
      const { email, items, total, userId, paymentId, paymentStatus, orderStatus } = orderData;

      const result = await db.run(
        `INSERT INTO orders (user_id, email, total, payment_id, payment_status, order_status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, email, total, paymentId, paymentStatus, orderStatus, new Date().toISOString(), new Date().toISOString()]
      );

      const orderId = result?.lastID;

      if (!orderId) {
        return { success: false, orderId: null, error: 'Failed to insert order' };
      }

      // Insert order items
      for (const item of items) {
        await db.run(
          `INSERT INTO order_items (order_id, product_id, product_name, quantity, price, item_total)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [orderId, item.productId, item.name, item.quantity, item.price, item.itemTotal]
        );
      }

      return { success: true, orderId, error: null };
    } catch (error) {
      console.error('[OrderService] Error in createOrder:', error);
      return { success: false, orderId: null, error: error.message };
    }
  }

  /**
   * Get order by ID for a specific user
   */
  static async getOrderById(orderId, userId, db) {
    try {
      const order = await db.get('SELECT * FROM orders WHERE id = ? AND user_id = ?', [orderId, userId]);
      if (!order) {
        return { success: false, order: null, error: 'Order not found' };
      }

      const items = await db.all('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
      return { success: true, order: { ...order, items }, error: null };
    } catch (error) {
      console.error('[OrderService] Error in getOrderById:', error);
      return { success: false, order: null, error: error.message };
    }
  }
}

module.exports = OrderService;