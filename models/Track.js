// models/Track.js

const mongoose = require('mongoose');

const TrackSchema = new mongoose.Schema({
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},  // The user who owns the track
    exoplanet: { type: String, required: true },
    artistNames: [
        {
            name: { type: String, required: true },
            genderIdentity: { type: String, enum: ['Prefer not to reply', 'Woman', 'Man', 'Trans woman', 'Trans man', 'Non-Binary', 'Not Listed'], default: 'Prefer not to reply' }
        }
    ],
    soundEngine: { type: String, required: false },  // Sound engine used for the project
    sonificationEnabled: { type: Boolean, required: false },  // Sonification data
    trackName: { type: String, required: true },
    type: { type: String, required: true },
    genre: { type: String },
    mood: { type: String },
    additionalTags: { type: String },
    description: { type: String, required: true },
    credits: { type: String, required: true },
    privacy: { type: String, default: 'public' },
    releaseDate: { type: Date, required: true },
    licence: { type: String, required: true },
    enableDirectDownloads: { type: Boolean, default: false },
    audioFileWAV: { type: String },
    audioFileMP3: { type: String },
    coverImage: { type: String }
}, {
    timestamps: true
});

module.exports = mongoose.model('Track', TrackSchema);
