const express = require('express');
const router = express.Router();
const configIntPlayerController = require('../controllers/ConfigIntPlayerController');

router.post('/configIntPlayer', configIntPlayerController.createConfigIntPlayer);
router.get('/configIntPlayers', configIntPlayerController.getConfigIntPlayers);
router.post('/uploadFiles', configIntPlayerController.uploadFiles);
router.get('/fetchExoplanetData', configIntPlayerController.fetchExoplanetData);
router.get('/fetchSonicEngineData', configIntPlayerController.fetchSonicEngineData);

module.exports = router;
