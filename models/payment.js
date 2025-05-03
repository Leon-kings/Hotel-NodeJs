const mongoose = require('mongoose');

const cardDetailsSchema = new mongoose.Schema({
  number: { type: String }, // Store encrypted in production
  name: { type: String },
  expiry: { type: String },
  cvv: { type: String } // Note: CVV shouldn't be stored long-term in production
}, { _id: false });

const paymentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  paymentMethod: { type: String, enum: ['credit', 'paypal'], required: true },
  customerEmail: { type: String, required: true },
  cardDetails: { type: cardDetailsSchema },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'refunded'], 
    default: 'pending' 
  },
  transactionId: { type: String },
  gatewayResponse: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', paymentSchema);