const { processCreditCardPayment, checkCardBalance } = require('../helpers/paymentService');
const Payment = require('../models/payment');
const User = require('../models/user');

const verifyPayment = async (req, res) => {
  try {
    const { paymentMethodId, amount } = req.body;
    const userId = req.user.id;

    // Validate inputs
    if (!paymentMethodId || !amount) {
      return res.status(400).json({ error: 'Payment method and amount are required' });
    }

    if (amount < 90) {
      return res.status(400).json({ 
        error: 'Minimum payment amount is $90',
        minimumAmount: 90
      });
    }

    // Check card balance
    const balanceCheck = await checkCardBalance(paymentMethodId, amount);
    
    if (!balanceCheck.hasSufficientFunds) {
      return res.status(400).json({ 
        error: 'Insufficient funds on card',
        code: 'insufficient_funds'
      });
    }

    res.json({
      canProceed: true,
      currency: balanceCheck.currency
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ 
      error: error.message || 'Payment verification failed',
      code: 'verification_error'
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
      description: payment.description,
      user: {
        name: payment.userId.name,
        email: payment.userId.email
      }
    };

    // Add card details if payment was via credit card
    if (payment.paymentMethod === 'credit_card') {
      paymentData.cardDetails = {
        last4: payment.cardLast4,
        brand: payment.cardBrand,
        holderName: payment.cardHolderName
      };
    }

    // Add failure reason if payment failed
    if (payment.paymentStatus === 'failed' || payment.paymentStatus === 'insufficient_funds') {
      paymentData.failureReason = payment.failureReason;
    }

    res.status(200).json({
      success: true,
      data: paymentData
    });

  } catch (error) {
    console.error('Get payment details error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error while retrieving payment details' 
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
      .lean(); // Convert to plain JS object

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
      description: payment.description,
      ...(payment.paymentMethod === 'credit_card' && {
        cardDetails: {
          last4: payment.cardLast4,
          brand: payment.cardBrand
        }
      }),
      ...((payment.paymentStatus === 'failed' || payment.paymentStatus === 'insufficient_funds') && {
        failureReason: payment.failureReason
      })
    }));

    res.status(200).json({
      success: true,
      count: formattedPayments.length,
      page,
      totalPages,
      totalPayments,
      data: formattedPayments
    });

  } catch (error) {
    console.error('Get user payments error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error while retrieving payment history' 
    });
  }
};

const processPayment = async (req, res) => {
  try {
    const { amount, currency, paymentMethodId, email, description, cardHolderName } = req.body;
    const userId = req.user.id;

    // Validate minimum amount
    if (amount < 90) {
      return res.status(400).json({ 
        error: 'Minimum payment amount is $90',
        minimumAmount: 90
      });
    }

    // Validate card holder name
    if (!cardHolderName || !/^[a-zA-Z ]+$/.test(cardHolderName)) {
      return res.status(400).json({ error: 'Valid card holder name is required' });
    }

    // Check user and email
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.isVerified) {
      return res.status(403).json({ error: 'Please verify your email before making payments' });
    }
    if (email !== user.email) {
      return res.status(400).json({ error: 'Payment email must match registered email' });
    }

    // Process payment
    const paymentData = {
      userId,
      amount,
      currency,
      paymentMethodId,
      email,
      description,
      cardHolderName
    };

    const result = await processCreditCardPayment(paymentData);

    if (result.success) {
      return res.json({
        message: 'Payment processed successfully',
        paymentId: result.paymentId,
        transactionId: result.transactionId
      });
    } else if (result.requiresAction) {
      return res.json({
        requiresAction: true,
        clientSecret: result.clientSecret,
        paymentId: result.paymentId
      });
    } else {
      return res.status(400).json({
        error: result.error || 'Payment failed',
        paymentId: result.paymentId,
        code: 'payment_failed'
      });
    }
  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({ 
      error: error.message || 'Payment processing failed',
      code: 'processing_error'
    });
  }
};

// ... other controller methods (getPaymentDetails, getUserPayments) ...

module.exports = {
  verifyPayment,
  processPayment,
  getPaymentDetails,
  getUserPayments
};