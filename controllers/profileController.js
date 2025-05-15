const cloudinary = require('../config/cloudinaryConfig');
const { v4: uuidv4 } = require('uuid');

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      public_id: `user_avatar_${uuidv4()}`,
      folder: 'user_avatars',
      upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET
    });

    res.status(200).json({
      url: result.secure_url,
      publicId: result.public_id
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Image upload failed', error: error.message });
  }
};