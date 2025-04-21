const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  profilePicture: {
    url: {
      type: String,
      default: ''
    },
    publicId: {
      type: String,
      default: ''
    }
  },
  description: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
userProfileSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to update or create profile
userProfileSchema.statics.updateOrCreate = async function(userId, data) {
  return this.findOneAndUpdate(
    { userId },
    data,
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
};

module.exports = mongoose.model('UserProfile', userProfileSchema);