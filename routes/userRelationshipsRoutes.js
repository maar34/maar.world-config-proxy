const express = require('express');
const router = express.Router();
const userRelationshipsController = require('../controllers/userRelationshipsController');

// Route definitions
router.post('/follow', userRelationshipsController.followUserOrIp);
router.post('/unfollow', userRelationshipsController.unfollowUserOrIp);
router.post('/blockUser', userRelationshipsController.blockUser);
router.post('/unblockUser', userRelationshipsController.unblockUser);
router.post('/checkFollowStatus', userRelationshipsController.checkFollowStatus); // This is the new route
router.get('/followers/:username', userRelationshipsController.getFollowers);
router.get('/following/:username', userRelationshipsController.getFollowing);
router.get('/mutualFollowers/:username1/:username2', userRelationshipsController.getMutualFollowers);

module.exports = router;
