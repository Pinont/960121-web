/**
 * Database Migration Script
 * Populates SQLite database with data from JSON files
 * Run once to migrate data: node db/migrate.js
 */

const fs = require('fs');
const path = require('path');
const { initDatabase, queryDatabase, executeDatabase, getDatabase, closeDatabase } = require('./database');
const { v4: uuidv4 } = require('uuid');

/**
 * Migrate products from JSON to database
 */
async function migrateProducts(db) {
  try {
    console.log('\n📦 Migrating products...');
    
    const productsPath = path.join(__dirname, '../../data/products.json');
    const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));

    let count = 0;
    let skipped = 0;
    const insertedIds = new Set();

    for (const product of productsData) {
      try {
        // Skip duplicate IDs in the same batch
        if (insertedIds.has(product.id)) {
          console.log(`  ⚠️  Skipping duplicate product ID ${product.id}`);
          skipped++;
          continue;
        }

        // Try to insert
        await executeDatabase(
          db,
          `INSERT OR IGNORE INTO products (id, image, title, price, category) VALUES (?, ?, ?, ?, ?)`,
          [product.id, product.image, product.title, product.price, product.category]
        );
        insertedIds.add(product.id);
        count++;
      } catch (error) {
        console.log(`  ⚠️  Skipping product ID ${product.id}: ${error.message}`);
        skipped++;
      }
    }
    console.log(`✓ Migrated ${count} products${skipped > 0 ? ` (${skipped} skipped due to duplicates)` : ''}`);
  } catch (error) {
    console.error('Error migrating products:', error);
    throw error;
  }
}

/**
 * Migrate users from JSON to database
 * Excludes login_tests section
 */
async function migrateUsers(db) {
  try {
    console.log('\n👥 Migrating users...');
    
    const authPath = path.join(__dirname, '../../data/auth_user.json');
    const authData = JSON.parse(fs.readFileSync(authPath, 'utf-8'));

    let count = 0;
    let skipped = 0;

    for (const user of authData.users) {
      try {
        // Assign UUID if not present (for legacy users)
        const userId = user.id || uuidv4();
        const email = user.email || user.username;
        
        await executeDatabase(
          db,
          `INSERT OR IGNORE INTO users (id, name, email, password, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            userId,
            user.name || user.first_name,
            email,
            user.password,
            user.created_at || new Date().toISOString(),
            user.updated_at || new Date().toISOString()
          ]
        );
        count++;
      } catch (error) {
        console.log(`  ⚠️  Skipping user ${user.email}: ${error.message}`);
        skipped++;
      }
    }
    console.log(`✓ Migrated ${count} users${skipped > 0 ? ` (${skipped} skipped)` : ''} (login_tests ignored)`);
  } catch (error) {
    console.error('Error migrating users:', error);
    throw error;
  }
}

/**
 * Migrate orders from JSON to database
 */
async function migrateOrders(db) {
  try {
    console.log('\n📦 Migrating orders...');
    
    const ordersPath = path.join(__dirname, '../../data/orders.json');
    
    // Check if orders file exists
    if (!fs.existsSync(ordersPath)) {
      console.log('⚠️  Orders file not found, skipping');
      return;
    }

    const ordersData = JSON.parse(fs.readFileSync(ordersPath, 'utf-8'));

    let count = 0;
    let skipped = 0;

    for (const order of ordersData.orders || ordersData) {
      try {
        await executeDatabase(
          db,
          `INSERT OR IGNORE INTO orders (id, email, items, total, status, created_at) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            order.id || order.orderId || uuidv4(),
            order.email,
            JSON.stringify(order.items),
            order.total,
            order.status || 'completed',
            order.created_at || new Date().toISOString()
          ]
        );
        count++;
      } catch (error) {
        console.log(`  ⚠️  Skipping order: ${error.message}`);
        skipped++;
      }
    }
    console.log(`✓ Migrated ${count} orders${skipped > 0 ? ` (${skipped} skipped)` : ''}`);
  } catch (error) {
    console.error('Error migrating orders:', error);
    throw error;
  }
}

/**
 * Run all migrations
 */
async function runMigrations() {
  console.log('\n🚀 Starting database migration...');
  
  let db;
  try {
    db = await initDatabase();
    
    await migrateProducts(db);
    await migrateUsers(db);
    await migrateOrders(db);
    
    console.log('\n✅ Migration completed successfully!');
    console.log('   All data has been populated into the SQLite database.');
    console.log('   login_tests in auth_user.json is preserved for reference.\n');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (db) {
      await closeDatabase(db);
    }
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations();
}

module.exports = { migrateProducts, migrateUsers, migrateOrders, runMigrations };
