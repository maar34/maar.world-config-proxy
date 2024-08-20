// models/Track.js

const mongoose = require('mongoose');

const TrackSchema = new mongoose.Schema({
    exoplanet: { type: String, required: true },
    artistName: { type: String, required: true },
    songName: { type: String, required: true },
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
    coverImage: { type: String },  // New field for the cover image
}, {
    timestamps: true
});

module.exports = mongoose.model('Track', TrackSchema);
