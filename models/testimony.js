const mongoose = require('mongoose');
const validator = require('validator');

const testimonialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  profession: {
    type: String,
    required: [true, 'Profession is required']
  },
  text: {
    type: String,
    required: [true, 'Testimonial text is required'],
    minlength: [20, 'Testimonial must be at least 20 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  verified: {
    type: Boolean,
    default: false
  }
});

// Prevent duplicate testimonials from same email
testimonialSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('Testimonial', testimonialSchema);