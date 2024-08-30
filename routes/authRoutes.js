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

        const { username, email, role, phone, profileImage, userInfo, displayName, profileURL, city, country, bio, customLinks } = user;
        res.json({
            username,
            email,
            role,
            phone,
            profileImage,
            genderIdentity: userInfo?.genderIdentity,
            customGenderIdentity: userInfo?.customGenderIdentity,
            pronouns: userInfo?.pronouns,
            otherPronouns: userInfo?.otherPronouns,
            displayName, // New field
            profileURL, // New field
            city, // New field
            country, // New field
            bio, // New field
            customLinks // New field
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user profile route including profile image upload
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
            displayName, // New field
            profileURL, // New field
            city, // New field
            country, // New field
            bio, // New field
            customLinks: JSON.parse(customLinks) // Parse JSON string to array
        };

        // Handle profile image if uploaded
        if (req.file) {
            updateData.profileImage = `/uploads/users/${userId}/${req.file.filename}`;
        }

        const user = await User.findByIdAndUpdate(userId, {
            $set: updateData,
        }, { new: true });

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
            if (user.userId.toString() === loggedInUserId) {
                return res.redirect('/voyage/profile');
            }

            // Return the public profile information
            res.render('publicProfile', { user });
        } catch (error) {
            console.error('Error fetching user profile:', error);
            res.status(500).json({ message: 'Server error' });
        }
    });


module.exports = router;
