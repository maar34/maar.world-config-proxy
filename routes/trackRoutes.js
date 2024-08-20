const express = require('express');
const router = express.Router();
const trackController = require('../controllers/TrackController'); // Ensure this path is correct

// Route to handle track metadata submission
router.post('/submitTrackData', trackController.submitTrackData);

// Route to handle audio file uploads
router.post('/uploadTrackFiles/:trackId', trackController.uploadTrackFiles);

module.exports = router;
