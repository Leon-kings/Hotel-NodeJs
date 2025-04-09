const nodemailer = require('nodemailer');
const emailConfig = require('./emailConfig');

// Create reusable transporter
const transporter = nodemailer.createTransport(emailConfig);

// Verify connection on startup
transporter.verify((error) => {
  if (error) {
    console.error('SMTP Connection Error:', error);
  } else {
    console.log('SMTP Server is ready to send emails');
  }
});

exports.sendBookingConfirmation = async (booking) => {
  try {
    const mailOptions = {
      from: `Hotel Booking <${emailConfig.auth.user}>`,
      to: booking.email,
      subject: 'Booking Confirmation',
      html: `
        <h1>Booking Confirmed</h1>
        <p>Dear ${booking.name}, your booking is confirmed.</p>
        <!-- Include other booking details -->
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email sending failed:', {
      error: error.message,
      stack: error.stack,
      code: error.code
    });
    throw new Error(`Failed to send email: ${error.message}`);
  }
};