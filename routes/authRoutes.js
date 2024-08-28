const express = require('express');
const router = express.Router();
const authenticate = require('../auth'); // Adjust the path if necessary
const { verifyJWT, requireRole } = require('../utils/requireRole'); // Path to your requireRole middleware
const { handleUserLogin } = require('../auth'); // Ensure correct path to your auth file

// A protected route for Admins and Super Admins
router.get('/admin/dashboard', verifyJWT, requireRole('Admin', 'Super Admin'), (req, res) => {
  res.json({ message: 'Welcome to the Admin Dashboard' });
});

// A protected route for Moderators
router.get('/moderator/dashboard', verifyJWT, requireRole('Moderator', 'Content Moderator', 'Community Moderator'), (req, res) => {
  res.json({ message: 'Welcome to the Moderator Dashboard' });
});

// A general route accessible by all authenticated users
router.get('/user/profile', verifyJWT, (req, res) => {
  res.json({ user: req.user });
});

// A route that handles user login or sign-up
router.post('/login', handleUserLogin);

module.exports = router;