const mongoose = require('mongoose');
const { Schema } = mongoose;


const SonificationSchema = new Schema({
  regenState: { type: Boolean, required: true },
  regen1: { type: String, required: true },
  regen2: { type: String, required: true },
  regen3: { type: String, required: true },
  regen4: { type: String, required: true },
  regen5: { type: String, required: true },
  regen6: { type: String, required: true },
  regen7: { type: String, required: true }
});

const DDDSchema = new Schema({
  dddArtistName: { type: String, required: true },
  textureURL: { type: String, required: true },
  objURL: { type: String, required: true }
});

const IPPlaybackSchema = new Schema({
  playCount: { type: Number, required: false }, // Int32
  playDuration: { type: mongoose.Types.Decimal128, required: false }, // Double
  recDuration: { type: mongoose.Types.Decimal128, required: false }, // Double
  xKnob: { type: Number, required: false }, // Int32
  yKnob: { type: Number, required: false }, // Int32
  zKnob: { type: Number, required: false }, // Int32
  regenButton: { type: Number, required: false }, // Int32
  playButton: { type: Number, required: false }, // Int32
  pauseButton: { type: Number, required: false } // Int32
});

const IPSocialSchema = new Schema({
  likes: { type: Number, required: false }, // Int32
  dislikes: { type: Number, required: false }, // Int32
  rating: { type: Number, required: false }, // Int32
  shares: { type: Number, required: false }, // Int32
  comments: { type: String, required: false }
});

const ConfigSchema = new Schema({
  ipId: { type: Number, required: true }, // Int32
  artName: { type: String, required: true },
  sciName: { type: String, required: true },
  ra_decimal: { type: mongoose.Types.Decimal128, required: true }, // Double
  dec_decimal: { type: mongoose.Types.Decimal128, required: true }, // Double
  period: { type: mongoose.Types.Decimal128, required: true }, // Double
  radius: { type: mongoose.Types.Decimal128, required: true }, // Double
  discoveryyear: { type: mongoose.Types.Decimal128, required: true }, // Double
  description: { type: String, required: true },
  credits: { type: String, required: true },
  soundEngine: { type: String, required: true },
  sonification: { type: [SonificationSchema], required: true },
  ddd: { type: [DDDSchema], required: true },
  ipPlayback: { type: [IPPlaybackSchema], required: false },
  ipSocial: { type: [IPSocialSchema], required: false }
});

module.exports = mongoose.model('Config', ConfigSchema);
