/**
 * Auth Controller
 * Handles HTTP requests for authentication
 */

const AuthService = require('../services/AuthService');

class AuthController {
  /**
   * POST /api/auth/login
   * Login user and return JWT token
   */
  static async login(req, res, next) {
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

      const authResult = await AuthService.authenticateUser(email, password, req.db);

      if (!authResult.success) {
        return res.status(401).json({
          success: false,
          message: authResult.message,
        });
      }

      const token = AuthService.generateToken(authResult.user);

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: authResult.user.id,
          email: authResult.user.email,
          name: authResult.user.name,
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

  /**
   * POST /api/auth/register
   * Register a new user
   */
  static async register(req, res, next) {
    try {
      const { name, email, password } = req.body;

      const result = await AuthService.registerUser(name, email, password, req.db);

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
      console.error('Registration error:', error);
      next(error);
    }
  }

  /**
   * GET /api/auth/profile
   * Get authenticated user profile (requires JWT)
   */
  static getProfile(req, res, next) {
    try {
      return res.status(200).json({
        success: true,
        user: req.user,
      });
    } catch (error) {
      console.error('Profile error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}

module.exports = AuthController;
