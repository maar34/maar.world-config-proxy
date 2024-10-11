// controllers/ConfigIntPlayerController.js

const ConfigIntPlayer = require('../models/ConfigIntPlayer');
//const SonicEngine = require('../models/SonicEngine');
const Exoplanet = require('../models/Exoplanet');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const User = require('../models/User'); // Ensure this is present
const mongoose = require('mongoose');

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

    // Prepare response object for uploaded file URLs
    const files = req.files || {};
    const response = {};

    // Handle the OBJ file if provided
    if (files.uploadObj && files.uploadObj.length > 0) {
      response.uploadObjURL = `/uploads/models/${req.body.ipId || 'default'}/${files.uploadObj[0].originalname}`;
    }

    // Handle the texture file if provided
    if (files.uploadTexture && files.uploadTexture.length > 0) {
      response.uploadTextureURL = `/uploads/models/${req.body.ipId || 'default'}/${files.uploadTexture[0].originalname}`;
    }

    // Check if at least one file was uploaded
    if (Object.keys(response).length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

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

// Update ConfigIntPlayer
// Update ConfigIntPlayer
exports.updateInterplanetaryPlayer = async (req, res) => {
  const { playerId } = req.params;
  console.log(`Updating Interplanetary Player ID: ${playerId}`);

  // Validate the playerId before proceeding
  if (!isValidObjectId(playerId)) {
      console.error(`Invalid Interplanetary Player ID: ${playerId}`);
      return res.status(400).json({ success: false, message: 'Invalid Interplanetary Player ID' });
  }

  try {
      // Find the player by ID
      const player = await ConfigIntPlayer.findById(playerId);
      if (!player) {
          console.log(`Player not found with ID: ${playerId}`);
          return res.status(404).json({ success: false, message: 'Player not found' });
      }

      // Check if the current user is the owner of the player
      const { ownerId } = req.body;
      if (player.ownerId !== ownerId) {
          return res.status(403).json({ success: false, message: 'You are not authorized to update this player' });
      }

      // Update player fields with data from the request body
      Object.assign(player, req.body);

      // Handle file uploads if new files are provided
      const files = req.files || {};
      if (files.uploadObj && files.uploadObj.length > 0) {
          // Update the OBJ file path only if a new file is provided
          const objPath = `/uploads/models/${playerId}/${files.uploadObj[0].originalname}`;
          player.ddd.objURL = objPath;
      }

      if (files.uploadTexture && files.uploadTexture.length > 0) {
          // Update the texture file path only if a new file is provided
          const texturePath = `/uploads/models/${playerId}/${files.uploadTexture[0].originalname}`;
          player.ddd.textureURL = texturePath;
      }

      // Save the updated player
      await player.save();

      res.status(200).json({ success: true, message: 'Interplanetary player updated successfully!', player });
  } catch (error) {
      console.error(`Error updating interplanetary player: ${error.message}`);
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
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
    //console.log('Fetching exoplanet data...');
    const exoplanets = await Exoplanet.find().lean();
   // console.log('Fetched exoplanets:', exoplanets);
    res.status(200).send(exoplanets);
  } catch (error) {
    console.error('Error fetching exoplanets:', error);
    res.status(500).send({ error: 'Error fetching exoplanets' });
  }
};

/* Fetch Sonic Engine Data
exports.fetchSonicEngineData = async (req, res) => {
  try {
   // console.log('Fetching sonic engine data...');
    const sonicEngines = await SonicEngine.find().lean();
    console.log('Fetched sonic engines:', sonicEngines);
    res.status(200).send(sonicEngines);
  } catch (error) {
    console.error('Error fetching sonic engines:', error);
    res.status(500).send({ error: 'Error fetching sonic engines' });
  }
};*/


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


// Helper function to validate ObjectId
function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

exports.getInterplanetaryPlayerById = async (req, res) => {
  const playerId = req.params.playerId;
  console.log(`Fetching details for Interplanetary Player ID: ${playerId}`);

  // Validate the playerId before proceeding
  if (!isValidObjectId(playerId)) {
      console.error(`Invalid Interplanetary Player ID: ${playerId}`);
      return res.status(400).json({ success: false, message: 'Invalid Interplanetary Player ID' });
  }

  try {
      // Fetch the player details
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

      // Prepare the player data with owner details and other needed fields
      const responseData = {
          ...player.toObject(),
          ownerDetails,
          customGenderIdentity: player.ddd.dddArtist[0]?.customGenderIdentity || null, // Include custom gender if applicable
          textureURL: player.ddd.textureURL || null, // Ensure texture URL is included
          objURL: player.ddd.objURL || null, // Ensure OBJ URL is included
          ipId: player.ipId // Include ipId for the frontend form
      };

      res.json({ success: true, player: responseData });
  } catch (error) {
      console.error(`Error fetching interplanetary player by ID: ${error.message}`);
      res.status(500).json({ success: false, message: 'Server error' });
  }
};
