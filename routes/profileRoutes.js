const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');

// Set up multer for handling file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const userId = req.body.userId;
        const uploadPath = path.join(__dirname, `../uploads/users/${userId}`);
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `profile_${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage });

// Route for fetching both public and private profiles using query parameters
router.get('/profile', async (req, res) => {
    try {
        const { userId, username } = req.query;

        if (!userId && !username) {
            return res.status(400).json({ message: 'Either User ID or Username is required' });
        }

        // Find user by either userId or username
        const user = userId 
            ? await User.findById(userId)
            : await User.findOne({ username });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Determine if it's a public profile or private profile request
        const isPrivate = !!userId;

        const responseData = {
            displayName: user.displayName,
            username: user.username,
            role: user.role,
            city: user.city,
            country: user.country,
            bio: user.bio,
            customLinks: user.customLinks,
            profileImage: user.profileImage,
            tracksOwned: user.tracksOwned,
            interplanetaryPlayersOwned: user.interplanetaryPlayersOwned,
            playlistsOwned: user.playlistsOwned,
        };

        // Add more fields for private profile
        if (isPrivate) {
            Object.assign(responseData, {
                email: user.email,
                phone: user.phone,
                profileURL: user.profileURL,
                genderIdentity: user.userInfo?.genderIdentity,
                customGenderIdentity: user.userInfo?.customGenderIdentity,
                pronouns: user.userInfo?.pronouns,
                otherPronouns: user.userInfo?.otherPronouns,
            });
        }

        res.json(responseData);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Maintain getPublicProfile route to fetch public profile based on username
router.get('/getPublicProfile', async (req, res) => {
    try {
        const username = req.query.username;

        if (!username) {
            return res.status(400).json({ message: 'Username is required' });
        }

        // Find the user by username
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        // Send the public profile data as JSON
        res.json({
            displayName: user.displayName,
            username: user.username,
            role: user.role,
            city: user.city,
            country: user.country,
            bio: user.bio,
            customLinks: user.customLinks,
            profileImage: user.profileImage,
        });
    } catch (error) {
        console.error('Error fetching public profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Route to update user profile including profile image upload
router.post('/updateUserProfile', upload.single('profileImage'), async (req, res) => {
    try {
        const { userId, username, genderIdentity, customGenderIdentity, pronouns, otherPronouns, phone, displayName, profileURL, city, country, bio, customLinks } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }

        const updateData = {
            username,
            phone,
            'userInfo.genderIdentity': genderIdentity,
            'userInfo.customGenderIdentity': customGenderIdentity,
            'userInfo.pronouns': pronouns,
            'userInfo.otherPronouns': otherPronouns,
            displayName,
            profileURL,
            city,
            country,
            bio,
            customLinks: JSON.parse(customLinks),
        };

        // Handle profile image if uploaded
        if (req.file) {
            updateData.profileImage = `/uploads/users/${userId}/${req.file.filename}`;
        }

        const user = await User.findByIdAndUpdate(userId, { $set: updateData }, { new: true });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, message: 'Profile updated successfully', user });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Route to handle public profile view based on profileURL
router.get('/:profileURL', async (req, res) => {
    try {
        const profileURL = req.params.profileURL;
        const loggedInUserId = req.userId; // Assuming userId is available in session or token

        // Find the user by profileURL
        const user = await User.findOne({ profileURL });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // If the logged-in user is viewing their own profile, redirect to the private view
        if (user._id.toString() === loggedInUserId) {
            return res.redirect('/voyage/profile');
        }

        // Render the public profile page (or return JSON)
        res.render('publicProfile', { user });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
