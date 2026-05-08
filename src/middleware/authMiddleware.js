/**
 * Authentication Middleware
 * Verifies JWT tokens from Authorization headers
 */

const AuthService = require('../services/AuthService');

/**
 * Middleware to verify JWT token
 * Expects: Authorization: Bearer <token>
 * Sets req.user to decoded payload on success
 */
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
    const decoded = AuthService.verifyToken(token);

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

module.exports = {
  verifyToken,
};
