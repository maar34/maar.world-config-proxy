const jwt = require('jsonwebtoken');
const User = require('./models/User');
const mongoose = require('mongoose');

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
                    email: user.email,
                    role: user.role,
                    username: user.username,
                    genderIdentity: user.userInfo.genderIdentity || '',
                    pronouns: user.userInfo.pronouns || '',
                    otherPronouns: user.userInfo.otherPronouns || '',
                    profileImage: user.profileImage,
                    phone: user.phone,
                }
            });
        } else {
            // Create a new user with userId as the username
            const newUserId = new mongoose.Types.ObjectId();
            const newUsername = newUserId.toString(); // Use userId as the default username

            // Ensure username is set before inserting
            if (!newUsername) {
                throw new Error('Failed to generate a valid username.');
            }

            user = new User({
                userId: newUserId,
                username: newUsername, // Directly assign username here
                email,
                role: 'Listener',
                userInfo: { // Pass userInfo as an object, not an array
                    username: newUsername,
                    genderIdentity: 'Prefer not to reply', // or set based on user input
                    pronouns: 'Prefer not to say' // or set based on user input
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
                    email: user.email,
                    role: user.role,
                    username: newUsername,
                    genderIdentity: user.userInfo.genderIdentity || '',
                    pronouns: user.userInfo.pronouns || '',
                    otherPronouns: user.userInfo.otherPronouns || '',
                    profileImage: user.profileImage,
                    phone: user.phone,
                }
            });
        }
    } catch (error) {
        console.error('Error during login or sign-up:', error.message, error.stack);
        res.status(500).json({ message: 'Server error during login or sign-up', error: error.message });
    }
}

module.exports = { handleUserLogin };
