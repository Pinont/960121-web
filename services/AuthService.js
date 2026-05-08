/**
 * Auth Service
 * Pure business logic for authentication and user management using SQLite
 */

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getOne, queryDatabase, executeDatabase } = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';

class AuthService {
  /**
   * Find user by email in database
   */
  async findUserByEmail(email, db) {
    try {
      const user = await getOne(
        db,
        'SELECT * FROM users WHERE email = ?',
        [email.toLowerCase()]
      );
      return user || null;
    } catch (error) {
      console.error('Error finding user:', error);
      return null;
    }
  }

  /**
   * Compare MD5 password (legacy support)
   */
  compareMD5Password(plainPassword, md5Hash) {
    const hash = crypto
      .createHash('md5')
      .update(plainPassword)
      .digest('hex');
    return hash === md5Hash;
  }

  /**
   * Authenticate user with email and password
   */
  async authenticateUser(email, password, db) {
    try {
      const user = await this.findUserByEmail(email, db);

      if (!user) {
        return {
          success: false,
          user: null,
          message: 'Invalid email or password',
        };
      }

      // Check if password is bcrypt hash
      const isBcryptHash = user.password && /^\$2[aby]\$/.test(user.password);
      let passwordMatch = false;

      if (isBcryptHash) {
        passwordMatch = await bcrypt.compare(password, user.password);
      } else {
        passwordMatch = this.compareMD5Password(password, user.password);
      }

      if (!passwordMatch) {
        return {
          success: false,
          user: null,
          message: 'Invalid email or password',
        };
      }

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          created_at: user.created_at,
        },
        message: 'Authentication successful',
      };
    } catch (error) {
      console.error('Authentication error:', error);
      return {
        success: false,
        user: null,
        message: 'Authentication failed',
      };
    }
  }

  /**
   * Register a new user
   */
  async registerUser(name, email, password, db) {
    try {
      if (!name || !email || !password) {
        return {
          success: false,
          message: 'Name, email, and password are required',
          code: 400,
        };
      }

      const existingUser = await this.findUserByEmail(email, db);
      if (existingUser) {
        return {
          success: false,
          message: 'Email already registered',
          code: 409,
        };
      }

      const userId = uuidv4();
      const hashedPassword = await bcrypt.hash(password, 10);
      const now = new Date().toISOString();

      await executeDatabase(
        db,
        `INSERT INTO users (id, name, email, password, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, name.trim(), email.toLowerCase().trim(), hashedPassword, now, now]
      );

      return {
        success: true,
        message: 'Registration successful',
        code: 201,
        user: {
          id: userId,
          name: name.trim(),
          email: email.toLowerCase().trim(),
          created_at: now,
        },
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error.message || 'Registration failed',
        code: 500,
      };
    }
  }

  /**
   * Generate JWT token
   */
  generateToken(user) {
    try {
      const payload = {
        id: user.id,
        email: user.email,
        name: user.name,
        iat: Math.floor(Date.now() / 1000),
      };

      return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
    } catch (error) {
      console.error('Token generation error:', error);
      throw new Error('Failed to generate token');
    }
  }

  /**
   * Verify JWT token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      console.error('Token verification error:', error.message);
      return null;
    }
  }
}

module.exports = new AuthService();
