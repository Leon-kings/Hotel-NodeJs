const nodemailer = require("nodemailer");
const emailConfig = require("./emailConfig");
const Message = require('../models/message');
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

const generateCustomerEmail = (booking) => {
  return `
    <h1>Booking Confirmed</h1>
    <p>Dear ${booking.name}, your booking is confirmed.</p>
    <h3>Booking Details</h3>
    <div style="width: 100%; padding-right: 15px; padding-left: 15px; margin-right: auto; margin-left: auto;">
      <div style="display: flex; flex-wrap: wrap; margin-right: -15px; margin-left: -15px;">
        <div style="position: relative; width: 100%; padding-right: 15px; padding-left: 15px;">
          <div style="margin-bottom: 20px;">
            <h2 style="margin: 0; font-size: 28px; display: inline-block;">Confirmation</h2>
            
          </div>
          <hr style="margin-top: 20px; margin-bottom: 20px; border: 0; border-top: 1px solid #eee;">
          <div style="display: flex; flex-wrap: wrap; margin-right: -5px; margin-left: -5px;">
            <div style="position: relative; width: 50%; padding-right: 5px; padding-left: 5px;">
              <address style="margin-bottom: 20px; font-style: normal; line-height: 1.42857143;">
                <strong style="font-weight: bold;">Mailed To:</strong><br>
                ${booking.name}<br>
                ${booking.email}<br>
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
                <div style="padding: 10px;">
                  <div style="overflow-x: auto;">
                    <table style="width: 100%; max-width: 100%; margin-bottom: 20px; border-spacing: 0; border-collapse: collapse;">
                      <thead>
                        <tr>
                          <td style="padding: 8px; line-height: 1.42857143; vertical-align: top; border-top: 1px solid #ddd;"><strong>ID</strong></td>
                          <td style="padding: 8px; line-height: 1.42857143; vertical-align: top; border-top: 1px solid #ddd;"><strong>Email</strong></td>
                          <td style="padding: 8px; line-height: 1.42857143; vertical-align: top; border-top: 1px solid #ddd; text-align: center;"><strong>Check In</strong></td>
                          <td style="padding: 8px; line-height: 1.42857143; vertical-align: top; border-top: 1px solid #ddd; text-align: center;"><strong>Check Out</strong></td>
                          <td style="padding: 8px; line-height: 1.42857143; vertical-align: top; border-top: 1px solid #ddd; text-align: center;"><strong>Room Type</strong></td>
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
      </div>
    </div>
  `;
};

const generateAdminNotification = (booking) => {
  return `
    <h1>New Booking Notification</h1>
    <p>A new booking has been made by ${booking.name} (${booking.email}).</p>
    
    <h3>Booking Details</h3>
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Booking ID:</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${booking.id}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Guest Name:</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${booking.name}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Email:</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${booking.email}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Check-In:</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${booking.checkInDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Check-Out:</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${booking.checkOutDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Room Type:</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${booking.roomType}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Guests:</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${booking.guests || 1}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Special Requests:</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${booking.specialRequests || 'None'}</td>
        </tr>
      </table>
    </div>
    
    <p style="margin-top: 20px;">
      <a href="https://ld-hotels.vercel.app/bookings/${booking.id}" 
         style="background-color: #007bff; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">
        View Booking in Dashboard
      </a>
    </p>
  `;
};

