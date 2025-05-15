const express = require('express');
const testimonialController = require('../controllers/testimonialController');

const router = express.Router();

router.post('/', testimonialController.submitTestimonial);
router.get('/', testimonialController.getTestimonials);

module.exports = router;