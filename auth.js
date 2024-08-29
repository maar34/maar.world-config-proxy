const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('./models/User'); // Adjust the path as needed

// Function to handle user login or sign-up
async function handleUserLogin(req, res) {
    const { email } = req.body;

    try {
        if (!email) {
            throw new Error('Email is required.');
        }

        let user = await User.findOne({ email });

        if (user) {
            // User exists, proceed with login
            const payload = {
                id: user._id,
                email: user.email,
                role: user.role
            };

            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

            res.status(200).json({
                message: 'User logged in successfully',
                token,
                user: {
                    id: user._id,  // Include userId
                    email: user.email,
                    role: user.role,
                    username: user.username,
                    genderIdentity: user.userInfo.genderIdentity,
                    pronouns: user.userInfo.pronouns,
                    otherPronouns: user.userInfo.otherPronouns,
                    profileImage: user.profileImage,
                    phone: user.phone,
                    displayName: user.displayName,   // Include displayName
                    profileURL: user.profileURL      // Include profileURL
                }
            });
        } else {
            // Create a new user
            const newUserId = new mongoose.Types.ObjectId();
            const newUsername = newUserId.toString(); // Use userId as the default username

            user = new User({
                userId: newUserId,
                username: newUsername, // Directly assign username here
                email,
                role: 'Listener',
                displayName: newUsername, // Assign displayName as userId
                profileURL: `maar.world/xplorer/${newUsername}`, // Assign profileURL based on userId
                userInfo: { // Pass userInfo as an object
                    username: newUsername,
                    genderIdentity: 'Prefer not to reply',
                    pronouns: 'Prefer not to say'
                }
            });

            // Log user object before saving
            console.log('Saving new user:', user);

            await user.save();

            const payload = {
                id: user._id,
                email: user.email,
                role: user.role
            };

            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

            res.status(201).json({
                message: 'User signed up successfully',
                token,
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.role,
                    username: user.username,
                    genderIdentity: user.userInfo.genderIdentity,
                    pronouns: user.userInfo.pronouns,
                    otherPronouns: user.userInfo.otherPronouns,
                    profileImage: user.profileImage,
                    phone: user.phone,
                    displayName: user.displayName,   // Include displayName
                    profileURL: user.profileURL      // Include profileURL
                }
            });
        }
    } catch (error) {
        console.error('Error during login or sign-up:', error.message, error.stack);
        res.status(500).json({ message: 'Server error during login or sign-up', error: error.message });
    }
}

module.exports = { handleUserLogin };
