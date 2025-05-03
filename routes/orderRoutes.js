const express = require("express");
const router = express.Router();
const {
  createOrder,
  updateOrderStatus,
  getOrder,
  getUserOrders,
} = require("../controllers/orderController");
// const authMiddleware = require('../middlewares/auth');

// Create a new order
router.post("/", createOrder);

// Update order status (admin only)
router.put("/:orderId/status", updateOrderStatus);

// Get order by ID
router.get("/:orderId", getOrder);

// Get user's orders
router.get("/", getUserOrders);

module.exports = router;
