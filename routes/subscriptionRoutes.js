const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');

// Public routes
router.post('/', subscriptionController.subscribe);
router.get('/unsubscribe', subscriptionController.unsubscribe);
router.get('/check', subscriptionController.checkSubscription);

// Admin routes
router.get('/', subscriptionController.getAllSubscriptions);

module.exports = router;