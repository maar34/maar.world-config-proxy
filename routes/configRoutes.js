const express = require('express');
const router = express.Router();
const configIntPlayerController = require('../controllers/configIntPlayerController');

router.post('/configIntPlayer', configIntPlayerController.createConfigIntPlayer);
router.get('/configIntPlayers', configIntPlayerController.getConfigIntPlayers);

module.exports = router;
