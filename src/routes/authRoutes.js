/**
 * Auth Routes
 * POST endpoints for authentication
 */

const express = require('express');
const AuthController = require('../controllers/AuthController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * POST /api/auth/login
 * Login user and return JWT token
 * Body: { email: string, password: string }
 * Response: { success: boolean, token: string, user: object }
 */
router.post('/login', AuthController.login);

/**
 * POST /api/auth/register
 * Register a new user
 * Body: { name: string, email: string, password: string }
 * Response: { success: boolean, user: object }
 */
router.post('/register', AuthController.register);

/**
 * GET /api/auth/profile
 * Get authenticated user profile (requires valid JWT)
 * Header: Authorization: Bearer <token>
 * Response: { success: boolean, user: object }
 */
router.get('/profile', verifyToken, AuthController.getProfile);

module.exports = router;
