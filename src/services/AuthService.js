/**
 * Auth Service
 * Pure business logic for authentication and user management.
 * Never writes SQL — delegates all data access to UserRepository.
 */
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const UserRepository = require('../repositories/UserRepository');

// ── Secret validation — crash at startup if JWT_SECRET is missing ────────────
// FIXED: Removed the || 'your-super-secret-key-change-in-production' fallback.
// A missing secret must be a hard failure, not a silent degradation.
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h'; // non-sensitive, fallback is safe

if (!JWT_SECRET) {
  console.error('────────────────────────────────────────────────────');
  console.error('FATAL: JWT_SECRET is not defined in environment.');
  console.error('Steps to fix:');
  console.error('  1. Run: cp .env.example .env');
  console.error('  2. Generate a secret:');
  console.error('     node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  console.error('  3. Paste the output as JWT_SECRET= in your .env file');
  console.error('────────────────────────────────────────────────────');
  process.exit(1); // Hard stop — never run with a missing secret
}

const SALT_ROUNDS = 12; // FIXED: was 10 — 12 is the current recommended minimum

class AuthService {
  /**
   * Find user by email
   */
  async findUserByEmail(email, db) {
    try {
      const user = await UserRepository.findByEmail(db, email);
      return user || null;
    } catch (error) {
      console.error('Error finding user:', error);
      return null;
    }
  }

  /**
   * Compare MD5 password (legacy support only — do not use for new users)
   * FIXED: Added a deprecation warning so you know when to migrate old accounts.
   */
  compareMD5Password(plainPassword, md5Hash) {
    console.warn(
      'SECURITY WARNING: MD5 password comparison used for legacy account. ' +
      'Recommend migrating this user to bcrypt on next login.'
    );
    const hash = crypto.createHash('md5').update(plainPassword).digest('hex');
    return hash === md5Hash;
  }

  /**
   * Authenticate user with email and password
   * FIXED: Added bcrypt rehash-on-login to silently upgrade legacy MD5 accounts.
   */
  async authenticateUser(email, password, db) {
    try {
      const user = await this.findUserByEmail(email, db);

      if (!user) {
        // FIXED: Uniform timing — do a dummy bcrypt compare to prevent
        // timing attacks that can reveal whether an email exists.
        await bcrypt.compare(password, '$2b$12$invalidhashfortimingprotection000000000000000000000000');
        return { success: false, user: null, message: 'Invalid email or password' };
      }

      const isBcryptHash = user.password && /^\$2[aby]\$/.test(user.password);
      let passwordMatch = false;

      if (isBcryptHash) {
        passwordMatch = await bcrypt.compare(password, user.password);
      } else {
        // Legacy MD5 path — verify, then silently upgrade to bcrypt
        passwordMatch = this.compareMD5Password(password, user.password);
        if (passwordMatch) {
          const newHash = await bcrypt.hash(password, SALT_ROUNDS);
          await UserRepository.updatePassword(db, user.id, newHash);
          console.info(`INFO: Upgraded password hash for user ${user.id} from MD5 to bcrypt.`);
        }
      }

      if (!passwordMatch) {
        return { success: false, user: null, message: 'Invalid email or password' };
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
      return { success: false, user: null, message: 'Authentication failed' };
    }
  }

  /**
   * Register a new user
   */
  async registerUser(name, email, password, db) {
    try {
      // FIXED: Added password strength check — min 8 chars
      if (!name || !email || !password) {
        return { success: false, message: 'Name, email, and password are required', code: 400 };
      }

      if (password.length < 8) {
        return { success: false, message: 'Password must be at least 8 characters', code: 400 };
      }

      // FIXED: Basic email format validation on the server side
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { success: false, message: 'Invalid email format', code: 400 };
      }

      const existingUser = await this.findUserByEmail(email, db);
      if (existingUser) {
        return { success: false, message: 'Email already registered', code: 409 };
      }

      const userId = uuidv4();
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS); // FIXED: was 10
      const now = new Date().toISOString();

      await UserRepository.insert(db, {
        id: userId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        created_at: now,
        updated_at: now,
      });

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
      return { success: false, message: error.message || 'Registration failed', code: 500 };
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
        // FIXED: Removed manual iat — jwt.sign() sets this automatically.
        // Setting it manually can cause subtle clock-skew bugs.
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
      // FIXED: Distinguish expired vs. tampered tokens in the log for debugging
      if (error.name === 'TokenExpiredError') {
        console.warn('Token verification: token has expired.');
      } else {
        console.error('Token verification error:', error.message);
      }
      return null;
    }
  }
}

module.exports = new AuthService();