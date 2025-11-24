const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const { google } = require('googleapis');
const Founder = require("../models/founder.schema.js");
const Recruiter = require("../models/recruiter.schema.js");
const SoloEntrepreneur = require("../models/soloEntrepreneur.schema.js");
const { sendPasswordResetEmail, sendPasswordResetSuccessEmail, sendVerificationEmail, sendLoginAlertEmail, sendVerificationSuccessEmail } = require("../utils/sendEmail.js");
//const { sendOtpSms } = require("../utils/sendSms.js");
//const { generateOtp } = require("./services.js");
const emailTemplates = require("../../templates/emailTemplates.js");
const { sendEmail } = require("../config/email.js");

// Helper: find user across all collections
const findUserByEmail = async (email) => {
  return (
    (await Founder.findOne({ email })) ||
    (await Recruiter.findOne({ email })) ||
    (await SoloEntrepreneur.findOne({ email }))
  );
};

// Unified signup function for Founder, Recruiter, and Solo Entrepreneur
const signup = async (req, res) => {
  try {
    const { firstName, lastName, email, country, state, phoneNumber, password, role, termsAgreed } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !country || !state || !phoneNumber || !password || !role || termsAgreed === undefined) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required.'
      });
    }

    // Check if terms are agreed
    if (!termsAgreed) {
      return res.status(400).json({
        success: false,
        message: 'You must agree to the terms and conditions.'
      });
    }

    // Validate role
    const validRoles = ['Founder', 'Recruiter', 'Solo Entrepreneur'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role selected.'
      });
    }

    // Check if email already exists across all user types
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists. Please use a different email or log in.'
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');

    // Create new user based on role
    let newUser;
    if (role === 'Founder') {
      newUser = new Founder({
        firstName,
        lastName,
        email,
        country,
        state,
        phoneNumber,
        password: hashedPassword,
        role,
        termsAgreed,
        emailVerificationToken: verificationTokenHash
      });
    } else if (role === 'Recruiter') {
      newUser = new Recruiter({
        firstName,
        lastName,
        email,
        country,
        state,
        phoneNumber,
        password: hashedPassword,
        role,
        termsAgreed,
        emailVerificationToken: verificationTokenHash
      });
    } else if (role === 'Solo Entrepreneur') {
      newUser = new SoloEntrepreneur({
        firstName,
        lastName,
        email,
        country,
        state,
        phoneNumber,
        password: hashedPassword,
        role,
        termsAgreed,
        emailVerificationToken: verificationTokenHash
      });
    }

    await newUser.save();

    // Send verification email
    try {
      await sendVerificationEmail(newUser.email, verificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Continue with signup even if email fails, but log the error
    }

    res.status(201).json({
      success: true,
      message: `${role} account created successfully. Please check your email to verify your account.`,
      data: {
        user: {
          id: newUser._id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          country: newUser.country,
          state: newUser.state,
          phoneNumber: newUser.phoneNumber,
          role: newUser.role
        }
      }
    });
  } catch (error) {
    console.error('Error in unified signup:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.'
    });
  }
};

// Helper: find user by email and specific role
const findUserByEmailAndRole = async (email, role) => {
  if (role === 'founder') return await Founder.findOne({ email });
  if (role === 'recruiter') return await Recruiter.findOne({ email });
  if (role === 'soloEntrepreneur') return await SoloEntrepreneur.findOne({ email });
  return null;
};

const findUserByToken = async (resetTokenHash) => {
  const query = {
    resetPasswordToken: resetTokenHash,
    resetPasswordExpires: { $gt: Date.now() },
  };

  return (
    (await Founder.findOne(query)) ||
    (await Recruiter.findOne(query)) ||
    (await SoloEntrepreneur.findOne(query))
  );
};

// Unified login function across all collections
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in.'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '7d' }
    );

    // Send login alert email
    try {
      await sendLoginAlertEmail(user.email, {
        time: new Date().toISOString(),
        ip: req.ip,
        device: req.get('User-Agent')
      });
    } catch (emailError) {
      console.error('Failed to send login alert:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    console.error('Error in unified login:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.'
    });
  }
};

// Forgot password function
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.'
      });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set token and expiration
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send reset email
    try {
      await sendPasswordResetEmail(user.email, resetToken);
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send reset email.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Password reset email sent.'
    });
  } catch (error) {
    console.error('Error in forgot password:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.'
    });
  }
};

// Reset password function
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await findUserByToken(resetTokenHash);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token.'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Send success email
    try {
      await sendPasswordResetSuccessEmail(user.email);
    } catch (emailError) {
      console.error('Failed to send success email:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Password reset successful.'
    });
  } catch (error) {
    console.error('Error in reset password:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.'
    });
  }
};

// Verify email function
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required.'
      });
    }

    const verificationTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with matching verification token
    const user = (
      (await Founder.findOne({ emailVerificationToken: verificationTokenHash })) ||
      (await Recruiter.findOne({ emailVerificationToken: verificationTokenHash })) ||
      (await SoloEntrepreneur.findOne({ emailVerificationToken: verificationTokenHash }))
    );

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token.'
      });
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    // Send verification success email
    try {
      await sendVerificationSuccessEmail(user.email);
    } catch (emailError) {
      console.error('Failed to send verification success email:', emailError);
      // Continue with response even if email fails, but log the error
    }

    res.status(200).json({
      success: true,
      message: 'Your Email has been successfully verified!'
    });
  } catch (error) {
    console.error('Error in verify email:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.'
    });
  }
};

