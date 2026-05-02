const fs = require('fs');
const path = require('path');
const express = require('express');

const router = express.Router();

/**
 * GET /api/products
 * 
 * Contract mapping:
 *  ① Browser calls requestProducts()
 *  ② Browser calls fetch('/api/products?category=?')
 *  ③ Express receives request and prepares to read JSON
 *  ④ fs.readFile('./data/products.json') returns full products array
 *  ⑤ Filter by category if param is provided
 *  ⑥ Express returns { success: true, data[] }
 *  ⑦ Browser calls renderProducts(data) → update #product-container
 * 
 * Query Parameters:
 *  - category (optional): Filter products by category
 * 
 * Responses:
 *  - 200 OK: { success: true, data: [...] }
 *  - 500: { success: false, error: "...", message: "..." }
 */
router.get('/', (req, res) => {
  // ② Extract query parameter from the browser request
  const categoryParam = req.query.category;

  // ③ Read products.json from file system
  const filePath = path.join(__dirname, '../../data/products.json');
  
  fs.readFile(filePath, 'utf-8', (err, fileData) => {
    // Handle file read errors (404, permission denied, etc.)
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'FILE_NOT_FOUND',
        message: 'Failed to load products data'
      });
    }

    try {
      // ④ Parse JSON file to get full products array
      const allProducts = JSON.parse(fileData);

      // ⑤ Filter by category if parameter is provided; otherwise return all
      let filteredProducts = allProducts;
      if (categoryParam) {
        filteredProducts = allProducts.filter(
          product => product.category === categoryParam
        );
      }

      // ⑥ Return success response with filtered/all data
      return res.status(200).json({
        success: true,
        data: filteredProducts
      });

    } catch (parseErr) {
      // Handle JSON parsing errors
      return res.status(500).json({
        success: false,
        error: 'PARSE_ERROR',
        message: 'Failed to parse products data'
      });
    }
  });
});

module.exports = router;
