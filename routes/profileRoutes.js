const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Adjust the path as necessary

// Public profile route by username
router.get('/getPublicProfile', async (req, res) => {
    try {
        const username = req.query.username;

        if (!username) {
            return res.status(400).json({ message: 'Username is required' });
        }

        // Find the user by username
        const user = await User.findOne({ username: username });

        if (!user) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        // Send the public profile data as JSON
        res.json({
            displayName: user.displayName,
            username: user.username,
            userId: user.userId,
            pronouns: user.userInfo?.pronouns || '',
            otherPronouns: user.userInfo?.otherPronouns || '',
            role: user.role,
            city: user.city,
            country: user.country,
            bio: user.bio,
            customLinks: user.customLinks,
            profileImage: user.profileImage
        });
    } catch (error) {
        console.error('Error fetching public profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
