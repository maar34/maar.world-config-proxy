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

        // Find user by either userId (Supabase UUID) or username
        const user = userId 
            ? await User.findOne({ userId })  // Fetch by userId (string) instead of _id
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

// Check if a username is unique
router.get('/checkUsername', async (req, res) => {
    try {
        const { username } = req.query;

        // Log the received request
        console.log(`Received request to check username uniqueness for: ${username}`);

        // Check if username is missing
        if (!username) {
            console.log('Username parameter is missing in the request.');
            return res.status(400).json({ isUnique: false, message: 'Username is required' });
        }

        // Log query before attempting to find the user
        console.log(`Querying the database for username: ${username}`);

        // Find the user by username
        const user = await User.findOne({ username });

        // Log result of database query
        if (user) {
            console.log(`Username is already taken: ${username}`);
            return res.status(200).json({ isUnique: false });
        }

        // If no user is found, the username is unique
        console.log(`Username is available: ${username}`);
        res.status(200).json({ isUnique: true });
    } catch (error) {
        // Log any unexpected error
        console.error('Error checking username uniqueness:', error);
        res.status(500).json({ isUnique: false, message: 'Server error' });
    }
});



// Maintain getPublicProfile route to fetch public profile based on username
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

        // Use findOneAndUpdate to update based on userId (string UUID from Supabase)
        const user = await User.findOneAndUpdate({ userId }, { $set: updateData }, { new: true });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, message: 'Profile updated successfully', user });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


// Search for users by displayName or username
router.get('/searchUsers', async (req, res) => {
    try {
        const { query } = req.query;

        // Log the received query
        console.log(`Received /searchUsers request with query: "${query}"`);

        // Check if query is missing
        if (!query) {
            console.log('Query parameter is missing.');
            return res.status(400).json({ message: 'Query parameter is required' });
        }

        // Construct a case-insensitive regex for the search
        const regex = new RegExp(query, 'i');
        
        console.log('Searching database with regex:', regex);

        // Search for users by username or displayName using the regex
        const users = await User.find({
            $or: [
                { username: { $regex: regex } },
                { displayName: { $regex: regex } }
            ]
        })
        .select('username displayName profileImage')
        .limit(10);

        // Log the results of the search
        console.log(`Found ${users.length} user(s) matching the query.`);

        // Handle no results found
        if (users.length === 0) {
            console.log('No users found for the query:', query);
            return res.status(404).json({ message: 'User not found' });
        }

        // Return the list of found users
        res.status(200).json(users);
    } catch (error) {
        // Log any error encountered during the search
        console.error('Error in /searchUsers:', error);
        res.status(500).json({ message: 'Internal server error' });
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
