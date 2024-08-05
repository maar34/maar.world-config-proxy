const express = require('express');
const router = express.Router();
const configIntPlayerController = require('../controllers/ConfigIntPlayerController');
const exoplanetController = require('../controllers/ExoplanetController'); // Ensure this path is correct

console.log('Registering routes...');

// Simple test route
router.get('/test', (req, res) => {
  console.log('Test route hit');
  res.send('Test route is working!');
});

// Routes for creating and fetching configuration players
router.post('/configIntPlayer', configIntPlayerController.createConfigIntPlayer);
router.get('/configIntPlayers', configIntPlayerController.getConfigIntPlayers);

// Routes for file uploads
router.post('/uploadFiles', configIntPlayerController.uploadFiles);
router.post('/updateExoplanet', exoplanetController.updateExoplanet); // Ensure this route is correct

// Routes for fetching data
router.get('/fetchExoplanetData', configIntPlayerController.fetchExoplanetData);
router.get('/fetchSonicEngineData', configIntPlayerController.fetchSonicEngineData);

console.log('Routes registered');

module.exports = router;
