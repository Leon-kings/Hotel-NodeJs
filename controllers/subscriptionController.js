const Subscription = require('../models/subscription');
const nodemailer = require('nodemailer');
const emailConfig = require('../config/emailConfig');

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

const subscriptionController = {
  /**
   * Subscribe an email
   */
  subscribe: async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required"
        });
      }

      // Check if already subscribed
      const existing = await Subscription.findOne({ email });
      if (existing && existing.isActive) {
        return res.status(409).json({
          success: false,
          message: "This email is already subscribed"
        });
      }

      // If exists but inactive, reactivate
      if (existing && !existing.isActive) {
        existing.isActive = true;
        existing.unsubscribedAt = null;
        await existing.save();
        return res.status(200).json({
          success: true,
          message: "Subscription reactivated"
        });
      }

      // Create new subscription
      const subscription = new Subscription({
        email,
        source: req.body.source || 'website'
      });

      await subscription.save();

      // Send confirmation email
      const mailOptions = {
        from: `"Newsletter Subscription" <no-reply@yourdomain.com>`,
        to: email,
        subject: "Subscription Confirmation",
        html: `
          <h2>Thank you for subscribing!</h2>
          <p>You've successfully subscribed to our newsletter.</p>
          <p>If this wasn't you, please <a href="${process.env.BASE_URL}/api/subscriptions/unsubscribe?email=${email}">unsubscribe here</a>.</p>
        `
      };

      await transporter.sendMail(mailOptions);

      res.status(201).json({
        success: true,
        message: "Subscription successful"
      });

    } catch (error) {
      console.error("Subscription error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to process subscription",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Unsubscribe an email
   */
  unsubscribe: async (req, res) => {
    try {
      const { email } = req.query;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required"
        });
      }

      const subscription = await Subscription.findOne({ email });

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: "Email not found in subscriptions"
        });
      }

      if (!subscription.isActive) {
        return res.status(200).json({
          success: true,
          message: "Email was already unsubscribed"
        });
      }

      subscription.isActive = false;
      subscription.unsubscribedAt = new Date();
      await subscription.save();

      res.status(200).json({
        success: true,
        message: "Unsubscribed successfully"
      });

    } catch (error) {
      console.error("Unsubscription error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to process unsubscription"
      });
    }
  },

  /**
   * Get all active subscriptions (admin only)
   */
  getAllSubscriptions: async (req, res) => {
    try {
      const { activeOnly = true } = req.query;
      
      const query = {};
      if (activeOnly === 'true') {
        query.isActive = true;
      }

      const subscriptions = await Subscription.find(query).sort({ subscribedAt: -1 });
      
      res.status(200).json({
        success: true,
        count: subscriptions.length,
        data: subscriptions
      });

    } catch (error) {
      console.error("Get subscriptions error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch subscriptions"
      });
    }
  },

  /**
   * Verify if email is subscribed
   */
  checkSubscription: async (req, res) => {
    try {
      const { email } = req.query;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required"
        });
      }

      const subscription = await Subscription.findOne({ email });

      res.status(200).json({
        success: true,
        isSubscribed: subscription ? subscription.isActive : false
      });

    } catch (error) {
      console.error("Check subscription error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to check subscription status"
      });
    }
  }
};

module.exports = subscriptionController;