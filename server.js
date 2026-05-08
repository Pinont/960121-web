const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import database
const { initDatabase } = require('./src/db/database'); // fix: removed dead runMigrations import
const migrate = require('./src/db/migrate');

// Import refactored routes (layered architecture)
const productRoutes  = require('./src/routes/productRoutes');
const authRoutes     = require('./src/routes/authRoutes');
const checkoutRoutes = require('./src/routes/checkoutRoutes');
const orderRoutes    = require('./src/routes/orderRoutes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Global database connection
let globalDb = null;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  req.db = globalDb;
  next();
});

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/products',  productRoutes);
app.use('/api/auth',      authRoutes);
app.use('/api/checkout',  checkoutRoutes);
app.use('/api/orders',    orderRoutes);

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

// Initialize database and start server
async function startServer() {
  try {
    console.log('📦 Initializing database...');
    globalDb = await initDatabase();

    console.log('🔄 Running migrations...');
    await migrate.runMigrations();

    console.log('✓ Database ready!');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log('📊 Using SQLite database for data storage');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
