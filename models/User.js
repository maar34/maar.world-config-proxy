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
  customGenderIdentity: { type: String }, // For custom gender identity if 'Not Listed' is selected
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
  displayName: { type: String }, // New field
  profileURL: { type: String }, // New field
  city: { type: String }, // New field
  country: { type: String }, // New field
  bio: { type: String, maxlength: 200 }, // New field
  customLinks: [{ type: String }], // New field (array of strings for up to 3 custom links)
  userInfo: userInfoSchema, // Nesting userInfoSchema
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
