const express = require("express");
const bookController = require("../controllers/bookController");
const Booking = require('../models/book')
const router = express.Router();

router
  .route("/")
  .post(bookController.createBooking)
  .get(bookController.getAllBookings);

// GET /api/bookings/count
// Parameters: startDate (optional), endDate (optional)
router.get('/count', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = {};
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const count = await Booking.countDocuments(query);
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Failed to count bookings' });
  }
});

// GET /api/bookings/active-count
router.get('/active-count', async (req, res) => {
  try {
    const now = new Date();
    const count = await Booking.countDocuments({
      checkInDate: { $lte: now },
      checkOutDate: { $gte: now },
      status: 'confirmed'
    });
    
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Failed to count active bookings' });
  }
});

router
  .route("/:id")
  .get(bookController.getBooking)
  .put(bookController.updateBooking)
  .delete(bookController.deleteBooking);

module.exports = router;