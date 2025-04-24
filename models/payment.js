const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: [90, "Minimum payment amount is $90"],
  },
  currency: {
    type: String,
    default: "USD",
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ["credit_card", "paypal", "bank_transfer"],
    default: 'credit_card',
  },
  cardHolderName: {
    type: String,
    required: function () {
      return this.paymentMethod === "credit_card";
    },
    trim: true,
    match: [/^[a-zA-Z ]+$/, "Please enter a valid card holder name"],
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "completed", "failed", "refunded", "insufficient_funds"],
    default: "pending",
  },
  transactionId: {
    type: String,
    unique: true,
    required: true,
    default: function() {
      return generateTransactionId();
    }
  },
  email: {
    type: String,
    required: true,
    match: [/.+\@.+\..+/, "Please enter a valid email"],
  },
  description: String,
  failureReason: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Function to generate a unique transaction ID
function generateTransactionId() {
  const timestamp = Date.now().toString(36); // Base36 for shorter representation
  const random = Math.floor(Math.random() * 1000000).toString(36);
  return `TXN-${timestamp}-${random}`.toUpperCase();
}

// Alternative approach using pre-save hook (commented out since we're using default function)
/*
PaymentSchema.pre("save", function (next) {
  if (!this.transactionId) {
    this.transactionId = generateTransactionId();
  }
  next();
});
*/

module.exports = mongoose.model("Payment", PaymentSchema);