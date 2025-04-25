const express = require("express");
const router = express.Router();
const {
  createUser,
  getAllUsers,
  getUserById,
  deleteUser,
  updateUser,
  authUser,
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
router.post("/login", authUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/verify-token", verifyToken);

module.exports = router;