// Resend verification email function
const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.'
      });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified.'
      });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');

    // Set token
    user.emailVerificationToken = verificationTokenHash;
    await user.save();

    // Send verification email
    try {
      await sendVerificationEmail(user.email, verificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Verification email resent successfully.'
    });
  } catch (error) {
    console.error('Error in resend verification email:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.'
    });
  }
};

// Initiate Google OAuth - Generate OAuth URL
const initiateGoogleAuth = async (req, res) => {
  try {
    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'https://skillraft-kp96.onrender.com/api/auth/google/callback'
    );

    // Generate the url that will be used for the consent dialog
    const authorizeUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      include_granted_scopes: true,
      state: JSON.stringify({
        timestamp: Date.now()
      })
    });

    return res.status(200).json({
      success: true,
      message: "Google OAuth URL generated",
      authUrl: authorizeUrl
    });

  } catch (error) {
    console.error("Error generating Google OAuth URL:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate OAuth URL"
    });
  }
};

// Handle Google OAuth Callback
const handleGoogleCallback = async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.status(400).json({
      success: false,
      message: "OAuth authorization denied",
      error
    });
  }

  if (!code) {
    return res.status(400).json({
      success: false,
      message: "Authorization code is required"
    });
  }

  try {
    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'https://skillraft-kp96.onrender.com/api/auth/google/callback'
    );

    // Exchange authorization code for access token
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user information
    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: 'v2'
    });

    const { data } = await oauth2.userinfo.get();

    const {
      id: googleId,
      email,
      name,
      picture: avatar,
      verified_email: emailVerified
    } = data;

    if (!emailVerified) {
      return res.status(400).json({
        success: false,
        message: "Google email not verified"
      });
    }

    // Check if user exists with this Google ID
    let user = await findUserByGoogleId(googleId);

    if (!user) {
      // Check if user exists with this email (regular signup)
      user = await findUserByEmail(email);

      if (user) {
        // Link Google account to existing user
        user.googleId = googleId;
        user.provider = 'google';
        user.avatar = avatar;
        user.isEmailVerified = true; // Ensure Google users are verified
        await user.save();
      } else {
        return res.status(404).json({
          success: false,
          message: "User not found. Please sign up first."
        });
      }
    }

    // Generate JWT token
    const jwtPayload = {
      id: user._id,
      email: user.email,
      provider: user.provider,
      role: user.role
    };

    const token = await jwt.sign(jwtPayload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRATION,
    });

    return res.status(200).json({
      success: true,
      message: "Google authentication successful",
      token,
      user: {
        id: user._id,
        name: user.firstName + ' ' + user.lastName,
        email: user.email,
        avatar: user.avatar,
        provider: user.provider,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      }
    });

  } catch (error) {
    console.error("Google OAuth callback error:", error);
    return res.status(500).json({
      success: false,
      message: "Google authentication failed"
    });
  }
};

// Helper: find user by Google ID across all collections
const findUserByGoogleId = async (googleId) => {
  return (
    (await Founder.findOne({ googleId })) ||
    (await Recruiter.findOne({ googleId })) ||
    (await SoloEntrepreneur.findOne({ googleId }))
  );
};

// Unlink Google Account
const unlinkGoogle = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await findUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (user.provider === 'google' && !user.password) {
      return res.status(400).json({
        success: false,
        message: "Cannot unlink Google account without setting a password first"
      });
    }

    // Remove Google association
    user.googleId = undefined;
    user.provider = 'local';
    user.avatar = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Google account unlinked successfully"
    });

  } catch (error) {
    console.error("Error unlinking Google account:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

// Helper: find user by ID across all collections
const findUserById = async (userId) => {
  return (
    (await Founder.findById(userId)) ||
    (await Recruiter.findById(userId)) ||
    (await SoloEntrepreneur.findById(userId))
  );
};

// Set password for Google users who want to add local authentication
const setPasswordForGoogleUser = async (req, res) => {
  const { userId } = req.params;
  const { password, confirmPassword } = req.body;

  if (!password || !confirmPassword) {
    return res.status(400).json({
      success: false,
      message: "Password and confirm password are required"
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: "Passwords do not match"
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters long"
    });
  }

  try {
    const user = await findUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (user.provider !== 'google') {
      return res.status(400).json({
        success: false,
        message: "This endpoint is only for Google users"
      });
    }

    // Hash and set password
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    // Send confirmation email
    const confirmationTemplate = emailTemplates.passwordSetConfirmationTemplate(user.firstName + ' ' + user.lastName);
    await sendEmail(
      user.email,
      confirmationTemplate.subject,
      confirmationTemplate.html,
      confirmationTemplate.text
    );

    return res.status(200).json({
      success: true,
      message: "Password set successfully. You can now use both Google and email/password login."
    });

  } catch (error) {
    console.error("Error setting password for Google user:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

module.exports = {
  signup,
  login,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
  initiateGoogleAuth,
  handleGoogleCallback,
  unlinkGoogle,
  setPasswordForGoogleUser
};
