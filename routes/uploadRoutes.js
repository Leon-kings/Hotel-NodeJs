const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { storage } = require('../config/cloudinary');
const multer = require('multer');
const auth = require('../middleware/auth');

const upload = multer({ storage });

router.post('/', auth, upload.single('image'), uploadController.uploadImage);
router.get('/', auth, uploadController.getUserUploads);
router.delete('/:id', auth, uploadController.deleteUpload);

module.exports = router;