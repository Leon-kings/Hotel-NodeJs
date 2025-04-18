const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  logout,
  getAllUsers
} = require('../controllers/authController');
const { protect } = require('../utils/auths');
const { storage } = require('../config/cloudinary');
const multer = require('multer');

const upload = multer({ storage });

router.post('/', upload.single('profileImage'), register);
router.post('/', login);
router.get('/', getMe);
router.get('/logout', logout);
router.get('/', getAllUsers);
module.exports = router;