const ConfigIntPlayer = require('../models/ConfigIntPlayer');
const SonicEngine = require('../models/SonicEngine');
const Exoplanet = require('../models/Exoplanet');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const User = require('../models/User'); // Add this if not already present

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

// Other methods remain unchanged
exports.createConfigIntPlayer = async (req, res) => {
  try {
    const { ownerId } = req.body;

    if (!ownerId) {
      return res.status(400).json({ error: 'Owner ID is required' });
    }

    // Create new ConfigIntPlayer (interplanetary player)
    const config = new ConfigIntPlayer(req.body);
    await config.save();

    // Update the user with the new interplanetary player
    await User.findByIdAndUpdate(ownerId, { $push: { interplanetaryPlayersOwned: config._id } });

    res.status(201).json({ success: true, message: 'Interplanetary player created successfully!', config });
  } catch (err) {
    console.error('Error creating interplanetary player:', err);
    res.status(400).send(err);
  }
};

exports.getConfigIntPlayers = async (req, res) => {
  try {
    const configs = await ConfigIntPlayer.find();
    res.status(200).send(configs);
  } catch (err) {
    console.error('Error creating configuration:', error);
    res.status(400).send(err);
  }
};

exports.fetchExoplanetData = async (req, res) => {
  try {
   // console.log('Fetching exoplanet data');
    const exoplanets = await Exoplanet.find().lean();
    console.log('Fetched exoplanets:', exoplanets);
    res.status(200).send(exoplanets);
  } catch (error) {
    console.error('Error fetching exoplanets:', error);
    res.status(500).send({ error: 'Error fetching exoplanets' });
  }
};

exports.fetchSonicEngineData = async (req, res) => {
  try {
   // console.log('Fetching sonic engines');
    const sonicEngines = await SonicEngine.find().lean();
    console.log('Fetched sonic engines:', sonicEngines);
    res.status(200).send(sonicEngines);
  } catch (error) {
    console.error('Error fetching sonic engines:', error);
    res.status(500).send({ error: 'Error fetching sonic engines' });
  }
};


exports.deleteConfigIntPlayer = async (req, res) => {
  try {
    const { playerId } = req.params;

    // Find and delete the interplanetary player
    const player = await ConfigIntPlayer.findByIdAndDelete(playerId);

    if (!player) {
      return res.status(404).json({ success: false, message: 'Interplanetary player not found' });
    }

    // Remove the player from the user's interplanetaryPlayersOwned array
    await User.findByIdAndUpdate(player.ownerId, {
      $pull: { interplanetaryPlayersOwned: playerId }
    });

    // Optionally, clean up any associated files (e.g., models, textures)
    const playerFolder = path.join(__dirname, `../uploads/models/${playerId}`);
    if (fs.existsSync(playerFolder)) {
      fs.rmSync(playerFolder, { recursive: true, force: true });
    }

    res.json({ success: true, message: 'Interplanetary player deleted successfully' });
  } catch (error) {
    console.error('Error deleting interplanetary player:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
