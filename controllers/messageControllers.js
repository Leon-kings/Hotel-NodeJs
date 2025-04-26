const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const Message = require("../models/message");
const emailConfig = require("../config/emailConfig");
const { sendMessageToAdmin } = require('../config/emailServices');
// Create transporter
const transporter = nodemailer.createTransport({
  service: emailConfig.service,
  host: emailConfig.host,
  port: emailConfig.port,
  secure: emailConfig.secure,
  auth: {
    user: emailConfig.auth.user,
    pass: emailConfig.auth.pass,
  },
});

const messageController = {
  /**
   * Send a message to admin email and save it to MongoDB
   */
  sendMessageToAdmin: async (req, res) => {
  try {
    const { name, email, subject, phone, message, status } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and message are required fields"
      });
    }

    // Save to database
    const newMessage = await Message.create({
      name,
      email,
      subject,
      phone,
      message,
      status,
    });

    // Send emails
    const emailResult = await sendMessageToAdmin(newMessage.toObject());

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: {
        message: newMessage,
        emailStatus: {
          customer: emailResult.customerEmail ? "sent" : "failed",
          admin: emailResult.adminEmail ? "sent" : "failed"
        }
      }
    });

  } catch (error) {
    console.error("Message creation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process message",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
},
  /**
   * Get all messages
   */
  getMessages: async (req, res) => {
    try {
      const messages = await Message.find().sort({ createdAt: -1 });
      res.status(200).json({
        success: true,
        data: messages,
      });
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve messages",
      });
    }
  },

  /**
   * Get a single message by ID
   */
  getMessageByID: async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid message ID",
        });
      }

      const message = await Message.findById(id);
      if (!message) {
        return res.status(404).json({
          success: false,
          message: "Message not found",
        });
      }

      res.status(200).json({
        success: true,
        data: message,
      });
    } catch (error) {
      console.error("Error fetching message by ID:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve the message",
      });
    }
  },

  // ***

  editMessage: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, message } = req.body;

      // Check if message exists
      const existingMessage = await Message.findById(id);
      if (!existingMessage) {
        return res.status(404).json({
          success: false,
          message: "Message not found",
        });
      }

      // Prepare update object with only allowed fields
      const updateFields = {
        updatedAt: new Date()
      };

      // Only add status to update if it was provided
      if (status !== undefined) {
        updateFields.status = status;
      }

      // Only add message to update if it was provided
      if (message !== undefined) {
        updateFields.message = message;
      }

      // Check if at least one field is being updated
      if (Object.keys(updateFields).length === 1) { // only updatedAt was added
        return res.status(400).json({
          success: false,
          message: "No valid fields to update (only status or message are allowed)",
        });
      }

      // Update the message
      const updatedMessage = await Message.findByIdAndUpdate(
        id,
        updateFields,
        { new: true, runValidators: true }
      );

      res.status(200).json({
        success: true,
        message: "Message updated successfully",
        data: updatedMessage,
      });
    } catch (error) {
      console.error("Error updating message:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update message",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },
  // **
  
  deleteMessage: async (req, res) => {
    try {
      const { id } = req.params;

      // Check if message exists
      const existingMessage = await Message.findById(id);
      if (!existingMessage) {
        return res.status(404).json({
          success: false,
          message: "Message not found",
        });
      }

      // Delete the message
      await Message.findByIdAndDelete(id);

      res.status(200).json({
        success: true,
        message: "Message deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting message:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete message",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
,


  /**
   * Verify email connection (optional for app startup)
   */
  verifyEmailConnection: async () => {
    try {
      await transporter.verify();
      console.log("Email transporter is ready to send messages.");
    } catch (error) {
      console.error("Email transporter verification failed:", error);
    }
  },
};

// Optionally verify connection on app start
messageController.verifyEmailConnection();

module.exports = messageController;
