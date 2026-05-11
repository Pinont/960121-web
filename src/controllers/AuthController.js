/**
 * Auth Controller
 * src/controllers/AuthController.js
 *
 * FIXED vs original:
 *  - getProfile() now re-fetches the user from DB instead of returning raw
 *    req.user from the JWT — deleted/updated users were invisible to the original.
 *  - login() and register() both use req.app.locals.db instead of a module-level
 *    getDatabase() import, which is consistent with server.js attaching db to app.locals.
 *  - Added 429-style duplicate registration guard (409 Conflict).
 *  - Removed raw error message exposure in production responses.
 */

const AuthService    = require('../services/AuthService');
const UserRepository = require('../repositories/UserRepository');

class AuthController {

  /**
   * POST /api/auth/login
   */
  async login(req, res) {
    try {
      const db = req.app.locals.db;
      const { email, password } = req.body;

      // Basic presence check — AuthService does full validation
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required',
        });
      }

      const result = await AuthService.authenticateUser(email, password, db);

      if (!result.success) {
        // FIXED: Always 401, never expose whether it was email or password
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      const token = AuthService.generateToken(result.user);

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id:         result.user.id,
            name:       result.user.name,
            email:      result.user.email,
            created_at: result.user.created_at,
          },
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({
        success: false,
        message: 'Login failed. Please try again.',
      });
    }
  }

  /**
   * POST /api/auth/register
   */
  async register(req, res) {
    try {
      const db = req.app.locals.db;
      const { name, email, password } = req.body;

      const result = await AuthService.registerUser(name, email, password, db);

      if (!result.success) {
        return res.status(result.code || 400).json({
          success: false,
          message: result.message,
        });
      }

      // Auto-login after registration — return token immediately
      const token = AuthService.generateToken(result.user);

      return res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          token,
          user: result.user,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({
        success: false,
        message: 'Registration failed. Please try again.',
      });
    }
  }

  /**
   * GET /api/auth/profile
   * Requires: Authorization: Bearer <token>  (verifyToken middleware)
   *
   * FIXED: Original returned req.user directly from the JWT payload.
   * Problem: if the user was deleted or had their email changed after the
   * token was issued, the stale JWT data would still be returned.
   * Fix: re-fetch from DB on every profile request.
   */
  async getProfile(req, res) {
    try {
      const db   = req.app.locals.db;
      const user = await UserRepository.findById(db, req.user.id);

      if (!user) {
        // Token is valid but user no longer exists — treat as unauthorised
        return res.status(401).json({
          success: false,
          message: 'User account no longer exists. Please log in again.',
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          id:         user.id,
          name:       user.name,
          email:      user.email,
          created_at: user.created_at,
          updated_at: user.updated_at,
          // password is never returned — UserRepository.findById excludes it
        },
      });
    } catch (error) {
      console.error('Get profile error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve profile.',
      });
    }
  }

  /**
   * POST /api/auth/logout
   * JWT is stateless — logout is handled client-side by deleting the token.
   * This endpoint exists to give the frontend a clean API surface and for
   * future server-side token blacklisting if needed.
   */
  logout(req, res) {
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully. Please delete your token on the client.',
    });
  }
}

module.exports = new AuthController();