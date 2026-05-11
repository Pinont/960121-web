/**
 * Order Service
 * src/services/OrderService.js
 *
 * FIXED vs original:
 *  - createOrder() now passes user_id from the JWT token into the repository
 *    so orders are properly linked to users (original only stored email).
 *  - createOrder() strips cardNumber before persisting — card data must NEVER
 *    be stored. Original passed raw orderData including cardNumber to the repo.
 *  - getAllOrders() passes limit/offset for SQL-level pagination instead of
 *    fetching all rows and slicing in JS.
 *  - Removed JSON.parse(order.items) calls — items are now proper relational
 *    rows returned by OrderRepository, not a serialized JSON blob.
 *  - PRODUCT_SERVICE_URL fallback is kept but clearly marked non-sensitive.
 *  - createOrder() now decrements stock for each purchased item via
 *    ProductRepository.updateStock() — original never reduced stock after purchase.
 */

const { v4: uuidv4 } = require('uuid');
const OrderRepository   = require('../repositories/OrderRepository');
const ProductRepository = require('../repositories/ProductRepository');

// Non-sensitive default — no || fallback security risk here
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3001';

// ── Internal helper ───────────────────────────────────────────────────────────
async function fetchProductById(productId) {
  try {
    const response = await fetch(`${PRODUCT_SERVICE_URL}/api/products/${productId}`);
    if (!response.ok) return null;
    const json = await response.json();
    return json.data || null;
  } catch (error) {
    console.error(`Failed to fetch product ${productId}:`, error.message);
    return null;
  }
}

class OrderService {

  /**
   * Validate all cart items against the Product microservice.
   */
  async validateCartItems(cart) {
    const errors = [];

    if (!cart || typeof cart !== 'object' || Object.keys(cart).length === 0) {
      errors.push('Cart is empty');
      return { valid: false, errors };
    }

    for (const [productId, item] of Object.entries(cart)) {
      if (!item.quantity || typeof item.quantity !== 'number' || item.quantity < 1) {
        errors.push(`Invalid quantity for product ${productId}`);
      }

      const product = await fetchProductById(productId);
      if (!product) {
        errors.push(`Product ${productId} not found`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate email format.
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string') {
      return { valid: false, error: 'Email is required' };
    }
    if (!emailRegex.test(email)) {
      return { valid: false, error: 'Invalid email format' };
    }
    return { valid: true, error: null };
  }

  /**
   * Validate credit card format (16 digits).
   * NOTE: We validate the format but never store the number — see createOrder().
   */
  validateCreditCard(cardNumber) {
    const cardRegex = /^[0-9]{16}$/;
    if (!cardNumber || typeof cardNumber !== 'string') {
      return { valid: false, error: 'Credit card number is required' };
    }
    const sanitized = cardNumber.replace(/[\s-]/g, '');
    if (!cardRegex.test(sanitized)) {
      return { valid: false, error: 'Credit card must be 16 digits' };
    }
    return { valid: true, error: null };
  }

  /**
   * Calculate total price by fetching live prices from the Product service.
   */
  async calculateTotal(cart) {
    try {
      let total = 0;
      const itemsWithPrice = [];

      for (const [productId, item] of Object.entries(cart)) {
        const product = await fetchProductById(productId);
        if (!product) {
          return { total: 0, itemsWithPrice: [], error: `Product ${productId} not found` };
        }

        const itemTotal = product.price * item.quantity;
        total += itemTotal;
        itemsWithPrice.push({
          id: product.id,
          title: product.title,
          price: product.price,
          quantity: item.quantity,
          subtotal: itemTotal,
        });
      }

      return { total, itemsWithPrice, error: null };
    } catch (error) {
      return { total: 0, itemsWithPrice: [], error: error.message };
    }
  }

  /**
   * Create a new order.
   *
   * FIXED: Two critical changes from the original:
   *  1. user_id is now extracted from the validated JWT token (req.user.id)
   *     and stored on the order so it is relationally linked to the users table.
   *  2. cardNumber is explicitly excluded before persisting — card data must
   *     NEVER be stored. The original passed the full orderData object (which
   *     contained cardNumber) directly into OrderRepository.insert().
   *
   * @param {object} orderData - { email, cart, total, items, userId }
   * @param {object} db
   */
  async createOrder(orderData, db) {
    try {
      const orderId   = uuidv4();
      const timestamp = new Date().toISOString();

      // FIXED: Destructure explicitly — cardNumber is intentionally omitted
      const { email, items, total, userId } = orderData;

      await OrderRepository.insert(db, {
        id:         orderId,
        user_id:    userId || null,   // FIXED: link order to the authenticated user
        email:      email,
        items:      items,            // array of { id, title, price, quantity, subtotal }
        total:      total,
        status:     'completed',
        created_at: timestamp,
        // cardNumber is deliberately NOT included here
      });

      // FIXED: Decrement stock for each purchased item.
      // Original never called updateStock — inventory was never reduced after purchase.
      for (const item of items) {
        await ProductRepository.updateStock(db, item.id, item.quantity);
      }

      return { success: true, orderId, error: null };
    } catch (error) {
      console.error('Error creating order:', error);
      return { success: false, orderId: null, error: error.message };
    }
  }

  /**
   * Get all orders, optionally filtered by email, with SQL-level pagination.
   * FIXED: Passes limit/offset to the repository instead of slicing in JS.
   *
   * @param {object} db
   * @param {string|null} email
   * @param {number} limit
   * @param {number} offset
   */
  async getAllOrders(db, email = null, limit = 20, offset = 0) {
    try {
      // FIXED: items are now relational rows — no JSON.parse() needed
      const orders = await OrderRepository.findAll(db, email, limit, offset);
      return { success: true, data: orders };
    } catch (error) {
      console.error('Error getting orders:', error);
      return { success: false, data: [], error: error.message };
    }
  }

  /**
   * Get orders by user ID (ownership-safe).
   * FIXED: Uses user_id FK lookup instead of email.
   */
  async getOrdersByUserId(db, userId, limit = 20, offset = 0) {
    try {
      const orders = await OrderRepository.findByUserId(db, userId, limit, offset);
      return { success: true, data: orders };
    } catch (error) {
      console.error('Error getting orders by user:', error);
      return { success: false, data: [], error: error.message };
    }
  }

  /**
   * Get a single order by ID.
   * FIXED: items are relational rows — no JSON.parse() needed.
   */
  async getOrderById(orderId, db) {
    try {
      const order = await OrderRepository.findById(db, orderId);
      if (!order) {
        return { success: false, data: null, message: 'Order not found' };
      }
      return { success: true, data: order };
    } catch (error) {
      console.error('Error getting order:', error);
      return { success: false, data: null, error: error.message };
    }
  }
}

module.exports = new OrderService();