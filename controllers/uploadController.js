const Upload = require('../models/Upload');
const { cloudinary } = require('../config/cloudinary');

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an image file' });
    }

    const { title, description } = req.body;
    
    const upload = await Upload.create({
      title,
      description,
      imageUrl: req.file.path,
      publicId: req.file.filename,
      user: req.user.id
    });

    res.status(201).json({
      success: true,
      data: upload
    });
  } catch (err) {
    console.error(err);
    
    // If upload failed but file was uploaded to Cloudinary, delete it
    if (req.file) {
      await cloudinary.uploader.destroy(req.file.filename);
    }

    res.status(500).json({ 
      error: 'Server error during file upload',
      details: err.message 
    });
  }
};

exports.getUserUploads = async (req, res) => {
  try {
    const uploads = await Upload.find({ user: req.user.id }).sort('-createdAt');
    res.status(200).json({
      success: true,
      count: uploads.length,
      data: uploads
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteUpload = async (req, res) => {
  try {
    const upload = await Upload.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!upload) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    // Delete from Cloudinary first
    await cloudinary.uploader.destroy(upload.publicId);

    // Then delete from database
    await upload.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};