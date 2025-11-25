const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (to, subject, html, text) => {
  const msg = {
    to,
    from: process.env.SENDER_EMAIL,
    subject,
    html,
    text
  };

  try {
    await sgMail.send(msg);
    console.log("Email sent successfully");
    return true;
  } catch (error) {
    console.error("SendGrid error:", error.response?.body || error);
    return false;
  }
};

module.exports = { sendEmail };
