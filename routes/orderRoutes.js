const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
// const authMiddleware = require('../middlewares/auth');

// Create a new order
router.post('/', orderController.createOrder);

// Update order status (admin only)
router.put('/:orderId/status', orderController.updateOrderStatus);

// Get order by ID
router.get('/:orderId', orderController.getOrder);

// Get user's orders
router.get('/', orderController.getUserOrders);

module.exports = router;