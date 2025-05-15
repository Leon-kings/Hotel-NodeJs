const express = require("express");
const User = require('../models/user')
const router = express.Router();
const {
  createUser,
  getAllUsers,
  getUserById,
  deleteUser,
  updateUser,
  authUser,
  getUserByEmail,
} = require("../controllers/authController");
const {
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const { verifyToken } = require("../controllers/verifyTokenController");
router.get("/", getAllUsers);
router.post("/", createUser);
router.get("/:id", getUserById);
router.delete("/:id", deleteUser);
router.put("/:id", updateUser);

// GET /api/users/count
// Parameters: startDate (optional), endDate (optional)
router.get('/count', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = {};
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const count = await User.countDocuments(query);
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Failed to count users' });
  }
});

// GET /api/users/recent-count
// Parameters: days (default: 1)
router.get('/recent-count', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 1;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const count = await User.countDocuments({
      createdAt: { $gte: startDate }
    });
    
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Failed to count recent users' });
  }
});
router.post("/login", authUser);
router.get("/email", getUserByEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/verify-token", verifyToken);

module.exports = router;
