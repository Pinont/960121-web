/**
 * Checkout Service
 * Pure business logic for checkout and order creation.
 * Never writes SQL — delegates all data access to OrderRepository and ProductRepository.
 */
const { v4: uuidv4 } = require('uuid');
const OrderRepository = require('../repositories/OrderRepository');
const ProductRepository = require('../repositories/ProductRepository');

class CheckoutService {
  /**
   * Validate cart items against the database
   */
  async validateCartItems(cart, db) {
    const errors = [];

    if (!cart || typeof cart !== 'object' || Object.keys(cart).length === 0) {
      errors.push('Cart is empty');
      return { valid: false, errors };
    }

    for (const [productId, item] of Object.entries(cart)) {
      if (!item.quantity || typeof item.quantity !== 'number' || item.quantity < 1) {
        errors.push(`Invalid quantity for product ${productId}`);
      }

      const product = await ProductRepository.findById(db, productId);
      if (!product) {
        errors.push(`Product ${productId} not found`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate email format
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
   * Validate credit card (16 digits)
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
   * Calculate total price from cart
   */
  async calculateTotal(cart, db) {
    try {
      let total = 0;
      const itemsWithPrice = [];

      for (const [productId, item] of Object.entries(cart)) {
        const product = await ProductRepository.findById(db, productId);

        if (!product) {
          return {
            total: 0,
            itemsWithPrice: [],
            error: `Product ${productId} not found`,
          };
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
   * Create a new order
   */
  async createOrder(orderData, db) {
    try {
      const orderId = uuidv4();
      const timestamp = new Date().toISOString();

      await OrderRepository.insert(db, {
        id: orderId,
        email: orderData.email,
        items: orderData.items,
        total: orderData.total,
        status: 'completed',
        created_at: timestamp,
      });

      return { success: true, orderId, error: null };
    } catch (error) {
      console.error('Error creating order:', error);
      return { success: false, orderId: null, error: error.message };
    }
  }

  /**
   * Get all orders (optionally filtered by email)
   */
  async getAllOrders(db, email = null) {
    try {
      const orders = await OrderRepository.findAll(db, email);

      return {
        success: true,
        data: orders.map(order => ({
          ...order,
          items: JSON.parse(order.items),
        })),
      };
    } catch (error) {
      console.error('Error getting orders:', error);
      return { success: false, data: [], error: error.message };
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId, db) {
    try {
      const order = await OrderRepository.findById(db, orderId);

      if (!order) {
        return { success: false, data: null, message: 'Order not found' };
      }

      return {
        success: true,
        data: { ...order, items: JSON.parse(order.items) },
      };
    } catch (error) {
      console.error('Error getting order:', error);
      return { success: false, data: null, error: error.message };
    }
  }
}

module.exports = new CheckoutService();
