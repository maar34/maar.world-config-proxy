const mongoose = require('mongoose');

const userInfoSchema = new mongoose.Schema({
  username: { type: String, required: true },
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
  otherPronouns: { type: String }, // For custom pronouns if 'Other' is selected
  updatedAt: { type: Date, default: Date.now } // Track when this info was last updated
});

const userSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId(), unique: true }, 
  username: { type: String, required: true, unique: true },
  userInfo: userInfoSchema, // Changed from an array to a single object
  email: { type: String, required: true, unique: true },
  role: { type: String, default: 'Listener' }, 
  phone: String,
  profileImage: { type: String },
  userPlayback: {
    playCount: { type: Number, default: 0 },
    playDuration: { type: Number, default: 0 },
    recDuration: { type: Number, default: 0 },
  },
  createdAt: { type: Date, default: Date.now }
});


// Ensure that `userId` is used as a unique identifier in addition to `_id`.
userSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);
