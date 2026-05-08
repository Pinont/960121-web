/**
 * Order Model
 * Defines the Order data schema
 */

class Order {
  constructor(orderId, email, cardNumberLast4, items, total, status = 'completed', createdAt = null) {
    this.orderId = orderId;
    this.email = email;
    this.cardNumberLast4 = cardNumberLast4;
    this.items = items;
    this.total = total;
    this.status = status;
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Validate order data
   * @returns {Object} { valid: boolean, errors: array }
   */
  static validate(data) {
    const errors = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!data.email || !emailRegex.test(data.email)) {
      errors.push('Valid email is required');
    }

    if (!Array.isArray(data.items) || data.items.length === 0) {
      errors.push('Order must contain items');
    }

    if (!data.total || data.total <= 0) {
      errors.push('Valid total amount is required');
    }

    if (!data.cardNumberLast4) {
      errors.push('Card number last 4 digits required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Convert to JSON response format
   */
  toJSON() {
    return {
      orderId: this.orderId,
      email: this.email,
      cardNumberLast4: this.cardNumberLast4,
      items: this.items,
      total: this.total,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = Order;
