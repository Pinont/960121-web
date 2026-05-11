/**
 * Database Configuration and Initialization
 * SQLite database setup for Stylish e-commerce platform
 * src/db/database.js
 *
 * FIXED vs original:
 *  - Flattened the deeply nested callback pyramid in createTables() using
 *    a sequential helper — far easier to read and extend with new tables.
 *  - Added PRAGMA journal_mode = WAL for better concurrent read performance.
 *  - Added user_id FK column on the orders table so orders are properly
 *    linked to the users table (original only stored email — no relational link).
 *  - Added order_items table — normalizes cart line-items out of the TEXT blob.
 *  - Added runMigrations() to add new columns to existing DBs without data loss.
 *  - Singleton pattern on the DB connection — avoids opening a new file handle
 *    on every request.
 *  - getDatabase() now returns the singleton instead of opening a new connection.
 *  - Added DB_PATH guard: falls back to process.env.DB_PATH if set.
 */

const sqlite3 = require('sqlite3').verbose();
const path    = require('path');
const fs      = require('fs');

// ── Path config ───────────────────────────────────────────────────────────────
// FIXED: Respect DB_PATH env var so tests can use an in-memory DB (:memory:)
const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, '../../data/store.db');

// Ensure the data directory exists (skipped for :memory:)
if (DB_PATH !== ':memory:') {
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// ── Singleton connection ──────────────────────────────────────────────────────
// FIXED: Store one connection for the lifetime of the process.
// Original code opened a brand-new connection on every getDatabase() call,
// which wastes file handles and can cause SQLITE_BUSY errors under load.
let _dbInstance = null;

// ── Table definitions ─────────────────────────────────────────────────────────
// Declared as an ordered array so createTables() can iterate instead of nesting.
const TABLE_DEFINITIONS = [
  {
    name: 'products',
    sql: `
      CREATE TABLE IF NOT EXISTS products (
        id         INTEGER PRIMARY KEY,
        image      TEXT    NOT NULL,
        title      TEXT    NOT NULL,
        price      REAL    NOT NULL,
        category   TEXT    NOT NULL,
        stock      INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `,
  },
  {
    name: 'users',
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id         TEXT PRIMARY KEY,
        name       TEXT NOT NULL,
        email      TEXT UNIQUE NOT NULL,
        password   TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `,
  },
  {
    // FIXED: Added user_id FK — original had no relational link between
    // orders and users (only stored email as a plain TEXT field).
    name: 'orders',
    sql: `
      CREATE TABLE IF NOT EXISTS orders (
        id         TEXT    PRIMARY KEY,
        user_id    TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        email      TEXT    NOT NULL,
        total      REAL    NOT NULL,
        status     TEXT    NOT NULL DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `,
  },
  {
    // FIXED: New table — normalizes cart items out of the TEXT blob.
    // Original stored items as a JSON string in orders.items (TEXT NOT NULL).
    // Storing structured data in a text column breaks querying, reporting,
    // and referential integrity.
    name: 'order_items',
    sql: `
      CREATE TABLE IF NOT EXISTS order_items (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id   TEXT    NOT NULL REFERENCES orders(id)   ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
        quantity   INTEGER NOT NULL DEFAULT 1,
        unit_price REAL    NOT NULL
      )
    `,
  },
];

// ── Migrations ────────────────────────────────────────────────────────────────
// Adds columns that exist in the new schema but may be missing in older DBs.
// ALTER TABLE ADD COLUMN is a no-op if the column already exists (guarded below).
const MIGRATIONS = [
  // Add stock column to products if this is an older DB
  {
    description: 'Add stock column to products',
    check: `SELECT 1 FROM pragma_table_info('products') WHERE name='stock'`,
    sql: `ALTER TABLE products ADD COLUMN stock INTEGER NOT NULL DEFAULT 0`,
  },
  // Add user_id column to orders if this is an older DB
  {
    description: 'Add user_id column to orders',
    check: `SELECT 1 FROM pragma_table_info('orders') WHERE name='user_id'`,
    sql: `ALTER TABLE orders ADD COLUMN user_id TEXT`,
  },
];

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Promisify db.run() for single statements.
 */
function _run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

/**
 * Promisify db.get() for single-row reads.
 */
function _get(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

/**
 * Create tables sequentially from TABLE_DEFINITIONS.
 * FIXED: Replaces the deeply nested callback pyramid in the original.
 */
async function createTables(db) {
  for (const table of TABLE_DEFINITIONS) {
    await _run(db, table.sql);
    console.log(`✓ ${table.name} table ready`);
  }
}

/**
 * Run schema migrations for existing databases.
 * Checks whether each column exists before attempting ALTER TABLE.
 */
async function runMigrations(db) {
  for (const migration of MIGRATIONS) {
    const exists = await _get(db, migration.check);
    if (!exists) {
      await _run(db, migration.sql);
      console.log(`✓ Migration applied: ${migration.description}`);
    }
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Initialize the database — open connection, set PRAGMAs, create tables,
 * run migrations, and store the singleton.
 * Call once at server startup in server.js.
 *
 * @returns {Promise<sqlite3.Database>}
 */
function initDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, async (err) => {
      if (err) {
        console.error('Error opening database:', err);
        return reject(err);
      }

      console.log(`Connected to SQLite database at ${DB_PATH}`);

      try {
        // FIXED: Enable WAL mode — allows concurrent reads while a write is in progress.
        // journal_mode=DELETE (the default) locks the entire file on every write.
        await _run(db, 'PRAGMA journal_mode = WAL');

        // Enable foreign key enforcement (SQLite disables it by default)
        await _run(db, 'PRAGMA foreign_keys = ON');

        await createTables(db);
        await runMigrations(db);

        _dbInstance = db;
        resolve(db);
      } catch (setupErr) {
        console.error('Database setup error:', setupErr);
        reject(setupErr);
      }
    });
  });
}

/**
 * Get the singleton database connection.
 * FIXED: Returns the existing instance instead of opening a new connection
 * on every call, which was the original behaviour.
 *
 * @returns {Promise<sqlite3.Database>}
 */
function getDatabase() {
  if (_dbInstance) {
    return Promise.resolve(_dbInstance);
  }

  // Fallback: if called before initDatabase() (e.g. in tests), initialise now.
  console.warn('WARN: getDatabase() called before initDatabase(). Initialising now.');
  return initDatabase();
}

/**
 * Close the database connection and clear the singleton.
 *
 * @param {sqlite3.Database} db
 * @returns {Promise<void>}
 */
function closeDatabase(db) {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        reject(err);
      } else {
        _dbInstance = null;
        console.log('Database connection closed');
        resolve();
      }
    });
  });
}

/**
 * Run a SELECT query that returns multiple rows.
 *
 * @param {sqlite3.Database} db
 * @param {string} sql
 * @param {Array}  params
 * @returns {Promise<Array<object>>}
 */
function queryDatabase(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

/**
 * Run a SELECT query that returns a single row.
 *
 * @param {sqlite3.Database} db
 * @param {string} sql
 * @param {Array}  params
 * @returns {Promise<object|undefined>}
 */
function getOne(db, sql, params = []) {
  return _get(db, sql, params);
}

/**
 * Run an INSERT / UPDATE / DELETE statement.
 * Returns { id: lastInsertRowid, changes: rowsAffected }.
 *
 * @param {sqlite3.Database} db
 * @param {string} sql
 * @param {Array}  params
 * @returns {Promise<{ id: number, changes: number }>}
 */
function executeDatabase(db, sql, params = []) {
  return _run(db, sql, params);
}

module.exports = {
  DB_PATH,
  initDatabase,
  getDatabase,
  closeDatabase,
  queryDatabase,
  getOne,
  executeDatabase,
};