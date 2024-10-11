// models/ConfigIp.js

const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define the 3D Schema
const DDDSchema = new Schema({
  dddArtist: { type: String, required: true },  // Artist name as a string
  textureURL: { type: String, required: true },  // URL to the texture file
  objURL: { type: String, required: true }  // URL to the OBJ file
});

// Define the IP Playback Schema
const IPPlaybackSchema = new Schema({
  playCount: { type: Number, required: false },
  playDuration: { type: mongoose.Types.Decimal128, required: false },
  recDuration: { type: mongoose.Types.Decimal128, required: false },
  xKnob: { type: Number, required: false },
  yKnob: { type: Number, required: false },
  zKnob: { type: Number, required: false },
  regenButton: { type: Number, required: false },
  playButton: { type: Number, required: false },
  pauseButton: { type: Number, required: false }
});

// Define the IP Social Schema
const IPSocialSchema = new Schema({
  likes: { type: Number, required: false },
  dislikes: { type: Number, required: false },
  rating: { type: Number, required: false },
  shares: { type: Number, required: false },
  comments: { type: String, required: false }
});

// Define the main Config Schema
const ConfigSchema = new Schema({
  ownerId: { type: String, ref: 'User', required: true, index: true },  // Updated to String for userId
  isPublic: {
    type: Boolean,
    required: true,
    default: false, // Set default to true
    index: true     // Add index for faster queries
  },  
  ipId: { type: Number, required: true },  // IP ID
  artName: { type: String, required: true },  // Name of the artwork
  sciName: { type: String, required: true },  // Scientific name of the exoplanet
  ra_decimal: { type: mongoose.Types.Decimal128, required: true },  // Right Ascension
  dec_decimal: { type: mongoose.Types.Decimal128, required: true },  // Declination
  period: { type: mongoose.Types.Decimal128, required: true },  // Orbital period
  radius: { type: mongoose.Types.Decimal128, required: true },  // Radius
  discoveryyear: { type: mongoose.Types.Decimal128, required: true },  // Discovery year
  description: { type: String, required: true },  // Description of the exoplanet or artwork
  credits: { type: String, required: true },  // Credits for the artwork or discovery
  ddd: { type: DDDSchema, required: true },  // 3D data with dddArtist as a string
  ipPlayback: { type: IPPlaybackSchema, required: false },  // Playback data (optional)
  ipSocial: { type: IPSocialSchema, required: false }  // Social interaction data (optional)
}, {
  timestamps: true  // Automatically add createdAt and updatedAt fields
});

module.exports = mongoose.model('ConfigIp', ConfigSchema);
