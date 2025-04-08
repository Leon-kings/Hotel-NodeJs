const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const Message = require("../models/message");
const emailConfig = require("../config/emailConfig");

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
      const { name, email, subject,phone, message } = req.body;

      // Validate input
      if (!name || !email || !message) {
        return res.status(400).json({
          success: false,
          message: "Name, email, and message are required",
        });
      }

      // Save message to MongoDB
      const savedMessage = await Message.create({
        name,
        email,
        subject,
        phone,
        message,
      });

      // Verify transporter
      await transporter.verify();

      const mailOptions = {
        from: `"Contact Form" <no-reply@yourdomain.com>`,
        replyTo: `"${name}" <${email}>`,
        to: emailConfig.adminEmail,
        subject: subject || "New message from contact form",
        text: message,
        html: `
          <h2>New Message from ${name}</h2>
          <p><strong>Email:</strong> ${email}</p>
          ${subject ? `<p><strong>Subject:</strong> ${subject}</p>` : ''}
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
        `,
      };

      // Send email
      const info = await transporter.sendMail(mailOptions);
      console.log("Email sent:", info.response);

      res.status(200).json({
        success: true,
        message: "Message saved and sent successfully",
        data: savedMessage,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({
        success: false,
        message: "Failed to send message",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
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
