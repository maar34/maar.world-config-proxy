// controllers/playlistController.js
const Playlist = require('../models/Playlist');
const Track = require('../models/Track');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../uploads/playlists');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}_${file.originalname}`);
    }
});

const upload = multer({ storage });

// Create a new Playlist with cover image
exports.createPlaylist = [
    upload.single('coverImage'), // Handle single file upload
    async (req, res) => {
        try {
            const { ownerId, playlistName, description, privacy, additionalTags, artistNames } = req.body;

            // Validate required fields
            if (!ownerId || !playlistName || !description || !privacy) {
                return res.status(400).json({ message: 'Missing required fields.' });
            }

            // Create new Playlist first to get the unique playlistId
            const newPlaylist = new Playlist({
                ownerId,
                playlistName,
                artistNames: artistNames ? JSON.parse(artistNames) : [],
                description,
                privacy,
                additionalTags: additionalTags ? JSON.parse(additionalTags) : []
            });

            await newPlaylist.save();

            // Define the unique folder based on playlistId
            const playlistFolder = path.join(__dirname, `../uploads/playlists/${newPlaylist._id}`);
            if (!fs.existsSync(playlistFolder)) {
                fs.mkdirSync(playlistFolder, { recursive: true });
            }

            // Handle cover image upload (move image to the playlist-specific folder)
            let coverImagePath = '';
            if (req.file) {
                coverImagePath = `/uploads/playlists/${newPlaylist._id}/${req.file.filename}`;
                const destinationPath = path.join(playlistFolder, req.file.filename);
                fs.renameSync(req.file.path, destinationPath); // Move file to the correct folder
            }

            // Update the playlist with cover image path
            newPlaylist.coverImage = coverImagePath;
            await newPlaylist.save();

            // Update the user with the new playlist
            await User.findByIdAndUpdate(ownerId, { $push: { playlistsOwned: newPlaylist._id } });

            res.status(201).json({ success: true, message: 'Playlist created successfully!', playlist: newPlaylist });
        } catch (error) {
            console.error('Error creating playlist:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
];


// Get a Playlist by ID
exports.getPlaylistById = async (req, res) => {
    try {
        const { playlistId } = req.params;
        const userId = req.query.userId; // Ensure this is passed from the frontend

        const playlist = await Playlist.findById(playlistId)
            .populate('ownerId', 'username displayName profileImage')
            .populate({
                path: 'tracks',
                populate: { path: 'ownerId', select: 'username displayName profileImage' }
            });

        if (!playlist) {
            return res.status(404).json({ success: false, message: 'Playlist not found' });
        }

        // Determine if the user is the owner or if the playlist is collaborative
        const isOwner = playlist.ownerId._id.toString() === userId;
        const isCollaborative = playlist.privacy === 'collaborative';

        res.json({ success: true, playlist, canEdit: isOwner || isCollaborative });
    } catch (error) {
        console.error('Error fetching playlist:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Update a Playlist
// Update a Playlist
exports.updatePlaylist = [
    upload.single('coverImage'), // Handle single file upload if updating cover image
    async (req, res) => {
        try {
            const { playlistId } = req.params;
            const updateData = req.body;
            const userId = req.body.ownerId;

            // Find the playlist by ID
            const playlist = await Playlist.findById(playlistId);
            if (!playlist) {
                return res.status(404).json({ message: 'Playlist not found' });
            }

            // Check if the user has permissions to edit (must be owner or collaborative)
            if (playlist.ownerId.toString() !== userId && playlist.privacy !== 'collaborative') {
                return res.status(403).json({ message: 'You don’t have permissions to edit this playlist' });
            }

            // Handle cover image update
            if (req.file) {
                const playlistFolder = path.join(__dirname, `../uploads/playlists/${playlistId}`);
                const coverImagePath = `/uploads/playlists/${playlistId}/${req.file.filename}`;
                
                // Ensure the folder exists
                if (!fs.existsSync(playlistFolder)) {
                    fs.mkdirSync(playlistFolder, { recursive: true });
                }

                // Move the file to the correct folder
                const destinationPath = path.join(playlistFolder, req.file.filename);
                fs.renameSync(req.file.path, destinationPath);

                updateData.coverImage = coverImagePath;
            }

            // Update the playlist with new data
            const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId, updateData, { new: true });
            res.json({ success: true, message: 'Playlist updated successfully!', playlist: updatedPlaylist });
        } catch (error) {
            console.error('Error updating playlist:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
];

// Delete a Playlist
exports.deletePlaylist = async (req, res) => {
    try {
        const { playlistId } = req.params;

        const playlist = await Playlist.findByIdAndDelete(playlistId);

        if (!playlist) {
            return res.status(404).json({ success: false, message: 'Playlist not found' });
        }

        // Remove the playlist from the User's playlistsOwned
        await User.findByIdAndUpdate(playlist.ownerId, {
            $pull: { playlistsOwned: playlistId }
        });

        // Remove the playlistId from associated tracks
        await Track.updateMany(
            { playlistId: playlistId },
            { $unset: { playlistId: "" } }
        );

        res.json({ success: true, message: 'Playlist deleted successfully' });
    } catch (error) {
        console.error('Error deleting playlist:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Add a Track to a Playlist
exports.addTrackToPlaylist = async (req, res) => {
    try {
        const { playlistId, trackId } = req.body;

        const playlist = await Playlist.findById(playlistId);
        const track = await Track.findById(trackId);

        if (!playlist || !track) {
            return res.status(404).json({ success: false, message: 'Playlist or Track not found' });
        }

        // Add track to playlist if not already present
        if (!playlist.tracks.includes(trackId)) {
            playlist.tracks.push(trackId);
            await playlist.save();

            // Update track's playlistId
            track.playlistId = playlistId;
            await track.save();
        }

        res.json({ success: true, message: 'Track added to playlist successfully', playlist });
    } catch (error) {
        console.error('Error adding track to playlist:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Remove a Track from a Playlist
exports.removeTrackFromPlaylist = async (req, res) => {
    try {
        const { playlistId, trackId } = req.body;

        const playlist = await Playlist.findById(playlistId);
        const track = await Track.findById(trackId);

        if (!playlist || !track) {
            return res.status(404).json({ success: false, message: 'Playlist or Track not found' });
        }

        // Remove track from playlist if present
        if (playlist.tracks.includes(trackId)) {
            playlist.tracks.pull(trackId);
            await playlist.save();

            // Remove track's playlistId
            track.playlistId = undefined;
            await track.save();
        }

        res.json({ success: true, message: 'Track removed from playlist successfully', playlist });
    } catch (error) {
        console.error('Error removing track from playlist:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get Playlists by Owner ID
exports.getPlaylistsByOwner = async (req, res) => {
    try {
        const { ownerId } = req.query;

        if (!ownerId) {
            return res.status(400).json({ success: false, message: 'Owner ID is required' });
        }

        const playlists = await Playlist.find({ ownerId })
            .populate('tracks')
            .populate('ownerId', 'username displayName profileImage')
            .sort({ createdAt: -1 });

        res.json({ success: true, playlists });
    } catch (error) {
        console.error('Error fetching playlists:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
