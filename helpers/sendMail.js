const nodemailer = require('nodemailer');
require('dotenv').config();

const transport = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD
    }
});

const sendMail = async (from, to, subject, html) => {
    const mailOptions = {
        from: from,
        to,
        subject,
        html
    }
    transport.sendMail(mailOptions, (err, info) => {
        if(err){
            console.error(err)
        } else {
            console.log("email sent")
        }
    })
}

module.exports = sendMail;