// controllers/ConfigIntPlayerController.js

const ConfigIntPlayer = require('../models/ConfigIntPlayer');
const SonicEngine = require('../models/SonicEngine');
const Exoplanet = require('../models/Exoplanet');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const User = require('../models/User'); // Ensure this is present

// Create directory if it doesn't exist
const createUploadPath = (uploadPath) => {
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }
};

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const ipId = req.body.ipId || 'default';
    const uploadPath = path.join(__dirname, '../uploads/models', ipId); // Store in models directory
    createUploadPath(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Keep the original file name
  }
});

// Multer upload configuration
const upload = multer({ storage: storage }).fields([
  { name: 'uploadObj', maxCount: 1 },
  { name: 'uploadTexture', maxCount: 1 }
]);

// Handle file uploads
exports.uploadModelFiles = (req, res) => {
  console.log('Upload Files Endpoint Hit');
  upload(req, res, (err) => {
    if (err) {
      console.error('Error during file upload:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('Files received:', req.files);
    const files = req.files;
    const response = {
      uploadObjURL: `/uploads/models/${req.body.ipId || 'default'}/${files.uploadObj[0].originalname}`,
      uploadTextureURL: `/uploads/models/${req.body.ipId || 'default'}/${files.uploadTexture[0].originalname}`
    };
    res.json(response);
  });
};

// Create ConfigIntPlayer
exports.createConfigIntPlayer = async (req, res) => {
  try {
    console.log('Received request body:', req.body); // Add this line for debugging

    const { ownerId } = req.body;

    if (!ownerId) {
      return res.status(400).json({ error: 'Owner ID is required' });
    }

    // Create new ConfigIntPlayer (interplanetary player)
    const config = new ConfigIntPlayer({
      ...req.body,
      ownerId // Ensure ownerId is a UUID string
    });
    await config.save();

    // Update the user with the new interplanetary player
    const updatedUser = await User.findOneAndUpdate(
      { userId: ownerId }, // Query by userId
      { $push: { interplanetaryPlayersOwned: config._id } },
      { new: true } // Return the updated document
    );

    if (!updatedUser) {
      // Optionally handle the case where the user isn't found
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(201).json({ success: true, message: 'Interplanetary player created successfully!', config });
  } catch (err) {
    console.error('Error creating interplanetary player:', err);
    res.status(400).send({ error: err.message });
  }
};

// Get all ConfigIntPlayers
exports.getConfigIntPlayers = async (req, res) => {
  try {
    const configs = await ConfigIntPlayer.find().populate('ownerId', 'userId'); // Optional: Populate owner details
    res.status(200).send(configs);
  } catch (err) {
    console.error('Error fetching configuration:', err);
    res.status(400).send({ error: err.message });
  }
};

// Fetch Exoplanet Data
exports.fetchExoplanetData = async (req, res) => {
  try {
    console.log('Fetching exoplanet data...');
    const exoplanets = await Exoplanet.find().lean();
    console.log('Fetched exoplanets:', exoplanets);
    res.status(200).send(exoplanets);
  } catch (error) {
    console.error('Error fetching exoplanets:', error);
    res.status(500).send({ error: 'Error fetching exoplanets' });
  }
};

// Fetch Sonic Engine Data
exports.fetchSonicEngineData = async (req, res) => {
  try {
    console.log('Fetching sonic engine data...');
    const sonicEngines = await SonicEngine.find().lean();
    console.log('Fetched sonic engines:', sonicEngines);
    res.status(200).send(sonicEngines);
  } catch (error) {
    console.error('Error fetching sonic engines:', error);
    res.status(500).send({ error: 'Error fetching sonic engines' });
  }
};

// Delete ConfigIntPlayer
exports.deleteConfigIntPlayer = async (req, res) => {
  try {
    const { playerId } = req.params;

    // Find and delete the interplanetary player
    const player = await ConfigIntPlayer.findByIdAndDelete(playerId);

    if (!player) {
      return res.status(404).json({ success: false, message: 'Interplanetary player not found' });
    }

    // Remove the player from the user's interplanetaryPlayersOwned array
    const updatedUser = await User.findOneAndUpdate(
      { userId: player.ownerId }, // Query by userId
      { $pull: { interplanetaryPlayersOwned: playerId } },
      { new: true } // Return the updated document
    );

    if (!updatedUser) {
      // Optionally handle the case where the user isn't found
      console.warn(`User with userId ${player.ownerId} not found while deleting player.`);
    }

    // Optionally, clean up any associated files (e.g., models, textures)
    const playerFolder = path.join(__dirname, `../uploads/models/${playerId}`);
    if (fs.existsSync(playerFolder)) {
      fs.rmSync(playerFolder, { recursive: true, force: true });
    }

    res.json({ success: true, message: 'Interplanetary player deleted successfully' });
  } catch (error) {
    console.error('Error deleting interplanetary player:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// controllers/ConfigIntPlayerController.js

exports.getInterplanetaryPlayerById = async (req, res) => {
  const playerId = req.params.playerId;
  console.log(`Fetching details for Interplanetary Player ID: ${playerId}`);
  
  try {
      const player = await ConfigIntPlayer.findById(playerId);
      if (!player) {
          console.log(`Player not found with ID: ${playerId}`);
          return res.status(404).json({ success: false, message: 'Player not found' });
      }

      // Fetch owner details if needed
      const owner = await User.findOne({ userId: player.ownerId }, 'username displayName profileImage');
      const ownerDetails = owner ? {
          username: owner.username,
          displayName: owner.displayName,
          profileImage: owner.profileImage
      } : null;

      console.log('Found interplanetary player:', player);
      console.log('Owner details:', ownerDetails);

      // Add ownerDetails to the response if it exists
      res.json({ success: true, player: { ...player.toObject(), ownerDetails } });
  } catch (error) {
      console.error(`Error fetching interplanetary player by ID: ${error.message}`);
      res.status(500).json({ success: false, message: 'Server error' });
  }
};
