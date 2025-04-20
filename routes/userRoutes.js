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

router.get("/", getAllUsers);
router.post("/", createUser);
router.get("/:id", getUserById);
router.delete("/:id", deleteUser);
router.put("/:id", updateUser);
router.post('/login', authUser);


module.exports = router;
