// config/emailConfig.js
module.exports = {
  service: 'gmail', // or any other email service
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || 'leonakingeneye2002@gmail.com',
    pass: process.env.EMAIL_PASS || 'kzjv qlpr rqbg udqw'
  },
  adminEmail: process.env.ADMIN_EMAIL || 'leonakingeneye2@gmail.com'
};

// In a real application, you would integrate with a payment gateway like Stripe, PayPal, etc.
// This is a mock implementation for demonstration purposes

exports.processPayment = async (paymentData) => {
  try {
    const { orderId, amount, paymentMethod, card } = paymentData;
    
    console.log(`Processing payment for order ${orderId} via ${paymentMethod}`);
    
    // Mock payment processing
    // In reality, you would call the payment gateway API here
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing delay
    
    // Mock success/failure - in reality this would come from the gateway response
    const isSuccess = Math.random() > 0.1; // 90% success rate for demo
    
    if (isSuccess) {
      return {
        success: true,
        message: 'Payment processed successfully',
        transactionId: `txn_${Math.random().toString(36).substr(2, 9)}`,
        amount,
        currency: 'USD',
        paymentMethod
      };
    } else {
      return {
        success: false,
        message: 'Payment failed: Insufficient funds',
        transactionId: null
      };
    }
  } catch (error) {
    console.error('Error in payment service:', error);
    return {
      success: false,
      message: 'Payment processing error',
      error: error.message
    };
  }
};