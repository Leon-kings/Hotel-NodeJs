const { processCreditCardPayment, checkCardBalance } = require('../helpers/paymentService');
const Payment = require('../models/payment');
const User = require('../models/user');
const mongoose = require('mongoose');

/**
 * @desc    Verify payment before processing
 * @route   POST /api/payments/verify
 * @access  Private
 */
const verifyPayment = async (req, res) => {
  try {
    const { paymentMethodId, amount, cardNumber, paymentMethod } = req.body;
    const userId = req.user.id;

    // Validate inputs
    if (!paymentMethodId || !amount || !paymentMethod) {
      return res.status(400).json({ 
        success: false,
        error: 'Payment method, payment method ID and amount are required' 
      });
    }

    if (amount < 90) {
      return res.status(400).json({ 
        success: false,
        error: 'Minimum payment amount is $90',
        minimumAmount: 90
      });
    }

    // Validate card number if credit card payment
    if (paymentMethod === 'credit_card') {
      if (!cardNumber) {
        return res.status(400).json({ 
          success: false,
          error: 'Card number is required for credit card payments' 
        });
      }
      
      const cleanedCardNumber = cardNumber.replace(/[-\s]/g, '');
      if (!/^[0-9]{13,19}$/.test(cleanedCardNumber)) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid card number format' 
        });
      }
    }

    // Check card balance
    const balanceCheck = await checkCardBalance({
      paymentMethodId,
      amount,
      cardNumber: paymentMethod === 'credit_card' ? cardNumber.replace(/[-\s]/g, '') : undefined,
      userId,
      paymentMethod
    });
    
    if (!balanceCheck.success) {
      return res.status(400).json({ 
        success: false,
        error: balanceCheck.error || 'Payment verification failed',
        code: balanceCheck.code || 'verification_failed'
      });
    }

    if (!balanceCheck.hasSufficientFunds) {
      return res.status(400).json({ 
        success: false,
        error: 'Insufficient funds on payment method',
        code: 'insufficient_funds'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        canProceed: true,
        currency: balanceCheck.currency || 'USD',
        requiresAction: balanceCheck.requiresAction || false,
        paymentMethod
      }
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Payment verification failed',
      code: 'verification_error'
    });
  }
};

/**
 * @desc    Process a payment
 * @route   POST /api/payments/process
 * @access  Private
 */
const processPayment = async (req, res) => {
  try {
    const { 
      amount, 
      currency, 
      paymentMethodId, 
      email, 
      description, 
      cardHolderName, 
      cardNumber,
      paymentMethod
    } = req.body;
    
    const userId = req.user.id;

    // Validate minimum amount
    if (amount < 90) {
      return res.status(400).json({ 
        success: false,
        error: 'Minimum payment amount is $90',
        minimumAmount: 90
      });
    }

    // Validate card holder name if credit card
    if (paymentMethod === 'credit_card') {
      if (!cardHolderName || !/^[a-zA-Z ]+$/.test(cardHolderName)) {
        return res.status(400).json({ 
          success: false,
          error: 'Valid card holder name is required' 
        });
      }

      if (!cardNumber) {
        return res.status(400).json({ 
          success: false,
          error: 'Card number is required for credit card payments' 
        });
      }

      const cleanedCardNumber = cardNumber.replace(/[-\s]/g, '');
      if (!/^[0-9]{13,19}$/.test(cleanedCardNumber)) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid card number format' 
        });
      }
    }

    // Check user and email
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }
    
    if (!user.isVerified) {
      return res.status(403).json({ 
        success: false,
        error: 'Please verify your email before making payments' 
      });
    }
    
    if (email !== user.email) {
      return res.status(400).json({ 
        success: false,
        error: 'Payment email must match registered email' 
      });
    }

    // Process payment
    const paymentData = {
      userId,
      amount,
      currency: currency || 'USD',
      paymentMethodId,
      paymentMethod: paymentMethod || 'credit_card',
      email,
      description,
      cardHolderName,
      cardNumber: paymentMethod === 'credit_card' ? cardNumber.replace(/[-\s]/g, '') : undefined
    };

    const result = await processCreditCardPayment(paymentData);

    if (result.success) {
      return res.status(200).json({
        success: true,
        data: {
          message: 'Payment processed successfully',
          paymentId: result.paymentId,
          transactionId: result.transactionId,
          amount: result.amount,
          currency: result.currency
        }
      });
    } else if (result.requiresAction) {
      return res.status(200).json({
        success: true,
        data: {
          requiresAction: true,
          clientSecret: result.clientSecret,
          paymentId: result.paymentId
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error || 'Payment failed',
        paymentId: result.paymentId,
        code: result.code || 'payment_failed'
      });
    }
  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Payment processing failed',
      code: 'processing_error'
    });
  }
};

