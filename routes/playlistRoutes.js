// routes/playlistRoutes.js
const express = require('express');
const router = express.Router();
const playlistController = require('../controllers/PlaylistController'); // Ensure the path is correct

// Playlist Routes

// Create a new playlist
router.post('/', playlistController.createPlaylist);

// Get all playlists by owner
router.get('/', playlistController.getPlaylistsByOwner);

// Get a specific playlist by ID
router.get('/:playlistId', playlistController.getPlaylistById);

// Update a specific playlist by ID
router.put('/:playlistId', playlistController.updatePlaylist);

// Delete a specific playlist by ID
router.delete('/:playlistId', playlistController.deletePlaylist);

// Add a track to a playlist
router.post('/addTrack', playlistController.addTrackToPlaylist);

// Remove a track from a playlist
router.post('/removeTrack', playlistController.removeTrackFromPlaylist);



module.exports = router;
