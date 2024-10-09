const mongoose = require('mongoose');

const userRelationshipsSchema = new mongoose.Schema({
  followerId: { type: String, required: true },  // Use String instead of ObjectId
  followingId: { type: String },  // Use String instead of ObjectId
  followingIpId: { type: mongoose.Schema.Types.ObjectId, ref: 'InterplanetaryPlayer' },  // This can stay as ObjectId if related to MongoDB models
  status: { type: String, enum: ['active', 'blocked'], default: 'active' },
  relationshipType: { type: String, enum: ['user', 'ip'], required: true },
  category: { type: String },
  notes: { type: String }
}, { timestamps: true,  
  indexes: [
    { fields: { followerId: 1, followingId: 1 }, unique: true } // Ensure uniqueness and fast lookups
  ]
});

module.exports = mongoose.model('UserRelationships', userRelationshipsSchema);
