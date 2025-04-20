const express = require("express");
const router = express.Router();
const {
  createUser,
  getAllUsers,
  getUserById,
  deleteUser,
  updateUser,
  authUser
} = require("../controllers/authController");

router.get("/users", getAllUsers);
router.post("/users", createUser);
router.get("/users/:id", getUserById);
router.delete("/users/:id", deleteUser);
router.put("/users/:id", updateUser);
router.post('/users/login', authUser);


module.exports = router;
