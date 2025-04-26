// models/Message.js
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    match: [/.+\@.+\..+/, "Please enter a valid email"],
  },
  phone: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    default: "Hotel Reservation",
  },
  message: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "In Progress", "Resolved", "Rejected"],
    default: "pending",
  },
  error: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  sentAt: {
    type: Date,
  },
});

module.exports = mongoose.model("Message", messageSchema);
