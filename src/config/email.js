const sgMail = require('@sendgrid/mail');

// Load API key from .env
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

module.exports = async (to, subject, html) => {
  const msg = {
    to,
    from: process.env.SENDER_EMAIL, 
    subject,
    html,
  };

  try {
    await sgMail.send(msg);
    console.log("Email sent successfully");
    return { success: true };
  } catch (error) {
    console.error("SendGrid error:", error.response?.body || error.message);
    return { success: false, error };
  }
};
