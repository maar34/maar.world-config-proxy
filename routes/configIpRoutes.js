const express = require('express');
const router = express.Router();
const configIntPlayerController = require('../controllers/ConfigIntPlayerController');
const exoplanetController = require('../controllers/ExoplanetController');

// Removed JWT imports and middleware for now
// const { verifyJWT, requireRole } = require('../utils/requireRole');

console.log('Registering interplanetary player routes...');

// 1. Define all static routes first

// Simple test route
router.get('/test', (req, res) => {
  console.log('Test route hit');
  res.send('Test route is working!');
});

// Routes for fetching data to fill protoplanet form options 
router.get('/fetchExoplanetData', configIntPlayerController.fetchExoplanetData);
router.get('/fetchSonicEngineData', configIntPlayerController.fetchSonicEngineData);

// Admin-specific route (still public for now)
router.get('/admin/configurations', (req, res) => {
  res.json({ message: 'Admin configurations' });
});

// Routes for creating and fetching configuration players 
router.post('/uploadModelFiles', configIntPlayerController.uploadModelFiles);
router.get('/', configIntPlayerController.getConfigIntPlayers); // Fetch all players
router.post('/', configIntPlayerController.createConfigIntPlayer); // Create a new player
router.post('/updateExoplanet', exoplanetController.updateExoplanet); // Update exoplanet data

// 2. Define dynamic routes last
// Route for fetching an interplanetary player by ID
router.get('/:playerId', configIntPlayerController.getInterplanetaryPlayerById);

console.log('Interplanetary player routes registered');
module.exports = router;
