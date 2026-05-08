/**
 * Database Configuration and Initialization
 * SQLite database setup for Stylish e-commerce platform
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../../data/store.db');


const dataDir = path.dirname(DB_PATH);

if (!fs.existsSync(dataDir)) {

  fs.mkdirSync(dataDir, { recursive: true });

}

/**
 * Initialize database and create tables if they don't exist
 */
function initDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
        return;
      }

      console.log('Connected to SQLite database');

      // Enable foreign keys
      db.run('PRAGMA foreign_keys = ON', (err) => {
        if (err) {
          console.error('Error enabling foreign keys:', err);
          reject(err);
          return;
        }

        // Create tables
        createTables(db)
          .then(() => resolve(db))
          .catch(reject);
      });
    });
  });
}

/**
 * Create all necessary tables
 */
function createTables(db) {
  return new Promise((resolve, reject) => {
    // Products table
    db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY,
        image TEXT NOT NULL,
        title TEXT NOT NULL,
        price REAL NOT NULL,
        category TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating products table:', err);
        reject(err);
        return;
      }
      console.log('✓ Products table ready');

      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating users table:', err);
          reject(err);
          return;
        }
        console.log('✓ Users table ready');

        // Orders table
        db.run(`
          CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            email TEXT NOT NULL,
            items TEXT NOT NULL,
            total REAL NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) {
            console.error('Error creating orders table:', err);
            reject(err);
            return;
          }
          console.log('✓ Orders table ready');
          resolve();
        });
      });
    });
  });
}

/**
 * Get database connection
 */
function getDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        reject(err);
      } else {
        db.run('PRAGMA foreign_keys = ON');
        resolve(db);
      }
    });
  });
}

/**
 * Close database connection
 */
function closeDatabase(db) {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        reject(err);
      } else {
        console.log('Database connection closed');
        resolve();
      }
    });
  });
}

/**
 * Run a query that returns results
 */
function queryDatabase(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

/**
 * Run a query that returns a single row
 */
function getOne(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

/**
 * Run an INSERT/UPDATE/DELETE query
 */
function executeDatabase(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({
          id: this.lastID,
          changes: this.changes
        });
      }
    });
  });
}

module.exports = {
  DB_PATH,
  initDatabase,
  getDatabase,
  closeDatabase,
  queryDatabase,
  getOne,
  executeDatabase
};
