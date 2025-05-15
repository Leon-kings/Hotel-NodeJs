const Testimonial = require('../models/testimony');

exports.submitTestimonial = async (req, res) => {
  try {
    const { name, email, profession, text } = req.body;

    // Check if email already exists
    const existingTestimonial = await Testimonial.findOne({ email });
    if (existingTestimonial) {
      return res.status(400).json({
        status: 'fail',
        message: 'This email has already submitted a testimonial'
      });
    }

    // Save to database
    const newTestimonial = await Testimonial.create({
      name,
      email,
      profession,
      text
    });

    res.status(201).json({
      status: 'success',
      message: 'Testimonial submitted successfully!',
      data: {
        testimonial: newTestimonial
      }
    });

  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        status: 'fail',
        message: 'This email has already submitted a testimonial'
      });
    }
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!',
      error: err.message
    });
  }
};

exports.getTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find();
    res.status(200).json({
      status: 'success',
      results: testimonials.length,
      data: {
        testimonials
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!',
      error: err.message
    });
  }
};