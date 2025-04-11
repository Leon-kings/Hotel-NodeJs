const nodemailer = require("nodemailer");
const emailConfig = require("./emailConfig");

// Create reusable transporter
const transporter = nodemailer.createTransport(emailConfig);

// Verify connection on startup
transporter.verify((error) => {
  if (error) {
    console.error("SMTP Connection Error:", error);
  } else {
    console.log("SMTP Server is ready to send emails");
  }
});

exports.sendBookingConfirmation = async (booking) => {
  try {
    const mailOptions = {
      from: `Hotel Booking <${emailConfig.auth.user}>`,
      to: booking.email,
      subject: "Booking Confirmation",
      html: `
        <h1>Booking Confirmed</h1>
        <p>Dear ${booking.name}, with ${booking.email} , your booking is confirmed.</p>
        <table>
        <tr>
        <th>Names</th>
        <th>Email</th>
        <th>Check In Date</th>
        <th>Check Out Date</th>
        <th>Adults</th>
        <th>Children</th>
        <th>RoomType<th>
           </tr>
        <tr>
        <td>${booking.name}</td>
        <td>${booking.email}</td>
        <td>${booking.checkInDate}</td>
        <td>${booking.checkOutDate}</td>
        <td>${booking.adults}</td>
        <td>${booking.children}</td>
        <td>${booking.roomType}</td>
            </tr>
        </table>
        
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Email sending failed:", {
      error: error.message,
      stack: error.stack,
      code: error.code,
    });
    throw new Error(`Failed to send email: ${error.message}`);
  }
};
