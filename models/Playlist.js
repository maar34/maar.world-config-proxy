// models/Playlist.js
const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
    ownerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    }, // User who owns the playlist
    playlistName: { 
        type: String, 
        required: true 
    }, // Name of the playlist
    artistNames: [
        {
            name: { type: String, required: true },
            genderIdentity: { 
                type: String, 
                enum: ['Prefer not to reply', 'Woman', 'Man', 'Trans woman', 'Trans man', 'Non-Binary', 'Not Listed'], 
                default: 'Prefer not to reply' 
            }
        }
    ], // List of artists in the playlist, matching TrackSchema structure
    description: { 
        type: String, 
        required: false 
    }, // Description of the playlist

    privacy: { 
        type: String, 
        enum: ['public','collaborative','private'], 
        default: 'public' 
    }, // Privacy setting
    type: { // New Field
        type: String,
        enum: ['Playlist', 'Album', 'EP', 'Single', 'Compilation'],
        default: 'Playlist',
        required: true
    },
    coverImage: { 
        type: String 
    }, // Cover image for the playlist
    additionalTags: { 
        type: [String] 
    }, // Additional tags for categorization
    tracks: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Track' 
    }], // Tracks associated with the playlist
}, {
    timestamps: true
});

// Indexes for efficient querying
playlistSchema.index({ ownerId: 1 });
playlistSchema.index({ playlistName: 'text', description: 'text', additionalTags: 'text' });

module.exports = mongoose.model('Playlist', playlistSchema);
