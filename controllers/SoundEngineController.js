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
        // Remove the engine from the user's list
        await User.findByIdAndUpdate(ownerObjectId, { $push: { enginesOwned: soundEngineId } });
        // Delete associated files
        deleteFilesInDirectory(soundEngineFolder);
    } catch (err) {
        console.error('Error during rollback:', err);
    }
};

// Create Sound Engine
exports.createSoundEngine = [
    configureUpload(path.join(__dirname, '../uploads/soundEngines')), // Multer upload configuration
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

            const ownerObjectId = new mongoose.Types.ObjectId(ownerId);

            if (!ownerId || !availability || !developerUsername || !soundEngineName) {
                return res.status(400).json({ message: 'Missing required fields.' });
            }

            const parsedXParam = xParam ? JSON.parse(xParam) : {};
            const parsedYParam = yParam ? JSON.parse(yParam) : {};
            const parsedZParam = zParam ? JSON.parse(zParam) : {};

            const newSoundEngine = new SoundEngine({
                ownerId: ownerObjectId,
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

            await newSoundEngine.save();
            const soundEngineId = newSoundEngine._id;

            const uploadDir = path.join(__dirname, `../uploads/soundEngines/${soundEngineId}`);
            ensureDirectoryExistence(uploadDir);

            if (req.files && req.files.soundEngineImage) {
                const imagePath = `/uploads/soundEngines/${soundEngineId}/${req.files.soundEngineImage[0].filename}`;
                const oldImagePath = req.files.soundEngineImage[0].path;
                const newImagePath = path.join(uploadDir, req.files.soundEngineImage[0].filename);
                fs.renameSync(oldImagePath, newImagePath);
                newSoundEngine.soundEngineImage = imagePath;
            }

            if (req.files && req.files.soundEngineFile) {
                const jsonFilePath = `/uploads/soundEngines/${soundEngineId}/${req.files.soundEngineFile[0].filename}`;
                const oldJsonFilePath = req.files.soundEngineFile[0].path;
                const newJsonFilePath = path.join(uploadDir, req.files.soundEngineFile[0].filename);
                fs.renameSync(oldJsonFilePath, newJsonFilePath);
                newSoundEngine.soundEngineFile = jsonFilePath;
            }

            await newSoundEngine.save();

            // Update user with the new sound engine
            const updatedUser = await User.findByIdAndUpdate(ownerObjectId, { $push: { enginesOwned: soundEngineId } }, { new: true });
            console.log('Updated User after adding engine:', updatedUser);

            res.status(201).json({ success: true, message: 'Sound Engine created successfully!', soundEngine: newSoundEngine });
        } catch (error) {
            console.error('Error creating sound engine:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
];

// Update Sound Engine
// Update Sound Engine
exports.updateSoundEngine = [
    configureUpload(path.join(__dirname, '../uploads/soundEngines')), // Multer upload
    async (req, res) => {
        try {
            const { soundEngineId } = req.params;
            const { ownerId, existingImagePath, existingJsonFilePath } = req.body;

            const soundEngine = await SoundEngine.findById(soundEngineId);
            if (!soundEngine) {
                return res.status(404).json({ message: 'Sound Engine not found' });
            }

            // Ensure only the owner can update
            if (soundEngine.ownerId.toString() !== ownerId) {
                return res.status(403).json({ message: 'You do not have permission to edit this sound engine' });
            }

            // Update fields
            if (req.body.availability) soundEngine.availability = req.body.availability;
            if (req.body.developerUsername) soundEngine.developerUsername = req.body.developerUsername;
            if (req.body.soundEngineName) soundEngine.soundEngineName = req.body.soundEngineName;
            if (req.body.color1) soundEngine.color1 = req.body.color1;
            if (req.body.color2) soundEngine.color2 = req.body.color2;
            if (req.body.xParam) soundEngine.xParam = JSON.parse(req.body.xParam);
            if (req.body.yParam) soundEngine.yParam = JSON.parse(req.body.yParam);
            if (req.body.zParam) soundEngine.zParam = JSON.parse(req.body.zParam);
            if (req.body.sonificationState) soundEngine.sonificationState = req.body.sonificationState;
            if (req.body.credits) soundEngine.credits = req.body.credits;

            // Handle file uploads or use existing paths
            if (req.files && req.files.soundEngineImage) {
                soundEngine.soundEngineImage = `/uploads/soundEngines/${soundEngineId}/${req.files.soundEngineImage[0].filename}`;
            } else if (existingImagePath && !req.files.soundEngineImage) {
                soundEngine.soundEngineImage = existingImagePath; // Use existing image path if no new image is uploaded
            }

            if (req.files && req.files.soundEngineFile) {
                soundEngine.soundEngineFile = `/uploads/soundEngines/${soundEngineId}/${req.files.soundEngineFile[0].filename}`;
            } else if (existingJsonFilePath && !req.files.soundEngineFile) {
                soundEngine.soundEngineFile = existingJsonFilePath; // Use existing JSON file path if no new file is uploaded
            }

            const updatedSoundEngine = await soundEngine.save();
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

        // Remove the sound engine from the user's list
        await User.findByIdAndUpdate(soundEngine.ownerId, { $pull: { enginesOwned: soundEngineId } });


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
// Fetch Sound Engine by ID
exports.getSoundEngineById = async (req, res) => {
    try {
        const { soundEngineId } = req.params;

        const soundEngine = await SoundEngine.findById(soundEngineId)
            .populate('ownerId', 'username displayName profileImage');

        if (!soundEngine) {
            return res.status(404).json({ success: false, message: 'Sound Engine not found' });
        }

        // Optionally check if the current user is the owner if you have authentication
        // const isOwner = soundEngine.ownerId._id.toString() === req.user.id; // Assuming req.user.id is available from authentication

        res.json({ success: true, soundEngine });
    } catch (error) {
        console.error('Error fetching sound engine:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


// Fetch all sound engines owned by a user
exports.getSoundEnginesByOwner = async (req, res) => {
    try {
        const { ownerId } = req.query;

        if (!ownerId) {
            return res.status(400).json({ success: false, message: 'Owner ID is required' });
        }

        const soundEngines = await SoundEngine.find({ ownerId })
            .populate('ownerId', 'username displayName profileImage')
            .sort({ createdAt: -1 });

        res.json({ success: true, soundEngines });
    } catch (error) {
        console.error('Error fetching sound engines:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
