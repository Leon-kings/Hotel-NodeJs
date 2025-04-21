const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const authMiddleware = require('../middlewares/authMiddleware');
const uploadMiddleware = require('../middlewares/uploadMiddleware');

// Protected routes
router.use(authMiddleware);

// Upload profile picture with description
router.post(
  '/',
  uploadMiddleware.single('profilePicture'),
  profileController.uploadProfile
);

// Get user profile
router.get('/', profileController.getProfile);

module.exports = router;