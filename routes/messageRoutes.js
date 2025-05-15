const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageControllers");
const Message = require('../models/message')
router.post("/", messageController.sendMessageToAdmin);
router.get("/", messageController.getMessages);
router.get("/:id", messageController.getMessageByID);
router.put("/:id", messageController.editMessage);
router.delete("/:id", messageController.deleteMessage);
// GET /api/messages/count
// Parameters: startDate (optional), endDate (optional)
router.get("/count", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = {};
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const count = await Message.countDocuments(query);
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: "Failed to count messages" });
  }
});

// GET /api/messages/unread-count
router.get("/unread-count", async (req, res) => {
  try {
    const count = await Message.countDocuments({ status: "unread" });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: "Failed to count unread messages" });
  }
});
router.put("/status/:id", messageController.updateStatus);
module.exports = router;
