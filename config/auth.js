const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail', // or any other email service
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || 'leonakingeneye2002@gmail.com',
    pass: process.env.EMAIL_PASS || 'kzjv qlpr rqbg udqw'
  },
  adminEmail: process.env.ADMIN_EMAIL || 'leonakingeneye2@gmail.com'
});

const sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: `LD <${process.env.EMAIL_FROM}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

const sendPasswordResetEmail = async (user, resetCode) => {
  const subject = 'Password Reset Code';
  const message = `Your password reset code is: ${resetCode}\nThis code is valid for 10 minutes.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Password Reset</h2>
      <p>Your password reset code is:</p>
      <div style="background: #f4f4f4; padding: 10px; margin: 10px 0; font-size: 24px; font-weight: bold; letter-spacing: 2px; text-align: center;">
        ${resetCode}
      </div>
      <p>This code is valid for 10 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
    </div>
  `;

  return await sendEmail({
    email: user.email,
    subject,
    message,
    html,
  });
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
};