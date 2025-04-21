const fs = require('fs');
const path = require('path');
const UserProfile = require('../models/profile');
const { uploadToCloudinary, deleteFromCloudinary } = require('../helpers/cloud');

const uploadProfile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const userId = req.user.id;
    const description = req.body.description || '';

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(req.file.path);

    // Delete the temporary file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting temporary file:', err);
    });

    // Check if user already has a profile picture and delete the old one
    const existingProfile = await UserProfile.findOne({ userId });
    if (existingProfile?.profilePicture?.publicId) {
      try {
        await deleteFromCloudinary(existingProfile.profilePicture.publicId);
      } catch (error) {
        console.error('Error deleting old image from Cloudinary:', error);
      }
    }

    // Create or update profile
    const profileData = {
      userId,
      profilePicture: {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id
      },
      description
    };

    const updatedProfile = await UserProfile.updateOrCreate(userId, profileData);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Error uploading profile:', error);
    
    // Delete the temporary file if upload failed
    if (req.file?.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting temporary file:', err);
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error uploading profile',
      error: error.message
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await UserProfile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.status(200).json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
};

module.exports = {
  uploadProfile,
  getProfile
};