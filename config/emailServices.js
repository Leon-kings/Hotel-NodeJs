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
        <h3>Booking Details</h3>
    <div style="width: 100%; padding-right: 15px; padding-left: 15px; margin-right: auto; margin-left: auto;">
    <div style="display: flex; flex-wrap: wrap; margin-right: -15px; margin-left: -15px;">
        <div style="position: relative; width: 100%; padding-right: 15px; padding-left: 15px;">
            <div style="margin-bottom: 20px;">
                <h2 style="margin: 0; font-size: 28px; display: inline-block;">Confirmation</h2>
                <h3 style="margin: 0; float: right; font-size: 12px;">${booking.id}</h3>
            </div>
            <hr style="margin-top: 20px; margin-bottom: 20px; border: 0; border-top: 1px solid #eee;">
            <div style="display: flex; flex-wrap: wrap; margin-right: -15px; margin-left: -15px;">
                <div style="position: relative; width: 50%; padding-right: 15px; padding-left: 15px;">
                    <address style="margin-bottom: 20px; font-style: normal; line-height: 1.42857143;">
                    <strong style="font-weight: bold;">Mailed To:</strong><br>
                        ${booking.name}<br>

                        Rwanda, ST ${booking.id}
                    </address>
                </div>
                <div style="position: relative; width: 50%; padding-right: 15px; padding-left: 15px; text-align: right;">
                    <address style="margin-bottom: 20px; font-style: normal; line-height: 1.42857143;">
                    <strong style="font-weight: bold;">From:</strong><br>
                        LD Hotels<br>
                        KG 45 Ave<br>
                        67E 29S<br>
                        Kigali, 00000
                    </address>
                </div>
            </div>

    
    <div style="display: flex; flex-wrap: wrap; margin-right: -15px; margin-left: -15px;">
        <div style="position: relative; width: 100%; padding-right: 15px; padding-left: 15px;">
            <div style="margin-bottom: 20px; background-color: #fff; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 1px 1px rgba(0,0,0,.05);">
                <div style="padding: 10px 15px; border-bottom: 1px solid #ddd; border-top-left-radius: 3px; border-top-right-radius: 3px; background-color: #f5f5f5;">
                    <h3 style="margin-top: 0; margin-bottom: 0; font-size: 16px; font-weight: bold;">Booking summary</h3>
                </div>
                <div style="padding: 15px;">
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; max-width: 100%; margin-bottom: 20px; border-spacing: 0; border-collapse: collapse;">
                            <thead>
                                <tr>
                                    <td style="padding: 8px; line-height: 1.42857143; vertical-align: top; border-top: 1px solid #ddd;"><strong style="font-weight: bold;">ID</strong></td>
                                    <td style="padding: 8px; line-height: 1.42857143; vertical-align: top; border-top: 1px solid #ddd;"><strong style="font-weight: bold;">Email</strong></td>
                                    <td style="padding: 8px; line-height: 1.42857143; vertical-align: top; border-top: 1px solid #ddd; text-align: center;"><strong style="font-weight: bold;">Check In</strong></td>
                                    <td style="padding: 8px; line-height: 1.42857143; vertical-align: top; border-top: 1px solid #ddd; text-align: center;"><strong style="font-weight: bold;">Check Out</strong></td>
                                    <td style="padding: 8px; line-height: 1.42857143; vertical-align: top; border-top: 1px solid #ddd; text-align: center;"><strong style="font-weight: bold;">Room Type</strong></td>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style="padding: 8px; line-height: 1.42857143; vertical-align: top; border-top: 1px solid #ddd;">${booking.id}</td>
                                    <td style="padding: 8px; line-height: 1.42857143; vertical-align: top; border-top: 1px solid #ddd; text-align: center;">${booking.email}</td>
                                    <td style="padding: 8px; line-height: 1.42857143; vertical-align: top; border-top: 1px solid #ddd; text-align: center;">${booking.checkInDate}</td>
                                    <td style="padding: 8px; line-height: 1.42857143; vertical-align: top; border-top: 1px solid #ddd; text-align: right;">${booking.checkOutDate}</td>
                                    <td style="padding: 8px; line-height: 1.42857143; vertical-align: top; border-top: 1px solid #ddd; text-align: right;color: #000;">${booking.roomType}</td>
                                </tr>
                               
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
        
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
