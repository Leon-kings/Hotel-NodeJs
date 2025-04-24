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
  cardLast4: {
    type: String,
    required: function () {
      return this.paymentMethod === "credit_card";
    },
  },
  cardBrand: {
    type: String,
    required: function () {
      return this.paymentMethod === "credit_card";
    },
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

// Generate transaction ID before saving
PaymentSchema.pre("save", function (next) {
  if (!this.transactionId) {
    this.transactionId = `TXN-${Date.now()}-${Math.floor(
      Math.random() * 10000
    )}`;
  }
  next();
});

module.exports = mongoose.model("Payment", PaymentSchema);
