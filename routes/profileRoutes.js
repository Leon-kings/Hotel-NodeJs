const express = require('express');
const router = express.Router();
const upload = require('../helpers/multer');
const imageController = require('../controllers/profileController');


// Image upload route
router.post('/', upload.single('avatar'), imageController.uploadImage);


module.exports = router;