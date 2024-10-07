// routes/authRoutes.js
const express = require('express');
const router = express.Router();

const { 
    loginHandler, 
    logoutHandler, 
    forgotPasswordHandler, 
    checkSessionHandler, 
    registerHandler, 
    resetPasswordHandler 
} = require('../controllers/AuthController');

// POST /api/auth/register
router.post('/register', registerHandler);

// POST /api/auth/login
router.post('/login', loginHandler);

// POST /api/auth/logout
router.post('/logout', logoutHandler);

// GET /api/auth/check-session
router.get('/check-session', checkSessionHandler);

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPasswordHandler);

// POST /api/auth/reset-password
router.post('/reset-password', resetPasswordHandler);

module.exports = router;
