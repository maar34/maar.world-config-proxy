const express = require('express');
const router = express.Router();
const soundEngineController = require('../controllers/SoundEngineController'); 

// Sound Engine Routes
router.get('/exists', soundEngineController.checkSoundEngineExists); // For checking if a soundEngineName is available
router.post('/', soundEngineController.createSoundEngine); // For creating a new sound engine
router.get('/owner', soundEngineController.getSoundEnginesByOwner); // For fetching engines by ownerId or username in query
router.get('/:soundEngineId', soundEngineController.getSoundEngineById); // For fetching a single engine by its ID
router.get('/available/:ownerId', soundEngineController.getAvailableSoundEngines);
router.patch('/:soundEngineId', soundEngineController.updateSoundEngine); // For updating a specific sound engine
router.delete('/:soundEngineId', soundEngineController.deleteSoundEngine); // For deleting a specific sound engine

module.exports = router;
