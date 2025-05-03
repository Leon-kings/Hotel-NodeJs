const Order = require('../models/orders');
const Payment = require('../models/payment');
const { processPayment } = require('../config/emailConfig');
const { sendPaymentConfirmationEmail } = require('../config/emailServices');

// Process payment
exports.processPayment = async (req, res) => {
  try {
    const { orderId, paymentMethod, card } = req.body;
    const userId = req.user._id;

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Verify user owns this order
    if (order.userId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Don't process if order is already completed
    if (order.status === 'completed') {
      return res.status(400).json({ 
        success: false, 
        message: 'Order already completed' 
      });
    }

    // Process payment
    const paymentResult = await processPayment({
      orderId,
      amount: order.totalAmount,
      currency: 'USD',
      paymentMethod,
      customerEmail: order.customerEmail,
      card
    });

    // Create payment record
    const payment = new Payment({
      orderId: order._id,
      amount: order.totalAmount,
      currency: 'USD',
      paymentMethod,
      customerEmail: order.customerEmail,
      cardDetails: paymentMethod === 'credit' ? card : undefined,
      status: paymentResult.success ? 'completed' : 'failed',
      transactionId: paymentResult.transactionId,
      gatewayResponse: paymentResult
    });

    await payment.save();

    // Update order with payment ID and status
    order.paymentId = payment._id;
    order.status = paymentResult.success ? 'completed' : 'failed';
    await order.save();

    // Send confirmation email if successful
    if (paymentResult.success) {
      await sendPaymentConfirmationEmail(order, payment);
    }

    res.json({
      success: paymentResult.success,
      message: paymentResult.message || 'Payment processed',
      order,
      payment
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error processing payment',
      error: error.message 
    });
  }
};

// Get payment by ID
exports.getPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findById(paymentId).populate('orderId');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    // Verify user has access to this payment
    if (payment.orderId.userId.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Don't return sensitive card details
    const paymentToReturn = payment.toObject();
    delete paymentToReturn.cardDetails;

    res.json({ success: true, payment: paymentToReturn });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching payment',
      error: error.message 
    });
  }
};