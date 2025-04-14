const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: props => `${props.value} is not a valid email address!`
    }
  },
  checkInDate: {
    type: Date,
    required: [true, 'Check-in date is required'],
    validate: {
      validator: function(v) {
        return v >= new Date();
      },
      message: 'Check-in date must be in the future'
    }
  },
  checkOutDate: {
    type: Date,
    required: [true, 'Check-out date is required'],
    validate: {
      validator: function(v) {
        return v > this.checkInDate;
      },
      message: 'Check-out date must be after check-in date'
    }
  },
  adults: {
    type: Number,
    required: [true, 'Number of adults is required'],
    min: [1, 'At least one adult is required']
  },
  children: {
    type: Number,
    default: 0,
    min: [0, 'Number of children cannot be negative']
  },
  status: {
    type: String,
    default: 'pending',
   
  },
  roomType: {
    type: String,
    required: [true, 'Room type is required'],
    enum: {
      values: ['standard', 'deluxe', 'suite', 'family'],
      message: '{VALUE} is not a valid room type'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending'
  }
});

// Add index for better query performance
bookingSchema.index({ email: 1, checkInDate: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;