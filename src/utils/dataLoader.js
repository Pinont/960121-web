const fs = require('fs');
const path = require('path');

/**
 * Load products from JSON file
 * @returns {Array} - Array of product objects
 */
function loadProducts() {
  try {
    const dataPath = path.join(__dirname, '../../data/products.json');
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const products = JSON.parse(rawData);

    if (!Array.isArray(products)) {
      throw new Error('Products data must be an array');
    }

    return products;
  } catch (error) {
    console.error('Error loading products:', error.message);
    throw new Error(`Failed to load products data: ${error.message}`);
  }
}

/**
 * Save products to JSON file
 * @param {Array} products - Array of product objects
 * @returns {boolean} - Success status
 */
function saveProducts(products) {
  try {
    const dataPath = path.join(__dirname, '../../data/products.json');
    fs.writeFileSync(dataPath, JSON.stringify(products, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error saving products:', error.message);
    throw new Error(`Failed to save products data: ${error.message}`);
  }
}

module.exports = {
  loadProducts,
  saveProducts,
};
