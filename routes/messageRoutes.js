const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageControllers");

router.post("/", messageController.sendMessageToAdmin);
router.get("/", messageController.getMessages);
router.get("/:id", messageController.getMessageByID);

module.exports = router;
