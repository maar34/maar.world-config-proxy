const ConfigIntPlayer = require('../models/ConfigIntPlayer');
const SonicEngine = require('../models/SonicEngine');
const Exoplanet = require('../models/Exoplanet');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

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
    const config = new ConfigIntPlayer(req.body);
    await config.save();
    res.status(201).send(config);
  } catch (err) {
    res.status(400).send(err);
  }
};

exports.getConfigIntPlayers = async (req, res) => {
  try {
    const configs = await ConfigIntPlayer.find();
    res.status(200).send(configs);
  } catch (err) {
    res.status(400).send(err);
  }
};

exports.fetchExoplanetData = async (req, res) => {
  try {
    console.log('Fetching exoplanet data');
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
    console.log('Fetching sonic engines');
    const sonicEngines = await SonicEngine.find().lean();
    console.log('Fetched sonic engines:', sonicEngines);
    res.status(200).send(sonicEngines);
  } catch (error) {
    console.error('Error fetching sonic engines:', error);
    res.status(500).send({ error: 'Error fetching sonic engines' });
  }
};
