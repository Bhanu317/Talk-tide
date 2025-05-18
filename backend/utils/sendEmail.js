const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
dotenv.config();

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    port: 465,
    secure: true,
    debug: true,
    secureConnection: false,
    auth: {
      user: process.env.EMAIL_USER, // Your email address
      pass: process.env.EMAIL_PASS, // Your email password
    },
    tls: {
      rejectUnauthorized: true,
    },
  });

  const mailOptions = {
    from: "TalkTide",
    to: options.email,
    subject: options.subject,
    text: options.message,
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

module.exports = sendEmail;
