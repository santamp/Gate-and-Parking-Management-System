const express = require('express');
const router = express.Router();
const { loginUser, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// @desc    Auth user & get token (Login)
// @route   POST /api/v1/auth/login
// @access  Public
router.post('/login', loginUser);

// @desc    Get current user profile
// @route   GET /api/v1/auth/me
// @access  Private
router.get('/me', protect, getMe);

module.exports = router;
