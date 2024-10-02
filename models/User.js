const mongoose = require('mongoose');

const userInfoSchema = new mongoose.Schema({
  genderIdentity: { 
    type: String, 
    enum: [
      'Prefer not to reply', 
      'Woman', 
      'Man', 
      'Trans woman', 
      'Trans man', 
      'Non-Binary', 
      'Not Listed'
    ], 
    default: 'Prefer not to reply' 
  },
  customGenderIdentity: { type: String }, 
  pronouns: { 
    type: String, 
    enum: [
      'She/Her',
      'He/Him',
      'They/Them',
      'Ze/Hir',
      'Ze/Zir',
      'Prefer not to say',
      'Other'
    ],
    default: 'Prefer not to say'
  },
  otherPronouns: { type: String }, 
  updatedAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    unique: true 
  },
  username: { type: String, required: true, unique: true },
  displayName: { type: String },
  profileURL: { type: String },
  city: { type: String },
  country: { type: String },
  bio: { type: String, maxlength: 200 },
  customLinks: [{ type: String }],
  userInfo: userInfoSchema,
  email: { type: String, required: true, unique: true },
  interplanetaryPlayersOwned: [{ type: mongoose.Schema.Types.ObjectId, ref: 'InterplanetaryPlayer' }], // Ownership of players
  enginesOwned: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Sound Engines' }], // Add this field
  playlistsOwned: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Playlist' }], // Ownership of playlists
  tracksOwned: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Track' }], // Add this field
  role: { type: String, default: 'Listener' }, 
  phone: String,
  profileImage: { type: String },
  privateAccount: { type: Boolean, default: false },
  followersCount: { type: Number, default: 0 },
  followingCount: { type: Number, default: 0 },
  userPlayback: {
    playCount: { type: Number, default: 0 },
    playDuration: { type: Number, default: 0 },
    recDuration: { type: Number, default: 0 },
  },
  createdAt: { type: Date, default: Date.now }
});


// Middleware to set `userId` before validation
userSchema.pre('validate', function(next) { 
  if (!this.userId) {
    // Ensure userId is the string representation of _id
    this.userId = this._id.toString();
  }
  next();
});

// Indexes for efficient querying
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });


module.exports = mongoose.model('User', userSchema);
