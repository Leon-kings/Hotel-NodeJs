const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentControllers');
// const authMiddleware = require('../middlewares/authMiddleware');

// Process payment
router.post('/process', paymentController.processPayment);

// Get payment by ID
router.get('/:paymentId', paymentController.getPayment);

module.exports = router;