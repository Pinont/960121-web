/**
 * Product Model
 * Defines the Product data schema
 */

class Product {
  constructor(id, image, title, price, category) {
    this.id = id;
    this.image = image;
    this.title = title;
    this.price = price;
    this.category = category;
  }

  /**
   * Validate product data
   * @returns {Object} { valid: boolean, errors: array }
   */
  static validate(data) {
    const errors = [];

    if (!data.id) errors.push('Product ID is required');
    if (!data.title) errors.push('Product title is required');
    if (!data.price || isNaN(data.price)) errors.push('Valid price is required');
    if (!data.category) errors.push('Product category is required');
    if (!data.image) errors.push('Product image path is required');

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
      id: this.id,
      image: this.image,
      title: this.title,
      price: this.price,
      category: this.category,
    };
  }
}

module.exports = Product;
