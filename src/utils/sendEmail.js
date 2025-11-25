const { sendEmail } = require('../config/email');
const emailTemplates = require('../../templates/emailTemplates');

// ================================
// Send Password Reset Email
// ================================
const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  const html = emailTemplates.passwordResetEmail(resetUrl);

  await sendEmail(
    email,
    'Password Reset Request',
    html,
    'Please reset your password using the provided link.'
  );
};

// ================================
// Send Password Reset Success Email
// ================================
const sendPasswordResetSuccessEmail = async (email) => {
  const html = emailTemplates.passwordResetSuccessEmail();

  await sendEmail(
    email,
    'Password Reset Successful',
    html,
    'Your password has been reset successfully.'
  );
};

// ================================
// Send Email Verification Email
// ================================
const sendVerificationEmail = async (email, verificationToken) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
  const html = emailTemplates.emailVerificationEmail(verificationUrl);

  await sendEmail(
    email,
    'Verify Your Email',
    html,
    'Please verify your email using the provided link.'
  );
};

// ================================
// Send Login Alert Email
// ================================
const sendLoginAlertEmail = async (email, loginDetails) => {
  const html = emailTemplates.loginAlertEmail(loginDetails);

  await sendEmail(
    email,
    'New Login Detected',
    html,
    `New login detected at time: ${loginDetails.time}, IP: ${loginDetails.ip}`
  );
};

// ================================
// Send Email Verification Success Email
// ================================
const sendVerificationSuccessEmail = async (email) => {
  const html = emailTemplates.emailVerificationSuccessEmail();

  await sendEmail(
    email,
    'Email Verification Successful',
    html,
    'Your email has been successfully verified.'
  );
};

module.exports = {
  sendPasswordResetEmail,
  sendPasswordResetSuccessEmail,
  sendVerificationEmail,
  sendLoginAlertEmail,
  sendVerificationSuccessEmail
};
