const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { sendPasswordResetEmail } = require("../config/auth");
const createUser = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      res.status(400).json({
        message: "User already exists",
      });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    const newUser = await User.create({
      fullname: req.body.fullname,
      email: req.body.email,
      phone: req.body.phone,
      status: req.body.status,
      password: hashedPassword,
    });
    res.status(200).json({
      status: "success",
      newUser,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};
// Forgot password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No user found with this email",
      });
    }

    // Generate reset code
    // Fallback method
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetCodeExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Save to user
    user.passwordResetCode = resetCode;
    user.passwordResetExpires = resetCodeExpiry;
    await user.save();

    // Send email
    const emailSent = await sendPasswordResetEmail(user, resetCode);
    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: "Error sending email",
      });
    }

    res.status(200).json({
      success: true,
      message: "Password reset code sent to email",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check reset code
    if (
      user.passwordResetCode !== code ||
      user.passwordResetExpires < Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset code",
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and clear reset code
    user.password = hashedPassword;
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.status(200).json({
      status: "success",
      user,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await User.findById({ _id: req.params.id });
    if (!user) {
      res.status(404).json({
        status: "failed",
        message: "User not found",
      });
    }
    const newUser = await User.findByIdAndUpdate(req.params.id, {
      fullname: req.body.fullname,
      email: req.body.email,
      phone: req.body.phone,
      status: req.body.status,
      password: req.body.password,
    });
    res.status(200).json({
      message: "user updated successfully",
      user,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    res.status(200).json({
      status: "success",
      message: "User deleted successfully",
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({
      mesage: "success",
      users,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};

const authUser = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      res.status(404).json({
        status: "failed",
        message: "User with this email does not exist",
      });
    }
    if (await bcrypt.compare(req.body.password, user.password)) {
      res.status(200).json({
        message: "success",
        token: jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
          expiresIn: "1 day",
        }),
        user,
      });
    } else {
      res.status(400).json({
        status: "failed",
        message: "Invalid credentials",
      });
    }
  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  deleteUser,
  updateUser,
  authUser,
  forgotPassword,
  resetPassword,
};
