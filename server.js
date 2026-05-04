const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import consolidated routes (auth + products)
const productsRoutes = require('./src/products');
const authRoutes = require('./src/auth');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve auth.js for frontend (client-side AuthManager)
app.get('/auth.js', (req, res) => {
  const authPath = path.join(__dirname, 'src/auth.js');
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(authPath);
});

// Routes
app.use('/api/products', productsRoutes);
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Server is running' });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {},
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

module.exports = app;
