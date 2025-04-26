const express = require('express');
const bookController = require('../controllers/bookController');

const router = express.Router();

router
  .route('/')
  .post(bookController.createBooking)
  .get(bookController.getAllBookings);

router
  .route('/:id')
  .get(bookController.getBooking)
  .put(bookController.updateBooking)
  .delete(bookController.deleteBooking);

module.exports = router;