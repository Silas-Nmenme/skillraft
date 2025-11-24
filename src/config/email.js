const nodemailer = require('nodemailer');

// Create transporter using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.sendgrid.net',
  port: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) : 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || 'apikey',
    pass: process.env.EMAIL_PASS || process.env.SENDGRID_API_KEY
  },
  authMethod: 'LOGIN',
  debug: true,
  logger: true
});

// Verify transporter configuration (only if auth credentials provided)
if ((process.env.EMAIL_USER || process.env.SENDGRID_API_KEY) && process.env.EMAIL_PASS !== '') {
  transporter.verify((error, success) => {
    if (error) {
      console.error('Email transporter verification failed:', error.message);
      console.log('Please check your email SMTP credentials and settings.');
    } else {
      console.log('Email transporter is ready to send messages');
    }
  });
} else {
  console.warn('Email credentials not provided. Email functionality will not work.');
}

module.exports = transporter;
