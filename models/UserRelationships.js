const mongoose = require('mongoose');

const userRelationshipsSchema = new mongoose.Schema({
  followerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // User who is following
  followingId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // User who is being followed
  createdAt: { type: Date, default: Date.now }, // When the relationship was created
  status: { type: String, enum: ['active', 'blocked', 'pending'], default: 'active' }, // Status of the relationship
  notificationsEnabled: { type: Boolean, default: true }, // Whether notifications are enabled for this relationship
  notes: { type: String, maxlength: 500 }, // Optional notes about the relationship (e.g., reason for follow, categorization)
  relationshipType: { type: String, enum: ['user', 'ip'], default: 'user' }, // New field to distinguish between user and IP following
  category: { type: String, maxlength: 100 } // Categorization of the relationship (e.g., "Friends", "Colleagues")
}, { 
  timestamps: true
});

userRelationshipsSchema.index({ followerId: 1, followingId: 1 }, { unique: true }); // Ensure uniqueness and fast lookups

module.exports = mongoose.model('UserRelationships', userRelationshipsSchema);
