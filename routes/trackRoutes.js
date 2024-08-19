// routes/trackRoutes.js

const express = require('express');
const router = express.Router();
const trackController = require('../controllers/TrackController');

// Route to handle track release form submission
router.post('/uploadAudioFiles', trackController.uploadAudioFiles);

module.exports = router;