/**
 * @desc    Get details of a specific payment
 * @route   GET /api/payments/:id
 * @access  Private (User who made payment or Admin)
 */
const getPaymentDetails = async (req, res) => {
  try {
    // Validate payment ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid payment ID format' 
      });
    }

    // Find payment and populate user details
    const payment = await Payment.findById(req.params.id)
      .populate('userId', 'name email');

    // Check if payment exists
    if (!payment) {
      return res.status(404).json({ 
        success: false,
        error: 'Payment not found' 
      });
    }

    // Verify the requesting user owns this payment or is admin
    if (payment.userId._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        error: 'Not authorized to access this payment' 
      });
    }

    // Format response data
    const paymentData = {
      _id: payment._id,
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
      paymentStatus: payment.paymentStatus,
      transactionId: payment.transactionId,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      description: payment.description,
      user: {
        id: payment.userId._id,
        name: payment.userId.name,
        email: payment.userId.email
      }
    };

    // Add card details if payment was via credit card
    if (payment.paymentMethod === 'credit_card') {
      paymentData.cardDetails = {
        last4: payment.cardNumber ? payment.cardNumber.slice(-4) : null,
        brand: getCardBrand(payment.cardNumber),
        holderName: payment.cardHolderName,
        expiry: payment.cardExpiry // Assuming you store this field
      };
    }

    // Add failure reason if payment failed
    if (payment.paymentStatus === 'failed' || payment.paymentStatus === 'insufficient_funds') {
      paymentData.failureReason = payment.failureReason;
      paymentData.failureCode = payment.failureCode;
    }

    res.status(200).json({
      success: true,
      data: paymentData
    });

  } catch (error) {
    console.error('Get payment details error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error while retrieving payment details',
      code: 'server_error'
    });
  }
};

/**
 * @desc    Get all payments for logged in user
 * @route   GET /api/payments/user/history
 * @access  Private
 */
const getUserPayments = async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Sorting (-1 for descending, 1 for ascending)
    const sortBy = req.query.sortBy || '-createdAt';
    
    // Filtering
    const filter = { userId: req.user.id };
    if (req.query.status) {
      filter.paymentStatus = req.query.status;
    }
    if (req.query.method) {
      filter.paymentMethod = req.query.method;
    }
    if (req.query.startDate && req.query.endDate) {
      filter.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    // Get payments with pagination
    const payments = await Payment.find(filter)
      .sort(sortBy)
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email')
      .lean();

    // Get total count for pagination info
    const totalPayments = await Payment.countDocuments(filter);
    const totalPages = Math.ceil(totalPayments / limit);

    // Format response data
    const formattedPayments = payments.map(payment => ({
      _id: payment._id,
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
      paymentStatus: payment.paymentStatus,
      transactionId: payment.transactionId,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      description: payment.description,
      ...(payment.paymentMethod === 'credit_card' && {
        cardDetails: {
          last4: payment.cardNumber ? payment.cardNumber.slice(-4) : null,
          brand: getCardBrand(payment.cardNumber),
          holderName: payment.cardHolderName
        }
      }),
      ...((payment.paymentStatus === 'failed' || payment.paymentStatus === 'insufficient_funds') && {
        failureReason: payment.failureReason,
        failureCode: payment.failureCode
      })
    }));

    res.status(200).json({
      success: true,
      data: {
        payments: formattedPayments,
        pagination: {
          count: formattedPayments.length,
          page,
          totalPages,
          totalPayments,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get user payments error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error while retrieving payment history',
      code: 'server_error'
    });
  }
};

/**
 * Helper function to determine card brand from number
 */
function getCardBrand(cardNumber) {
  if (!cardNumber) return null;
  
  const cleaned = cardNumber.replace(/\D/g, '');
  const firstTwo = cleaned.slice(0, 2);
  const firstFour = cleaned.slice(0, 4);
  
  // Visa
  if (/^4/.test(cleaned)) return 'visa';
  
  // Mastercard
  if ((/^5[1-5]/.test(cleaned)) || 
      (firstFour >= '2221' && firstFour <= '2720')) {
    return 'mastercard';
  }
  
  // American Express
  if (/^3[47]/.test(cleaned)) return 'amex';
  
  // Discover
  if (/^6(?:011|5)/.test(cleaned)) return 'discover';
  
  // Diners Club
  if (/^3(?:0[0-5]|[68])/.test(cleaned)) return 'diners';
  
  // JCB
  if (/^35(2[89]|[3-8])/.test(cleaned)) return 'jcb';
  
  return 'unknown';
}

module.exports = {
  verifyPayment,
  processPayment,
  getPaymentDetails,
  getUserPayments
};