// repositories/UserRepository.js
const { getOne, executeDatabase } = require('../db/database');

class UserRepository {
  async findByEmail(db, email) {
    return getOne(db, 'SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
  }

  async insert(db, { id, name, email, password, created_at, updated_at }) {
    return executeDatabase(
      db,
      `INSERT INTO users (id, name, email, password, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, name, email, password, created_at, updated_at]
    );
  }
}

module.exports = new UserRepository();
