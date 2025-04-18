const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, authorize } = require('../utils/auths');
const upload = require('../config/multer'); // Assuming you have multer configured for file uploads

// Authentication routes
router.post('/', upload.single('profileImage'), authController.register);
router.post('/login', authController.login);
router.get('/logout', protect, authController.logout);

// User profile routes
router.get('/:id',authController.getMe);

// Admin routes
router.get('/', authController.getAllUser);
router.route('/:id')
  .put(protect, upload.single('profileImage'), authController.Update)
  .delete(protect, authorize('admin'), authController.Delete);

module.exports = router;