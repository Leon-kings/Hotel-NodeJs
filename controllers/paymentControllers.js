// controllers/paymentController.js
const Payment = require("../models/payment");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // For Stripe integration

const paymentController = {
  /**
   * Process a payment
   */
  processPayment: async (req, res) => {
    try {
      const { amount, currency, paymentMethod, description, receiptEmail } = req.body;
      const userId = req.user._id; // Assuming you have user auth middleware

      // Validate input
      if (!amount || !paymentMethod) {
        return res.status(400).json({
          success: false,
          message: "Amount and payment method are required"
        });
      }

      // Create payment record in database
      const newPayment = new Payment({
        userId,
        amount,
        currency: currency || 'USD',
        paymentMethod,
        description,
        receiptEmail,
        status: 'pending'
      });

      await newPayment.save();

      // Process payment based on method
      let paymentResult;
      switch(paymentMethod) {
        case 'stripe':
          paymentResult = await processStripePayment(newPayment);
          break;
        case 'paypal':
          paymentResult = await processPaypalPayment(newPayment);
          break;
        // Add other payment methods as needed
        default:
          throw new Error('Unsupported payment method');
      }

      // Update payment status
      newPayment.status = 'completed';
      newPayment.transactionId = paymentResult.transactionId;
      await newPayment.save();

      // Send payment confirmation email
      await sendPaymentConfirmation(newPayment);

      res.status(200).json({
        success: true,
        message: "Payment processed successfully",
        data: {
          paymentId: newPayment._id,
          transactionId: paymentResult.transactionId
        }
      });
    } catch (error) {
      console.error("Payment processing error:", error);

      // Update payment status if it was created
      if (newPayment && newPayment._id) {
        newPayment.status = 'failed';
        newPayment.metadata = { error: error.message };
        await newPayment.save();
      }

      res.status(500).json({
        success: false,
        message: "Payment processing failed",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  },

  /**
   * Get payment by ID
   */
  getPayment: async (req, res) => {
    try {
      const payment = await Payment.findById(req.params.id);
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Payment not found"
        });
      }

      // Ensure user can only access their own payments unless admin
      if (payment.userId.toString() !== req.user._id.toString() && !req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized to access this payment"
        });
      }

      res.status(200).json({
        success: true,
        data: payment
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to retrieve payment",
        error: error.message
      });
    }
  },

  /**
   * Get all payments for a user
   */
  getUserPayments: async (req, res) => {
    try {
      // For admins, they can see all payments
      const query = req.user.isAdmin ? {} : { userId: req.user._id };
      
      const payments = await Payment.find(query)
        .sort({ createdAt: -1 })
        .limit(100);

      res.status(200).json({
        success: true,
        data: payments
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to retrieve payments",
        error: error.message
      });
    }
  },

  /**
   * Refund a payment
   */
  refundPayment: async (req, res) => {
    try {
      const payment = await Payment.findById(req.params.id);
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Payment not found"
        });
      }

      // Check if payment can be refunded
      if (payment.status !== 'completed') {
        return res.status(400).json({
          success: false,
          message: "Only completed payments can be refunded"
        });
      }

      // Process refund based on original payment method
      let refundResult;
      switch(payment.paymentMethod) {
        case 'stripe':
          refundResult = await processStripeRefund(payment);
          break;
        case 'paypal':
          refundResult = await processPaypalRefund(payment);
          break;
        default:
          throw new Error('Unsupported refund method');
      }

      // Update payment status
      payment.status = 'refunded';
      payment.metadata = {
        ...payment.metadata,
        refundId: refundResult.refundId,
        refundDate: new Date()
      };
      await payment.save();

      res.status(200).json({
        success: true,
        message: "Payment refunded successfully",
        data: {
          refundId: refundResult.refundId
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Refund processing failed",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
};

// Helper functions for payment processing
async function processStripePayment(payment) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(payment.amount * 100), // Stripe uses cents
      currency: payment.currency,
      description: payment.description,
      receipt_email: payment.receiptEmail,
      metadata: {
        paymentId: payment._id.toString(),
        userId: payment.userId.toString()
      }
    });

    return {
      transactionId: paymentIntent.id
    };
  } catch (error) {
    console.error("Stripe payment error:", error);
    throw error;
  }
}

async function processPaypalPayment(payment) {
  // Implement PayPal integration here
  // This is a placeholder - you would use the PayPal SDK
  return {
    transactionId: 'PAYPAL_' + Math.random().toString(36).substring(7)
  };
}

async function sendPaymentConfirmation(payment) {
  // Implement email sending logic similar to your messageController
  // This would use nodemailer to send a receipt
}

async function processStripeRefund(payment) {
  const refund = await stripe.refunds.create({
    payment_intent: payment.transactionId,
    amount: Math.round(payment.amount * 100)
  });

  return {
    refundId: refund.id
  };
}

async function processPaypalRefund(payment) {
  // Implement PayPal refund logic
  return {
    refundId: 'PAYPAL_REFUND_' + Math.random().toString(36).substring(7)
  };
}

module.exports = paymentController;