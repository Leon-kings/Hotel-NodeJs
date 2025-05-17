const express = require('express');
const testimonialController = require('../controllers/testimonialController');

const router = express.Router();

router.post('/', testimonialController.submitTestimonial);
router.get('/', testimonialController.getTestimonials);
router.put('/', testimonialController.updateTestimonial);
router.get('/', testimonialController.getTestimonialById);
router.delete('/', testimonialController.deleteTestimonial);

module.exports = router;