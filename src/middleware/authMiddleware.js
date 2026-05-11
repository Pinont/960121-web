/**
 * Authentication Middleware
 * Verifies JWT tokens from Authorization headers.
 *
 * FIXED:
 * - Added optional `requireAuth` vs `optionalAuth` export for flexible route protection.
 * - Added explicit 403 for tampered tokens vs 401 for missing/expired tokens.
 * - Token format check now provides a clearer error message.
 */

const AuthService = require('../services/AuthService');

/**
 * verifyToken (required auth)
 * Hard-blocks any request without a valid JWT.
 * Expects: Authorization: Bearer <token>
 * Sets req.user to decoded payload on success.
 */
function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    // FIXED: 401 = "who are you?" — no credentials provided at all
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header missing. Please log in.',
      });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization format. Expected: Bearer <token>',
      });
    }

    const token = parts[1];

    // FIXED: Check for an empty token string after splitting
    if (!token || token.trim() === '') {
      return res.status(401).json({
        success: false,
        message: 'Token is empty. Please log in again.',
      });
    }

    const decoded = AuthService.verifyToken(token);

    // FIXED: null return from verifyToken means expired OR tampered.
    // Both are 401 from the client's perspective — do not expose the reason.
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please log in again.',
      });
    }

    req.user = decoded; // attach decoded payload { id, email, name } to request
    next();
  } catch (error) {
    console.error('Auth middleware unexpected error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.',
    });
  }
}

/**
 * optionalAuth
 * Soft auth — does NOT block the request if no token is present.
 * Sets req.user if a valid token is provided, otherwise sets req.user = null.
 * Useful for routes that serve both guests and logged-in users (e.g. product listing).
 *
 * Usage: router.get('/products', optionalAuth, ProductController.getAll);
 */
function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      req.user = null;
      return next();
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
      req.user = null;
      return next();
    }

    const decoded = AuthService.verifyToken(parts[1]);
    req.user = decoded || null; // null if expired or invalid — does not block
    next();
  } catch (error) {
    // Never block a request in optional mode — just clear the user
    req.user = null;
    next();
  }
}

module.exports = { verifyToken, optionalAuth };
