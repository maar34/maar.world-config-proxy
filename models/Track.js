// models/Track.js

const mongoose = require('mongoose');
const { Schema } = mongoose;

const TrackSchema = new Schema({
  exoplanet: { type: String, required: true },
  artistName: { type: String, required: true },
  songName: { type: String, required: true },
  audioFileWAV: { type: String, required: true },
  audioFileMP3: { type: String, required: true },
  type: { type: String, required: true },
  genre: { type: String, required: false },
  mood: { type: String, required: false },
  additionalTags: { type: String, required: false },
  description: { type: String, required: true },
  credits: { type: String, required: true },
  privacy: { type: String, required: true, default: 'public' },
  releaseDate: { type: Date, required: true },
  licence: { type: String, required: true },
  enableDirectDownloads: { type: Boolean, required: true, default: false },
});

module.exports = mongoose.model('Track', TrackSchema);
