const Order = require('../models/orders');
const Payment = require('../models/payment');
const { sendOrderConfirmationEmail } = require('../config/emailServices');
const { processPayment } = require('../config/emailConfig');

// Create a new order
exports.createOrder = async (req, res) => {
  try {
    const { customerEmail, totalAmount, paymentMethod, items } = req.body;


    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items in order' });
    }

    // Calculate subtotal for each item
    const orderItems = items.map(item => ({
      ...item,
      subtotal: (item.price * (item.quantity || 1)).toFixed(2)
    }));

    const order = new Order({
      customerEmail,
      totalAmount,
      paymentMethod,
      items: orderItems,
   
    });

    await order.save();

    res.status(201).json({ 
      success: true, 
      orderId: order._id,
      order
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating order',
      error: error.message 
    });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // If status is completed, send confirmation email
    if (status === 'completed') {
      await sendOrderConfirmationEmail(order);
    }

    res.json({ success: true, order });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating order',
      error: error.message 
    });
  }
};

// Get order by ID
exports.getOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId).populate('paymentId');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Verify user has access to this order
    if (order.userId.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    res.json({ success: true, order });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching order',
      error: error.message 
    });
  }
};

// Get user's orders
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate('paymentId');

    res.json({ success: true, orders });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching orders',
      error: error.message 
    });
  }
};