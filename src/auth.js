/**
 * CONSOLIDATED AUTH SERVICE
 * Routes + Controller + Service + Utilities in one file
 * Handles all authentication operations: login, profile, JWT verification
 */

const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { registerUser } = require('./register');

const router = express.Router();

// ============================================================================
// CONFIGURATION
// ============================================================================
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';
const AUTH_DATA_PATH = path.join(__dirname, '../data/auth_user.json');

// ============================================================================
// UTILITIES - Data Loading
// ============================================================================

function loadAuthData() {
  try {
    const rawData = fs.readFileSync(AUTH_DATA_PATH, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Error loading auth data:', error);
    throw new Error('Failed to load authentication data');
  }
}

function findUserByEmail(email) {
  try {
    const authData = loadAuthData();
    return authData.users.find(user => user.username === email) || null;
  } catch (error) {
    console.error('Error finding user:', error);
    return null;
  }
}

// ============================================================================
// SERVICE - Business Logic
// ============================================================================

function compareMD5Password(plainPassword, md5Hash) {
  const hash = crypto.createHash('md5').update(plainPassword).digest('hex');
  return hash === md5Hash;
}

async function authenticateUser(email, password) {
  try {
    const user = findUserByEmail(email);

    if (!user) {
      return {
        success: false,
        user: null,
        message: 'Invalid email or password',
      };
    }

    // Check if password is bcrypt hash (starts with $2a$, $2b$, or $2y$)
    const isBcryptHash = user.password && /^\$2[aby]\$/.test(user.password);
    let passwordMatch = false;

    if (isBcryptHash) {
      // Compare bcrypt hash
      passwordMatch = await bcrypt.compare(password, user.password);
    } else {
      // Compare MD5 hash (legacy)
      passwordMatch = compareMD5Password(password, user.password);
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
        id: user.id || user.username,
        email: user.email || user.username,
        firstName: user.name || user.first_name,
        registrationDate: user.registration_date || user.created_at,
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

function generateToken(user) {
  try {
    const payload = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      iat: Math.floor(Date.now() / 1000),
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
    return token;
  } catch (error) {
    console.error('Token generation error:', error);
    throw new Error('Failed to generate authentication token');
  }
}

function verifyJWT(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('Token verification error:', error.message);
    return null;
  }
}

// ============================================================================
// MIDDLEWARE - Token Verification
// ============================================================================

function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header missing',
      });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization header format',
      });
    }

    const token = parts[1];
    const decoded = verifyJWT(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({
      success: false,
      message: 'Token verification failed',
    });
  }
}

// ============================================================================
// CONTROLLER - Request Handlers
// ============================================================================

async function loginHandler(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
    }

    const authResult = await authenticateUser(email, password);

    if (!authResult.success) {
      return res.status(401).json({
        success: false,
        message: authResult.message,
      });
    }

    const token = generateToken(authResult.user);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token: token,
      user: {
        id: authResult.user.id,
        email: authResult.user.email,
        firstName: authResult.user.firstName,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

function getProfileHandler(req, res, next) {
  try {
    return res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

async function registerHandler(req, res, next) {
  try {
    const { name, email, password } = req.body;

    const result = await registerUser(name, email, password);

    if (!result.success) {
      return res.status(result.code || 400).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(result.code || 201).json({
      success: true,
      message: result.message,
      user: result.user,
    });
  } catch (error) {
    console.error('Registration endpoint error:', error);
    next(error);
  }
}

// ============================================================================
// ROUTES
// ============================================================================

/**
 * POST /api/auth/login
 * Authenticate user with email and password, returns JWT token
 */
router.post('/login', loginHandler);

/**
 * GET /api/auth/profile
 * Get authenticated user profile (requires valid JWT)
 */
router.get('/profile', verifyToken, getProfileHandler);

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', registerHandler);

// ============================================================================
// BROWSER CLIENT - Frontend AuthManager
// ============================================================================

// Define AuthManager at global scope (will be available in browser)
// This is the first thing we check - if we're in browser, define it
if (typeof window !== 'undefined') {
  window.AuthManager = {
    apiBaseUrl: 'http://localhost:3000',

    async login(email, password) {
      try {
        const response = await fetch(`${this.apiBaseUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Login failed');
        this.saveToken(data.token);
        this.saveUser(data.user);
        return data;
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      }
    },

    saveToken(token) {
      localStorage.setItem('authToken', token);
    },

    getToken() {
      return localStorage.getItem('authToken');
    },

    saveUser(user) {
      localStorage.setItem('user', JSON.stringify(user));
    },

    getUser() {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    },

    isAuthenticated() {
      return !!this.getToken();
    },

    async authenticatedRequest(endpoint, options = {}) {
      const token = this.getToken();
      if (!token) throw new Error('No authentication token found');

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      };

      const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        this.logout();
        throw new Error('Session expired. Please login again.');
      }

      return response.json();
    },

    async getProfile() {
      return this.authenticatedRequest('/api/auth/profile');
    },

    logout() {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.reload();
    },
  };
}

// ============================================================================
// EXPORTS FOR NODE.JS
// ============================================================================

// For Express/Node.js backend - export the router
module.exports = router;
