const express = require('express');
const router = express.Router();
const soundEngineController = require('../controllers/SoundEngineController'); 

// Sound Engine Routes
router.post('/', soundEngineController.createSoundEngine);
router.get('/', soundEngineController.getSoundEnginesByOwner);
router.get('/:soundEngineId', soundEngineController.getSoundEngineById);
router.put('/:soundEngineId', soundEngineController.updateSoundEngine);
router.delete('/:soundEngineId', soundEngineController.deleteSoundEngine);

module.exports = router;
