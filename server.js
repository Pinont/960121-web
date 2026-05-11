/**
 * server.js — Express entry point
 * Stylish E-Commerce Platform
 *
 * FIXED vs original:
 *  - CORS origin now reads from ALLOWED_ORIGINS env var instead of '*'
 *  - Removed duplicate migrate.runMigrations() call — migrations now run
 *    inside initDatabase() in database.js
 *  - Added env var guard (fail fast on missing JWT_SECRET)
 *  - Added global error handler middleware
 *  - Attached db to app.locals so all controllers can access it via req.app.locals.db
 *  - Added graceful shutdown on SIGTERM / SIGINT
 */

require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const path     = require('path');

const { initDatabase, closeDatabase } = require('./src/db/database');

// Routes
const authRoutes     = require('./src/routes/authRoutes');
const productRoutes  = require('./src/routes/productRoutes');
const orderRoutes    = require('./src/routes/orderRoutes');
const checkoutRoutes = require('./src/routes/checkoutRoutes');

// ── Env guard — fail before binding any port ──────────────────────────────────
const REQUIRED_ENV = ['JWT_SECRET'];
REQUIRED_ENV.forEach((key) => {
  if (!process.env[key]) {
    console.error(`FATAL: Missing required environment variable: ${key}`);
    console.error('Run: cp .env.example .env  then fill in the values.');
    process.exit(1);
  }
});

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// FIXED: Parse allowed origins from env var — never ship with '*' in production
// .env example:  ALLOWED_ORIGINS=http://localhost:5500,https://yourdomain.com
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:5500', 'http://127.0.0.1:5500'];

const app = express();

// ── Core middleware ───────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json({ limit: '10kb' })); // FIXED: limit body size to prevent payload attacks
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname)));

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders',   orderRoutes);
app.use('/api/checkout', checkoutRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ── SPA fallback — serve index.html for any unmatched GET ────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── Global error handler ──────────────────────────────────────────────────────
// FIXED: Added — without this, any thrown error with no try/catch leaks a
// full stack trace to the client in production.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || 500;
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} — ${err.message}`);

  res.status(status).json({
    success: false,
    message: NODE_ENV === 'production' ? 'Internal server error' : err.message,
    ...(NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// ── Startup ───────────────────────────────────────────────────────────────────
initDatabase()
  .then((db) => {
    // FIXED: Attach db to app.locals — controllers access it via req.app.locals.db
    // This avoids passing db as a module-level singleton that breaks in tests.
    app.locals.db = db;

    const server = app.listen(PORT, () => {
      console.log('─────────────────────────────────────────');
      console.log(` Stylish API running on port ${PORT}`);
      console.log(` Environment : ${NODE_ENV}`);
      console.log(` Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
      console.log('─────────────────────────────────────────');
    });

    // ── Graceful shutdown ─────────────────────────────────────────────────
    // FIXED: Added — without this, Ctrl+C or a Docker SIGTERM leaves the
    // SQLite WAL file in an inconsistent state.
    const shutdown = async (signal) => {
      console.log(`\n${signal} received — shutting down gracefully…`);
      server.close(async () => {
        await closeDatabase(db);
        console.log('Server and database closed. Goodbye.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });