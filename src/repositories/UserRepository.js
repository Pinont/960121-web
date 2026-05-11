/**
 * User Repository
 * src/repositories/UserRepository.js
 *
 * Single access point for all SQL operations on the `users` table.
 * No business logic lives here — only parameterized queries.
 *
 * FIXED vs original:
 *  - Added updatePassword()     → required by AuthService MD5→bcrypt upgrade path
 *  - Added findById()           → needed by middleware to re-validate user still exists
 *  - Added findAll()            → admin utility
 *  - Added deleteById()         → account deletion support
 *  - Added updateProfile()      → allow name/email updates
 *  - Added emailExists()        → lightweight check without fetching the full row
 *  - All queries use parameterized statements — no string interpolation anywhere
 */

const { getOne, queryDatabase, executeDatabase } = require('../db/database');

class UserRepository {

  // ── READ ──────────────────────────────────────────────────────────────────

  /**
   * Find a single user by email address.
   * Email is lowercased before querying to match the storage convention.
   *
   * @param {object} db   - SQLite connection
   * @param {string} email
   * @returns {object|undefined} user row or undefined if not found
   */
  async findByEmail(db, email) {
    return getOne(
      db,
      'SELECT id, name, email, password, created_at, updated_at FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    );
  }

  /**
   * Find a single user by their UUID primary key.
   * Used by authMiddleware to confirm the user still exists after token issuance.
   *
   * @param {object} db
   * @param {string} id  - UUID string
   * @returns {object|undefined}
   */
  async findById(db, id) {
    return getOne(
      db,
      'SELECT id, name, email, created_at, updated_at FROM users WHERE id = ?',
      // NOTE: password is intentionally excluded — never fetch it unless comparing
      [id]
    );
  }

  /**
   * Lightweight existence check — does not fetch the full row.
   * Use this instead of findByEmail when you only need a boolean.
   *
   * @param {object} db
   * @param {string} email
   * @returns {boolean}
   */
  async emailExists(db, email) {
    const row = await getOne(
      db,
      'SELECT 1 FROM users WHERE email = ? LIMIT 1',
      [email.toLowerCase().trim()]
    );
    return !!row;
  }

  /**
   * Get all users — for admin dashboards only.
   * Passwords are never returned.
   *
   * @param {object} db
   * @returns {Array<object>}
   */
  async findAll(db) {
    return queryDatabase(
      db,
      'SELECT id, name, email, created_at, updated_at FROM users ORDER BY created_at DESC'
    );
  }

  // ── WRITE ─────────────────────────────────────────────────────────────────

  /**
   * Insert a new user row.
   * Caller is responsible for pre-hashing the password with bcrypt.
   *
   * @param {object} db
   * @param {object} user - { id, name, email, password, created_at, updated_at }
   * @returns {{ id: number, changes: number }}
   */
  async insert(db, { id, name, email, password, created_at, updated_at }) {
    return executeDatabase(
      db,
      `INSERT INTO users (id, name, email, password, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        name.trim(),
        email.toLowerCase().trim(),
        password,        // must already be a bcrypt hash
        created_at,
        updated_at,
      ]
    );
  }

  /**
   * Update a user's hashed password.
   * Called by AuthService when upgrading a legacy MD5 account to bcrypt on login.
   *
   * @param {object} db
   * @param {string} userId
   * @param {string} newHashedPassword  - bcrypt hash, never plaintext
   * @returns {{ id: number, changes: number }}
   */
  async updatePassword(db, userId, newHashedPassword) {
    return executeDatabase(
      db,
      'UPDATE users SET password = ?, updated_at = ? WHERE id = ?',
      [newHashedPassword, new Date().toISOString(), userId]
    );
  }

  /**
   * Update a user's name and/or email.
   * Email uniqueness must be verified by the caller (AuthService/UserService)
   * before calling this method.
   *
   * @param {object} db
   * @param {string} userId
   * @param {object} fields - { name?, email? }
   * @returns {{ id: number, changes: number }}
   */
  async updateProfile(db, userId, { name, email }) {
    // Build a dynamic SET clause — only update fields that were provided
    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name.trim());
    }

    if (email !== undefined) {
      updates.push('email = ?');
      params.push(email.toLowerCase().trim());
    }

    if (updates.length === 0) {
      // Nothing to update — return a no-op result
      return { id: 0, changes: 0 };
    }

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(userId); // WHERE id = ?

    return executeDatabase(
      db,
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
  }

  // ── DELETE ────────────────────────────────────────────────────────────────

  /**
   * Permanently delete a user by ID.
   * Foreign key constraints in the DB will handle cascading to orders if set up.
   *
   * @param {object} db
   * @param {string} userId
   * @returns {{ id: number, changes: number }}
   */
  async deleteById(db, userId) {
    return executeDatabase(
      db,
      'DELETE FROM users WHERE id = ?',
      [userId]
    );
  }
}

module.exports = new UserRepository();