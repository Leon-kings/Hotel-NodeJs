const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const uploadMiddleware = require('../middlewares/uploadMiddleware');

// Apply auth to all profile routes
router.use(authMiddleware);

// Upload profile picture
router.post(
  '/',
  uploadMiddleware.single('profilePicture'),
  profileController.uploadProfile
);

// Get user profile
router.get('/', profileController.getProfile);

// Test route (optional)
router.get('/test', (req, res) => {
  res.send(`Welcome ${req.user.name}!`);
});

module.exports = router;
