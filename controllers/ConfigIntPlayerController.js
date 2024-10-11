const ConfigIntPlayer = require('../models/ConfigIntPlayer');
const Exoplanet = require('../models/Exoplanet');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const User = require('../models/User');
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
    const uploadPath = path.join(__dirname, '../uploads/models', ipId);
    createUploadPath(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
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

    const files = req.files || {};
    const response = {};

    if (files.uploadObj && files.uploadObj.length > 0) {
      response.uploadObjURL = `/uploads/models/${req.body.ipId || 'default'}/${files.uploadObj[0].originalname}`;
    }

    if (files.uploadTexture && files.uploadTexture.length > 0) {
      response.uploadTextureURL = `/uploads/models/${req.body.ipId || 'default'}/${files.uploadTexture[0].originalname}`;
    }

    if (Object.keys(response).length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    res.json(response);
  });
};

// Create ConfigIntPlayer
exports.createConfigIntPlayer = async (req, res) => {
  try {
    console.log('Received request body:', req.body);
    const { ownerId } = req.body;

    if (!ownerId) {
      return res.status(400).json({ error: 'Owner ID is required' });
    }

    const config = new ConfigIntPlayer({
      ...req.body,
      ownerId
    });
    await config.save();

    const updatedUser = await User.findOneAndUpdate(
      { userId: ownerId },
      { $push: { interplanetaryPlayersOwned: config._id } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(201).json({ success: true, message: 'Interplanetary player created successfully!', config });
  } catch (err) {
    console.error('Error creating interplanetary player:', err);
    res.status(400).send({ error: err.message });
  }
};

// Update ConfigIntPlayer
exports.updateInterplanetaryPlayer = async (req, res) => {
  const { playerId } = req.params;
  console.log(`Updating Interplanetary Player ID: ${playerId}`);

  if (!isValidObjectId(playerId)) {
    console.error(`Invalid Interplanetary Player ID: ${playerId}`);
    return res.status(400).json({ success: false, message: 'Invalid Interplanetary Player ID' });
  }

  try {
    const player = await ConfigIntPlayer.findById(playerId);
    if (!player) {
      return res.status(404).json({ success: false, message: 'Player not found' });
    }

    const { ownerId } = req.body;
    if (player.ownerId !== ownerId) {
      return res.status(403).json({ success: false, message: 'You are not authorized to update this player' });
    }

    Object.assign(player, req.body);

    const files = req.files || {};
    if (files.uploadObj && files.uploadObj.length > 0) {
      const objPath = `/uploads/models/${playerId}/${files.uploadObj[0].originalname}`;
      player.ddd.objURL = objPath;
    }

    if (files.uploadTexture && files.uploadTexture.length > 0) {
      const texturePath = `/uploads/models/${playerId}/${files.uploadTexture[0].originalname}`;
      player.ddd.textureURL = texturePath;
    }

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
    const configs = await ConfigIntPlayer.find().populate('ownerId', 'userId');
    res.status(200).send(configs);
  } catch (err) {
    console.error('Error fetching configuration:', err);
    res.status(400).send({ error: err.message });
  }
};

// Fetch Exoplanet Data
exports.fetchExoplanetData = async (req, res) => {
  try {
    const exoplanets = await Exoplanet.find().lean();
    res.status(200).send(exoplanets);
  } catch (error) {
    console.error('Error fetching exoplanets:', error);
    res.status(500).send({ error: 'Error fetching exoplanets' });
  }
};

// Delete ConfigIntPlayer
exports.deleteConfigIntPlayer = async (req, res) => {
  try {
    const { playerId } = req.params;

    const player = await ConfigIntPlayer.findByIdAndDelete(playerId);
    if (!player) {
      return res.status(404).json({ success: false, message: 'Interplanetary player not found' });
    }

    const updatedUser = await User.findOneAndUpdate(
      { userId: player.ownerId },
      { $pull: { interplanetaryPlayersOwned: playerId } },
      { new: true }
    );

    if (!updatedUser) {
      console.warn(`User with userId ${player.ownerId} not found while deleting player.`);
    }

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

// Helper function to validate ObjectId
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

exports.getInterplanetaryPlayerById = async (req, res) => {
  const playerId = req.params.playerId;
  console.log(`Fetching details for Interplanetary Player ID: ${playerId}`);

  if (!isValidObjectId(playerId)) {
    console.error(`Invalid Interplanetary Player ID: ${playerId}`);
    return res.status(400).json({ success: false, message: 'Invalid Interplanetary Player ID' });
  }

  try {
    const player = await ConfigIntPlayer.findById(playerId);
    if (!player) {
      return res.status(404).json({ success: false, message: 'Player not found' });
    }

    const owner = await User.findOne({ userId: player.ownerId }, 'username displayName profileImage');
    const ownerDetails = owner ? {
      username: owner.username,
      displayName: owner.displayName,
      profileImage: owner.profileImage
    } : null;

    const responseData = {
      ...player.toObject(),
      ownerDetails,
      dddArtist: player.ddd.dddArtist || '', // Handle dddArtist as a simple string
      textureURL: player.ddd.textureURL || null,
      objURL: player.ddd.objURL || null,
      ipId: player.ipId
    };

    res.json({ success: true, player: responseData });
  } catch (error) {
    console.error(`Error fetching interplanetary player by ID: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
