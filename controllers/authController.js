const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

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
      fullname: req.body.name,
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
      fullname: req.body.name,
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
};
