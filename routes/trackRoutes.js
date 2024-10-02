const express = require('express');
const router = express.Router();
const trackController = require('../controllers/TrackController'); 

console.log('Registering routes...');

// Simple test route
router.get('/test', (req, res) => {
  console.log('Test route hit');
  res.send('Test route is working!');
});

// Route to handle audio file uploads
router.post('/uploadTrackFiles/:trackId', trackController.uploadTrackFiles);

// Route to handle track metadata submission
router.post('/submitTrackData', trackController.submitTrackData);

// Route to fetch track details by trackId
router.get('/tracks/:trackId', trackController.getTrackDetails);

// Route to fetch all tracks owned by a specific user
router.get('/user/:userId/tracks', trackController.getUserTracks);

console.log('Routes registered');

module.exports = router;


/*
THIS DONT BELONG HERE
const configIntPlayerController = require('../controllers/ConfigIntPlayerController');
const exoplanetController = require('../controllers/ExoplanetController'); 
const { verifyJWT, requireRole } = require('../utils/requireRole');


// Routes for creating and fetching configuration players 
// Access restricted to 'Admin' and 'Super Admin'
router.post('/uploadModelFiles', verifyJWT, requireRole('Admin'), configIntPlayerController.uploadModelFiles);

// Access restricted to 'Admin', 'Super Admin', and 'xPlorer Bloom'
router.get('/configIntPlayers', verifyJWT, requireRole('Admin'), configIntPlayerController.getConfigIntPlayers);

// Access restricted to 'Admin' and 'Super Admin'
router.post('/configIntPlayer', verifyJWT, requireRole('Admin'), configIntPlayerController.createConfigIntPlayer);

// Access restricted to 'Admin' and 'Super Admin'
router.post('/updateExoplanet', verifyJWT, requireRole('Admin'), exoplanetController.updateExoplanet);

// Routes for fetching data to fill protoplanet form options 
// Accessible to all roles including 'Listener'
router.get('/fetchExoplanetData', verifyJWT, configIntPlayerController.fetchExoplanetData);
router.get('/fetchSonicEngineData', verifyJWT, configIntPlayerController.fetchSonicEngineData);

// Example route that only 'Admin' users can access
router.get('/admin/configurations', verifyJWT, requireRole('Admin'), (req, res) => {
  res.json({ message: 'Admin configurations' });
});








*/