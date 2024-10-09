const mongoose = require('mongoose');
const SoundEngine = require('../models/SoundEngine');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Helper for creating directories
const ensureDirectoryExistence = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// Helper for file deletion
const deleteFilesInDirectory = (directoryPath) => {
    if (fs.existsSync(directoryPath)) {
        fs.rmSync(directoryPath, { recursive: true, force: true });
    }
};

// Multer storage configuration for dynamic paths
const getMulterStorage = (uploadPath) => {
    return multer.diskStorage({
        destination: (req, file, cb) => {
            ensureDirectoryExistence(uploadPath);
            cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
            cb(null, `${Date.now()}_${file.originalname}`);
        }
    });
};

// Dynamic upload setup (Tracks or Sound Engines)
const configureUpload = (uploadPath) => {
    return multer({
        storage: getMulterStorage(uploadPath),
        limits: { fileSize: 3 * 1024 * 1024 } // 3MB file size limit
    }).fields([
        { name: 'soundEngineImage', maxCount: 1 },
        { name: 'soundEngineFile', maxCount: 1 }
    ]);
};

// Helper to revert database and files upon error
const revertChangesOnError = async (soundEngineId, ownerId, soundEngineFolder) => {
    try {
        // Revert the SoundEngine document
        await SoundEngine.findByIdAndDelete(soundEngineId);
        // Remove the engine from the user's list using userId
        await User.findOneAndUpdate({ userId: ownerId }, { $pull: { enginesOwned: soundEngineId } });
        // Delete associated files
        deleteFilesInDirectory(soundEngineFolder);
    } catch (err) {
        console.error('Error during rollback:', err);
    }
};
// Create Sound Engine
exports.createSoundEngine = [
    configureUpload(path.join(__dirname, '../uploads/soundEngines')),
    async (req, res) => {
        try {
            const {
                ownerId,
                availability,
                developerUsername,
                soundEngineName,
                color1,
                color2,
                xParam,
                yParam,
                zParam,
                sonificationState,
                credits
            } = req.body;


            if (!ownerId || !availability || !developerUsername || !soundEngineName) {
                console.log('Missing required fields:', { ownerId, availability, developerUsername, soundEngineName });
                return res.status(400).json({ message: 'Missing required fields.' });
            }

            const parsedXParam = xParam ? JSON.parse(xParam) : {};
            const parsedYParam = yParam ? JSON.parse(yParam) : {};
            const parsedZParam = zParam ? JSON.parse(zParam) : {};

            const newSoundEngine = new SoundEngine({
                ownerId, // Use userId as a string
                availability,
                developerUsername,
                soundEngineName,
                color1,
                color2,
                xParam: parsedXParam,
                yParam: parsedYParam,
                zParam: parsedZParam,
                sonificationState,
                credits
            });

            console.log('New SoundEngine object created:', newSoundEngine);

            await newSoundEngine.save();
            const soundEngineId = newSoundEngine._id;

            console.log('Sound Engine saved with ID:', soundEngineId);

            const uploadDir = path.join(__dirname, `../uploads/soundEngines/${soundEngineId}`);
            ensureDirectoryExistence(uploadDir);
            //console.log('Upload directory ensured at:', uploadDir);

            if (req.files && req.files.soundEngineImage) {
                const imagePath = `/uploads/soundEngines/${soundEngineId}/${req.files.soundEngineImage[0].filename}`;
                const oldImagePath = req.files.soundEngineImage[0].path;
                const newImagePath = path.join(uploadDir, req.files.soundEngineImage[0].filename);
                fs.renameSync(oldImagePath, newImagePath);
                newSoundEngine.soundEngineImage = imagePath;
                console.log('Sound engine image saved at:', imagePath);
            }

            if (req.files && req.files.soundEngineFile) {
                const jsonFilePath = `/uploads/soundEngines/${soundEngineId}/${req.files.soundEngineFile[0].filename}`;
                const oldJsonFilePath = req.files.soundEngineFile[0].path;
                const newJsonFilePath = path.join(uploadDir, req.files.soundEngineFile[0].filename);
                fs.renameSync(oldJsonFilePath, newJsonFilePath);
                newSoundEngine.soundEngineFile = jsonFilePath;
                console.log('Sound engine file saved at:', jsonFilePath);
            }

            await newSoundEngine.save();
            console.log('Sound Engine object after file updates:', newSoundEngine);

            // Update user's enginesOwned
            const updatedUser = await User.findOneAndUpdate(
                { userId: ownerId }, // Match by userId
                { $push: { enginesOwned: soundEngineId } },
                { new: true }
            );

         //   console.log('Updated User after adding engine:', updatedUser);

            res.status(201).json({ success: true, message: 'Sound Engine created successfully!', soundEngine: newSoundEngine });
        } catch (error) {
            console.error('Error creating sound engine:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
];


exports.updateSoundEngine = [
    configureUpload(path.join(__dirname, '../uploads/soundEngines')),
    async (req, res) => {
        console.log('Received method:', req.method); // Should log 'PATCH'
        console.log('SoundEngine ID:', req.params.soundEngineId); // Should show the correct ID

        try {
            const { soundEngineId } = req.params;
            const { ownerId, existingImagePath, existingJsonFilePath } = req.body;

            console.log('Update request received with ID:', soundEngineId);
            console.log('Request body data:', req.body);

            // Find the sound engine by ID
            const soundEngine = await SoundEngine.findById(soundEngineId);
            if (!soundEngine) {
                console.log('SoundEngine not found for update:', soundEngineId);
                return res.status(404).json({ message: 'Sound Engine not found' });
            }
                        // Ensure only the owner can update
            if (soundEngine.ownerId !== ownerId) {
                return res.status(403).json({ message: 'You do not have permission to edit this sound engine' });
            }

            // Prepare the updates object with fallbacks for existing values
            const updates = {
                availability: req.body.availability || soundEngine.availability,
                developerUsername: req.body.developerUsername || soundEngine.developerUsername,
                soundEngineName: req.body.soundEngineName || soundEngine.soundEngineName,
                color1: req.body.color1 || soundEngine.color1,
                color2: req.body.color2 || soundEngine.color2,
                sonificationState: req.body.sonificationState !== undefined ? req.body.sonificationState : soundEngine.sonificationState,
                credits: req.body.credits || soundEngine.credits,
                xParam: req.body.xParam ? JSON.parse(req.body.xParam) : soundEngine.xParam,
                yParam: req.body.yParam ? JSON.parse(req.body.yParam) : soundEngine.yParam,
                zParam: req.body.zParam ? JSON.parse(req.body.zParam) : soundEngine.zParam
            };

            // Handle image and JSON file updates
            updates.soundEngineImage = req.files?.soundEngineImage?.[0]
                ? `/uploads/soundEngines/${soundEngineId}/${req.files.soundEngineImage[0].filename}`
                : existingImagePath || soundEngine.soundEngineImage;

            updates.soundEngineFile = req.files?.soundEngineFile?.[0]
                ? `/uploads/soundEngines/${soundEngineId}/${req.files.soundEngineFile[0].filename}`
                : existingJsonFilePath || soundEngine.soundEngineFile;

            console.log('Updates being applied:', updates);

            // Update the sound engine in the database
            const updatedSoundEngine = await SoundEngine.findByIdAndUpdate(
                soundEngineId,
                updates,
                { new: true }
            );

            res.json({ success: true, message: 'Sound Engine updated successfully!', soundEngine: updatedSoundEngine });
        } catch (error) {
            console.error('Error updating sound engine:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
];


// Delete Sound Engine
exports.deleteSoundEngine = async (req, res) => {
    try {
        const { soundEngineId } = req.params;

        const soundEngine = await SoundEngine.findByIdAndDelete(soundEngineId);

        if (!soundEngine) {
            return res.status(404).json({ success: false, message: 'Sound Engine not found' });
        }

        // Remove the sound engine from the user's list using userId
        await User.findOneAndUpdate(
            { userId: soundEngine.ownerId },
            { $pull: { enginesOwned: soundEngineId } }
        );

        // Clean up associated files in the soundEngineId folder
        const soundEngineFolder = path.join(__dirname, `../uploads/soundEngines/${soundEngineId}`);
        deleteFilesInDirectory(soundEngineFolder);

        res.json({ success: true, message: 'Sound Engine deleted successfully' });
    } catch (error) {
        console.error('Error deleting sound engine:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Fetch Sound Engine by ID

exports.getSoundEngineById = async (req, res) => {
    try {
        const { soundEngineId } = req.params;
        console.log('Fetching details for soundEngineId:', soundEngineId);

        const soundEngine = await SoundEngine.findById(soundEngineId);
        if (!soundEngine) {
            console.log('Sound Engine not found with ID:', soundEngineId);
            return res.status(404).json({ success: false, message: 'Sound Engine not found' });
        }

        console.log('Found sound engine:', soundEngine);
        res.json({ success: true, soundEngine });
    } catch (error) {
        console.error('Error fetching sound engine by ID:', error);
        res.status(400).json({ success: false, message: 'Bad request' });
    }
};


// Fetch all sound engines owned by a user
exports.getSoundEnginesByOwner = async (req, res) => {
    try {
        // Extract the ownerId and username from the query parameters
        const { ownerId, username } = req.query;
        console.log('Received request with ownerId:', ownerId);
        console.log('Received request with username:', username);

        // Check if neither ownerId nor username was provided, and return a 400 error if true
        if (!ownerId && !username) {
            console.log('Either Owner ID or Username must be provided.');
            return res.status(400).json({ success: false, message: 'Either Owner ID or Username is required' });
        }

        // Build the user query based on the presence of ownerId or username
        const userQuery = ownerId ? { userId: ownerId } : { username };
        console.log('Searching for user with query:', userQuery);

        // Find the user in the database using the userQuery
        const user = await User.findOne(userQuery).select('userId username displayName profileImage enginesOwned');
        if (!user) {
            console.log('User not found for query:', userQuery);
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        console.log('Found user:', user);

        // Use the `enginesOwned` array from the user to find the corresponding sound engines
        console.log('Engines owned by user:', user.enginesOwned);
        const soundEngines = await SoundEngine.find({ _id: { $in: user.enginesOwned } }).sort({ createdAt: -1 });
        console.log('Found sound engines:', soundEngines);

        // Attach user details to each sound engine for the response
        const soundEnginesWithUser = soundEngines.map(engine => ({
            ...engine.toObject(),
            ownerDetails: {
                userId: user.userId,
                username: user.username,
                displayName: user.displayName,
                profileImage: user.profileImage
            }
        }));

        // Send the response with the sound engines and user details
        console.log('Returning sound engines with user details:', soundEnginesWithUser);
        res.json({ success: true, soundEngines: soundEnginesWithUser });
    } catch (error) {
        // Log the error and send a 500 response in case of an exception
        console.error('Error fetching sound engines:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
