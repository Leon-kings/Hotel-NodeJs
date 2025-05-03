const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  price: { type: Number, required: true },
  roomNumber: { type: String, default: "N/A" },
  description: { type: String },
  category: { type: String },
  subtotal: { type: Number, required: true }
});

const orderSchema = new mongoose.Schema({
  customerEmail: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['credit', 'paypal'], required: true },
  items: [orderItemSchema],
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'refunded'], 
    default: 'pending' 
  },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

orderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Order', orderSchema);