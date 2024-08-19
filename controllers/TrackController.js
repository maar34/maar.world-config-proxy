// controllers/TrackController.js

const Track = require('../models/Track');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

// Create directory if it doesn't exist
const createUploadPath = (uploadPath) => {
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(__dirname, '../uploads/tracks');
      createUploadPath(uploadPath);
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}_${file.originalname}`);
    }
  });
  
  const upload = multer({ 
    storage: storage,
    limits: { fileSize: 200 * 1024 * 1024 }  // 200 MB limit for each file
  }).fields([
    { name: 'audioFileWAV', maxCount: 1 },
    { name: 'audioFileMP3', maxCount: 1 }
  ]);
  
// Upload audio files and save track details
exports.uploadAudioFiles = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error('Error during file upload:', err);
      return res.status(500).json({ error: err.message });
    }

    try {
      const files = req.files;
      const trackData = {
        exoplanet: req.body.exoplanet,
        artistName: req.body.artistName,
        songName: req.body.songName,
        audioFileWAV: `/uploads/tracks/${files.audioFileWAV[0].filename}`,
        audioFileMP3: `/uploads/tracks/${files.audioFileMP3[0].filename}`,
        type: req.body.type,
        genre: req.body.genre,
        mood: req.body.mood,
        additionalTags: req.body.additionalTags,
        description: req.body.description,
        credits: req.body.credits,
        privacy: req.body.privacy,
        releaseDate: req.body.releaseDate,
        licence: req.body.licence,
        enableDirectDownloads: req.body.enableDirectDownloads === 'on' ? true : false
      };

      const newTrack = new Track(trackData);
      await newTrack.save();

      res.status(201).json({ message: 'Track saved successfully', track: newTrack });
    } catch (error) {
      console.error('Error saving track:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
};
