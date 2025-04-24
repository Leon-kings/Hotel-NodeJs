const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/payment');
const { sendPaymentConfirmationEmail, sendAdminPaymentNotification } = require('../config/emailServices');

const checkCardBalance = async (paymentMethodId, amount) => {
  try {
    // In a real implementation, you would check with the payment processor
    // This is a simulation - in reality Stripe handles this during payment intent creation
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    
    // Simulate balance check (in a real app you might use a different payment processor for this)
    const hasSufficientFunds = true; // Assume true for Stripe as it will decline if insufficient
    
    return {
      hasSufficientFunds,
      currency: paymentMethod.card.currency || 'usd'
    };
  } catch (error) {
    console.error('Card balance check error:', error);
    throw new Error('Unable to verify card balance');
  }
};

const processCreditCardPayment = async (paymentData) => {
  try {
    // Check minimum amount
    if (paymentData.amount < 90) {
      throw new Error('Amount must be at least $90');
    }

    // Verify card has sufficient funds
    const balanceCheck = await checkCardBalance(paymentData.paymentMethodId, paymentData.amount);
    if (!balanceCheck.hasSufficientFunds) {
      const payment = new Payment({
        ...paymentData,
        paymentStatus: 'insufficient_funds',
        failureReason: 'Insufficient funds on card'
      });
      await payment.save();
      return {
        success: false,
        error: 'Insufficient funds on card',
        paymentId: payment._id
      };
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: paymentData.amount * 100,
      currency: paymentData.currency || 'usd',
      payment_method: paymentData.paymentMethodId,
      confirm: true,
      description: paymentData.description,
      metadata: {
        userId: paymentData.userId.toString(),
        email: paymentData.email,
        cardHolderName: paymentData.cardHolderName
      },
      return_url: process.env.PAYMENT_RETURN_URL
    });

    // Handle payment intent status
    let paymentStatus, failureReason;
    switch (paymentIntent.status) {
      case 'succeeded':
        paymentStatus = 'completed';
        break;
      case 'requires_action':
        paymentStatus = 'pending';
        break;
      default:
        paymentStatus = 'failed';
        failureReason = paymentIntent.last_payment_error?.message || 'Payment failed';
    }

    // Save payment to database
    const payment = new Payment({
      userId: paymentData.userId,
      amount: paymentData.amount,
      currency: paymentData.currency || 'USD',
      paymentMethod: 'credit_card',
      cardLast4: paymentIntent.payment_method.card.last4,
      cardBrand: paymentIntent.payment_method.card.brand,
      cardHolderName: paymentData.cardHolderName,
      paymentStatus,
      failureReason,
      transactionId: paymentIntent.id,
      email: paymentData.email,
      description: paymentData.description
    });

    await payment.save();

    // Send emails for successful payments
    if (paymentStatus === 'completed') {
      await sendPaymentConfirmationEmail(paymentData.email, {
        amount: paymentData.amount,
        currency: paymentData.currency || 'USD',
        transactionId: paymentIntent.id,
        paymentMethod: 'Credit Card',
        cardHolderName: paymentData.cardHolderName,
        createdAt: new Date()
      });

      await sendAdminPaymentNotification(process.env.ADMIN_EMAIL, {
        amount: paymentData.amount,
        currency: paymentData.currency || 'USD',
        transactionId: paymentIntent.id,
        paymentMethod: 'Credit Card',
        cardHolderName: paymentData.cardHolderName,
        email: paymentData.email,
        userId: paymentData.userId,
        createdAt: new Date()
      });
    }

    return {
      success: paymentStatus === 'completed',
      requiresAction: paymentIntent.status === 'requires_action',
      clientSecret: paymentIntent.client_secret,
      paymentId: payment._id,
      transactionId: paymentIntent.id,
      status: paymentIntent.status,
      error: failureReason
    };
  } catch (error) {
    console.error('Payment processing error:', error);
    
    // Save failed payment attempt
    const payment = new Payment({
      userId: paymentData.userId,
      amount: paymentData.amount,
      currency: paymentData.currency || 'USD',
      paymentMethod: 'credit_card',
      paymentStatus: 'failed',
      failureReason: error.message,
      transactionId: `FAIL-${Date.now()}`,
      email: paymentData.email,
      description: paymentData.description
    });
    await payment.save();

    throw error;
  }
};

module.exports = {
  processCreditCardPayment,
  checkCardBalance
};