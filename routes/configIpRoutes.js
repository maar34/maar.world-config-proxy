const express = require('express');
const router = express.Router();
const configIntPlayerController = require('../controllers/ConfigIntPlayerController');
const exoplanetController = require('../controllers/ExoplanetController'); // Ensure this path is correct
const { verifyJWT, requireRole } = require('../utils/requireRole');
// const { handleUserLogin } = require('../auth'); // Adjust the path as necessary

console.log('Registering routes...');

// Simple test route
router.get('/test', (req, res) => {
  console.log('Test route hit');
  res.send('Test route is working!');
});

// Routes for creating and fetching configuration players 
// In the front end, these functions are used by the protoplanet form 
router.post('/uploadModelFiles', configIntPlayerController.uploadModelFiles);

router.get('/configIntPlayers', configIntPlayerController.getConfigIntPlayers);

router.post('/configIntPlayer', configIntPlayerController.createConfigIntPlayer); // No multer middleware here
router.post('/updateExoplanet', exoplanetController.updateExoplanet); // Ensure this route is correct

// router.post('/login', handleUserLogin);

// Routes for fetching data to fill protoplanet form options 

router.get('/fetchExoplanetData', configIntPlayerController.fetchExoplanetData);
router.get('/fetchSonicEngineData', configIntPlayerController.fetchSonicEngineData);

// Example route that only 'Admin' users can access
router.get('/admin/configurations', verifyJWT, requireRole('Admin'), (req, res) => {
  res.json({ message: 'Admin configurations' });
});

console.log('Routes registered');

module.exports = router;