// config/emailConfig.js
module.exports = {
  service: 'gmail', // or any other email service
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || 'leonakingeneye2002@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'kzjv qlpr rqbg udqw'
  },
  adminEmail: process.env.ADMIN_EMAIL || 'leonakingeneye2@gmail.com'
};