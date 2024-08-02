const express = require('express');
const router = express.Router();
const ConfigIntPlayerController = require('../controllers/ConfigIntPlayerController');

router.post('/ConfigIntPlayer', ConfigIntPlayerController.createConfigIntPlayer);
router.get('/ConfigIntPlayer', ConfigIntPlayerController.getConfigIntPlayers);

module.exports = router;
