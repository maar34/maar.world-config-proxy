const express = require('express');
const router = express.Router();
const multer = require('multer');
const { verifyJWT, requireRole } = require('../utils/requireRole'); 
const { handleUserLogin } = require('../auth'); 
const User = require('../models/User'); 

// Set up multer for handling file uploads
const upload = multer();

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

// A route to get the user profile based on the userId
router.get('/getUserProfile', async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Send back the full user data
        res.json(user);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user profile route
router.post('/updateUserProfile', upload.none(), async (req, res) => {
    try {
        const { userId, username, genderIdentity, customGenderIdentity, pronouns, otherPronouns, phone } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }

        // Check if the username is already taken by another user
        const existingUser = await User.findOne({ username, _id: { $ne: userId } });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Username is already taken' });
        }

        // Find the user by userId and update their profile
        const user = await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    username,
                    'userInfo.genderIdentity': genderIdentity,
                    'userInfo.customGenderIdentity': customGenderIdentity,
                    'userInfo.pronouns': pronouns,
                    'userInfo.otherPronouns': otherPronouns,
                    phone,
                },
            },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, message: 'Profile updated successfully', user });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// A route that handles user login or sign-up
router.post('/login', handleUserLogin);

module.exports = router;
