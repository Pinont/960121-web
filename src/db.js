// src/db.js
// ============================================================================
// DATABASE CONNECTION MODULE
// Opens a single shared SQLite connection to store.db
// Creates required tables on startup if they don't exist
// ============================================================================

const sqlite3 = require('sqlite3').verbose();
const path    = require('path');

// Resolve path: store.db lives at the project root
const DB_PATH = path.join(__dirname, '../store.db');

// Open (or create) the database file
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Failed to connect to store.db:', err.message);
    process.exit(1); // Fatal — cannot run without a database
  }
  console.log('✅ Connected to SQLite database: store.db');
});

// Enable WAL mode for better concurrent read performance
db.run('PRAGMA journal_mode = WAL;');

// ============================================================================
// TABLE INITIALISATION
// Creates the orders table if it does not already exist
// ============================================================================
db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS orders (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id      TEXT    NOT NULL,
      product_id   TEXT    NOT NULL,
      quantity     INTEGER NOT NULL CHECK(quantity > 0),
      total_price  REAL    NOT NULL CHECK(total_price >= 0),
      status       TEXT    NOT NULL DEFAULT 'completed',
      created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
    )`,
    (err) => {
      if (err) {
        console.error('❌ Failed to create orders table:', err.message);
      } else {
        console.log('✅ Orders table ready.');
      }
    }
  );
});

module.exports = db;
