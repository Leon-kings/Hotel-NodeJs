const Booking = require("../models/book");
const { sendBookingConfirmation } = require("../config/emailServices");
const mongoose = require("mongoose");
exports.createBooking = async (req, res) => {
  try {
    const {
      name,
      email,
      checkInDate,
      checkOutDate,
      adults,
      children,
      roomType,
      status,
    } = req.body;

    // Create new booking
    const newBooking = await Booking.create({
      name,
      email,
      checkInDate: new Date(checkInDate),
      checkOutDate: new Date(checkOutDate),
      adults,
      children,
      roomType,
      status,
    });

    // Send confirmation email
    await sendBookingConfirmation(newBooking);

    res.status(201).json({
      status: "success",
      data: {
        booking: newBooking,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      results: bookings.length,
      data: {
        bookings,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve bookings",
    });
  }
};

exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        status: "fail",
        message: "Booking not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        booking,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve booking",
    });
  }
};

/**
 * Get a single booking by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with booking data or error message
 */
exports.getBookingById = async (req, res) => {
  try {
    // Validate the ID parameter
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid booking ID format",
      });
    }

    // Find the booking by ID
    const booking = await Booking.findById(req.params.id)
      .select("-__v") // Exclude version key
      .lean(); // Return plain JavaScript object

    if (!booking) {
      return res.status(404).json({
        status: "fail",
        message: "No booking found with that ID",
      });
    }

    // Successful response
    res.status(200).json({
      status: "success",
      data: {
        booking,
      },
    });
  } catch (err) {
    console.error(`Error getting booking ${req.params.id}:`, err);

    // Handle specific error types
    if (err.name === "CastError") {
      return res.status(400).json({
        status: "fail",
        message: "Invalid booking ID",
      });
    }

    // Generic error response
    res.status(500).json({
      status: "error",
      message: "An error occurred while retrieving the booking",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

exports.updateBooking = async (req, res) => {
  try {
    // 1. Validate the ID parameter
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid booking ID format",
      });
    }

    // 2. Filter out disallowed fields
    const allowedUpdates = [
      "name",
      "email",
      "adults",
      "children",
      "checkInDate",
      "checkOutDate",
      "roomType",
      "status"
    ];
    const updates = Object.keys(req.body);

    const isValidOperation = updates.every((update) =>
      allowedUpdates.includes(update)
    );

    if (!isValidOperation) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid update fields detected",
      });
    }

    // 3. Find and update the booking
    const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // Return the updated document
      runValidators: true, // Run schema validators
      context: "query", // Required for proper validation
      select: "-__v", // Exclude version key
    });

    // 4. Handle case where booking wasn't found
    if (!booking) {
      return res.status(404).json({
        status: "fail",
        message: "No booking found with that ID",
      });
    }

    // 5. Successful response
    res.status(200).json({
      status: "success",
      data: {
        booking,
      },
    });
  } catch (err) {
    console.error(`Error updating booking ${req.params.id}:`, err);

    // Handle specific error types
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((val) => val.message);
      return res.status(400).json({
        status: "fail",
        message: "Validation failed",
        errors: messages,
      });
    }

    if (err.name === "CastError") {
      return res.status(400).json({
        status: "fail",
        message: "Invalid booking ID",
      });
    }

    if (err.code === 11000) {
      return res.status(400).json({
        status: "fail",
        message: "Duplicate field value entered",
      });
    }

    // Generic error response
    res.status(500).json({
      status: "error",
      message: "An error occurred while updating the booking",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);

    if (!booking) {
      return res.status(404).json({
        status: "fail",
        message: "Booking not found",
      });
    }

    res.status(204).json({
      status: "success",
      message: "successfull deleted",
      data: null,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Failed to delete booking",
    });
  }
};
