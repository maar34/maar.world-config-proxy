const mongoose = require('mongoose');
const User = require('./models/User'); // Adjust the path as needed
const jwt = require('jsonwebtoken');

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
                    displayName: user.displayName,
                    profileURL: user.profileURL
                }
            });
        } else {
            // Generate the new ObjectId first
            const newUserId = new mongoose.Types.ObjectId();
            const newUserIdString = newUserId.toString();

            // Create a new user with all required fields initialized
            user = new User({
                _id: newUserId,               // Set _id explicitly
                userId: newUserIdString,      // Set userId as string representation of _id
                username: newUserIdString,    // Set username as string representation of _id
                displayName: newUserIdString, // Set displayName as string representation of _id
                profileURL: `maar.world/xplorer/${newUserIdString}`, // Set profileURL based on _id
                email,
                role: 'Listener',
                userInfo: {
                    genderIdentity: 'Prefer not to reply',
                    pronouns: 'Prefer not to say'
                }
            });

            // Log user object before saving
            console.log('Saving new user:', user);

            // Save the user
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
                    displayName: user.displayName,
                    profileURL: user.profileURL
                }
            });
        }
    } catch (error) {
        console.error('Error during login or sign-up:', error.message, error.stack);
        res.status(500).json({ message: 'Server error during login or sign-up', error: error.message });
    }
}

module.exports = { handleUserLogin };