exports.sendBookingConfirmation = async (booking) => {
  try {
    // Send confirmation to customer
    const customerMailOptions = {
      from: `LD Hotels <${emailConfig.auth.user}>`,
      to: booking.email,
      subject: "Your Booking Confirmation",
      html: generateCustomerEmail(booking)
    };

    // Send notification to admin
    const adminMailOptions = {
      from: `LD Hotels Booking System <${emailConfig.auth.user}>`,
      to: process.env.ADMIN_EMAIL || 'leonakingeneye2002@gmail.com', // Fallback to default admin email
      subject: `New Booking: ${booking.name} - ${booking.id}`,
      html: generateAdminNotification(booking)
    };

    // Send both emails in parallel
    const [customerInfo, adminInfo] = await Promise.all([
      transporter.sendMail(customerMailOptions),
      transporter.sendMail(adminMailOptions)
    ]);

    console.log("Customer email sent:", customerInfo.messageId);
    console.log("Admin notification sent:", adminInfo.messageId);
    
    return {
      customerEmail: customerInfo,
      adminEmail: adminInfo
    };
  } catch (error) {
    console.error("Email sending failed:", {
      error: error.message,
      stack: error.stack,
      code: error.code,
    });
    throw new Error(`Failed to send emails: ${error.message}`);
  }
};
exports.sendMessageToAdmin = async (messageData) => {
  try {
    // Save message to database first
    const savedMessage = await Message.create({
      name: messageData.name,
      email: messageData.email,
      subject: messageData.subject,
      phone: messageData.phone,
      message: messageData.message
    });

    // Email to customer (acknowledgment)
    const customerMailOptions = {
      from: `LD Hotels Contact <${emailConfig.auth.user}>`,
      to: messageData.email,
      subject: "We've Received Your Message",
      html: generateCustomerAcknowledgement(messageData),
      headers: {
        'X-Priority': '3',
        'X-Mailer': 'NodeMailer',
        'List-Unsubscribe': `<mailto:${emailConfig.unsubscribeEmail}?subject=Unsubscribe>`
      }
    };

    // Email to admin (notification)
    const adminMailOptions = {
      from: `LD Hotels Contact System <${emailConfig.auth.user}>`,
      to: process.env.ADMIN_EMAIL || 'leonakingeneye2002@gmail.com',
      subject: messageData.subject || `New Message from ${messageData.name}`,
      html: generateAdminNotification(messageData),
      headers: {
        'X-Priority': '1',
        'Importance': 'high'
      }
    };

    // Send both emails in parallel with retry logic
    const [customerInfo, adminInfo] = await Promise.all([
      sendWithRetry(transporter, customerMailOptions),
      sendWithRetry(transporter, adminMailOptions)
    ]);

    console.log("Customer acknowledgment sent:", customerInfo.messageId);
    console.log("Admin notification sent:", adminInfo.messageId);

    return {
      message: savedMessage,
      customerEmail: customerInfo,
      adminEmail: adminInfo
    };
  } catch (error) {
    console.error("Message processing failed:", {
      error: error.message,
      stack: error.stack,
      code: error.code,
      timestamp: new Date().toISOString()
    });
    throw new EnhancedError('MESSAGE_PROCESSING_FAILED', error.message);
  }
};

// Helper function with retry logic
async function sendWithRetry(mailer, options, maxRetries = 3) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await mailer.sendMail(options);
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt)); // Exponential backoff
    }
  }
}

// Email template generators
function generateCustomerAcknowledgement(message) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #2c3e50;">Thank You for Contacting LD Hotels</h2>
      <p>Dear ${message.name},</p>
      <p>We've received your message and will respond within 24-48 hours.</p>
      
      <div style="background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-left: 4px solid #3498db;">
        <p><strong>Your Message:</strong></p>
        <p>${message.message.replace(/\n/g, '<br>')}</p>
      </div>
      
      <p style="font-size: 12px; color: #7f8c8d;">
        This is an automated response. Please do not reply to this email.
      </p>
    </div>
  `;
}

function generateAdminMessage(message) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #c0392b;">New Contact Form Submission</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width: 120px;">From:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${message.name}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Email:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${message.email}</td>
        </tr>
        ${message.phone ? `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Phone:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${message.phone}</td>
        </tr>
        ` : ''}
        ${message.subject ? `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Subject:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${message.subject}</td>
        </tr>
        ` : ''}
        <tr>
          <td colspan="2" style="padding: 8px; font-weight: bold;">Message:</td>
        </tr>
        <tr>
          <td colspan="2" style="padding: 8px; white-space: pre-line;">${message.message}</td>
        </tr>
      </table>
      <p style="margin-top: 20px;">
        <a href="mailto:${message.email}?subject=Re: ${message.subject || 'Your message'}" 
           style="background-color: #3498db; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">
          Reply to ${message.name}
        </a>
      </p>
    </div>
  `;
}
// payment part********************
exports.sendPaymentConfirmationEmail = async (userEmail, paymentDetails) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@yourdomain.com',
    to: userEmail,
    subject: 'Payment Confirmation',
    html: `
      <h1>Thank you for your payment!</h1>
      <p>We have received your payment of ${paymentDetails.amount} ${paymentDetails.currency}.</p>
      <p>Transaction ID: ${paymentDetails.transactionId}</p>
      <p>Payment Method: ${paymentDetails.paymentMethod}</p>
      <p>Date: ${paymentDetails.createdAt.toLocaleString()}</p>
      <p>If you have any questions, please contact our support team.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Payment confirmation email sent to user');
  } catch (error) {
    console.error('Error sending payment confirmation email to user:', error);
  }
};

const sendAdminPaymentNotification = async (adminEmail, paymentDetails) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@yourdomain.com',
    to: adminEmail,
    subject: 'New Payment Received',
    html: `
      <h1>New Payment Notification</h1>
      <p>A new payment has been received:</p>
      <ul>
        <li>Amount: ${paymentDetails.amount} ${paymentDetails.currency}</li>
        <li>User Email: ${paymentDetails.email}</li>
        <li>Transaction ID: ${paymentDetails.transactionId}</li>
        <li>Payment Method: ${paymentDetails.paymentMethod}</li>
        <li>Date: ${paymentDetails.createdAt.toLocaleString()}</li>
      </ul>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Payment notification email sent to admin');
  } catch (error) {
    console.error('Error sending payment notification email to admin:', error);
  }
};

// Custom error class
class EnhancedError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.timestamp = new Date().toISOString();
  }
}