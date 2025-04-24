const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentControllers');
const authMiddleware = require('../middlewares/authMiddleware');
const { check } = require('express-validator');

// Verify payment before processing
router.post('/verify', 
  authMiddleware,
  [
    check('paymentMethodId').notEmpty(),
    check('amount').isFloat({ min: 90 })
  ],
  paymentController.verifyPayment
);

// Process payment
router.post('/process', 
  authMiddleware,
  [
    check('amount').isFloat({ min: 90 }).withMessage('Minimum payment is $90'),
    check('cardHolderName').notEmpty().matches(/^[a-zA-Z ]+$/),
    check('email').isEmail().normalizeEmail(),
    check('paymentMethodId').notEmpty()
  ],
  paymentController.processPayment
);

// Get payment details
router.get('/:id', authMiddleware, paymentController.getPaymentDetails);

// Get user payment history
router.get('/user/history', authMiddleware, paymentController.getUserPayments);

module.exports = router;