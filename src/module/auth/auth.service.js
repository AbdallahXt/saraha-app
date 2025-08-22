import User from '../../DB/model/user.model.js';
import Token from '../../DB/model/tooken.model.js';
import RefreshToken from '../../DB/model/refreshToken.model.js';
import jwt from 'jsonwebtoken';
import { hashPassword, comparePassword } from '../../utils/crypto/index.js';
import { AppError } from '../../utils/error/index.js';
import { sendMail } from '../../utils/email/index.js';
import { v4 as uuidv4 } from 'uuid';

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { id: userId, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  
  const refreshToken = jwt.sign(
    { id: userId, type: 'refresh' },
    process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET + '_refresh',
    { expiresIn: '30d' }
  );
  
  return { accessToken, refreshToken };
};

export const register = async (req, res) => {
  const { username, email, password } = req.body;
  
  console.log(`📝 Registration attempt: ${username}, ${email}`);
  
  // Check for existing user with case-insensitive search
  const exists = await User.findOne({ 
    $or: [
      { email: { $regex: new RegExp(`^${email}$`, 'i') } },
      { username: { $regex: new RegExp(`^${username}$`, 'i') } }
    ] 
  });
  
  if (exists) {
    console.log(`❌ User already exists: ${exists.email} or ${exists.username}`);
    throw new AppError('User already exists', 400);
  }
  
  const hashed = await hashPassword(password);
  
  // Generate OTP for email verification
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  // Create user with OTP verification
  const user = await User.create({ 
    username, 
    email: email.toLowerCase(), // Store email in lowercase for consistency
    password: hashed, 
    isVerified: false,
    verified: false,
    otp,
    otpExpires,
    refreshTokens: []
  });

  console.log(`✅ User created successfully: ${user._id}`);
  console.log(`📧 OTP generated: ${otp}, Expires: ${new Date(otpExpires).toLocaleString()}`);

  // Send OTP email - Always log to console for development/testing
  try {
    console.log(`\n📧 Sending verification OTP to: ${email}`);
    console.log(`🔑 OTP for ${email}: ${otp}`);
    console.log('💡 For development: OTP is logged to console instead of sending email');
    
    // Try to send email if configured, but don't fail if not configured
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const mailOptions = {
        from: `"Saraha App" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Email Verification OTP',
        text: `Your verification OTP is: ${otp}. It will expire in 10 minutes.`
      };
      
      const info = await sendMail(mailOptions);
      console.log('Verification email sent successfully. Message ID:', info.messageId);
    } else {
      console.log('ℹ️  Email not configured - OTP available in console for testing');
    }
    
  } catch (error) {
    console.error('⚠️  Email sending failed (expected in development):');
    console.error('Error:', error.message);
    console.log('📝 OTP for testing:', otp);
    // Don't delete user - just log the error and continue
  }

  return res.status(201).json({ 
    success: true, 
    message: 'Registration successful! Please check your email for verification OTP.',
    user: {
      id: user._id,
      username: user.username,
      email: user.email
    },
    otp: process.env.NODE_ENV === 'development' ? otp : undefined // Return OTP in development for testing
  });
};

export const verifyAccount = async (req, res) => {
  const { email, otp } = req.body;
  
  // Log the verification attempt for debugging
  console.log(`🔍 Verification attempt for email: ${email}, OTP: ${otp}`);
  
  // Find user with case-insensitive email search and include OTP fields
  const user = await User.findOne({ 
    email: { $regex: new RegExp(`^${email}$`, 'i') } 
  }).select('+otp +otpExpires');
  
  if (!user) {
    console.log(`❌ User not found for email: ${email}`);
    // Check if any user exists with similar email (case insensitive)
    const similarUsers = await User.find({ 
      email: { $regex: email, $options: 'i' } 
    });
    
    if (similarUsers.length > 0) {
      console.log(`ℹ️  Found similar emails: ${similarUsers.map(u => u.email).join(', ')}`);
    }
    
    throw new AppError('User not found', 404);
  }
  
  console.log(`✅ User found: ${user.email}, Verified: ${user.verified}`);
  
  if (user.verified) {
    console.log(`ℹ️  User ${user.email} is already verified`);
    throw new AppError('Already verified', 400);
  }
  
  // Check OTP validity
  const currentTime = Date.now();
  console.log(`⏰ OTP check - Current: ${currentTime}, Expires: ${user.otpExpires}`);
  
  if (!user.otp) {
    console.log(`❌ No OTP found for user ${user.email}`);
    throw new AppError('No OTP found. Please request a new one.', 400);
  }
  
  if (user.otpExpires < currentTime) {
    console.log(`❌ OTP expired for user ${user.email}`);
    throw new AppError('OTP has expired. Please request a new one.', 400);
  }
  
  if (user.otp !== otp) {
    console.log(`❌ Invalid OTP for user ${user.email}. Expected: ${user.otp}, Received: ${otp}`);
    throw new AppError('Invalid OTP', 400);
  }
  
  // Mark user as verified and clear OTP fields
  user.verified = true;
  user.otp = undefined;
  user.otpExpires = undefined;
  
  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user._id);
  
  // Initialize tokens array if it doesn't exist
  if (!user.refreshTokens) {
    user.refreshTokens = [];
  }
  
  // Store hashed refresh token
  const hashedRefreshToken = await hashPassword(refreshToken);
  user.refreshTokens.push(hashedRefreshToken);
  
  // Keep only the last 5 refresh tokens (for security)
  if (user.refreshTokens.length > 5) {
    user.refreshTokens.shift();
  }
  
  await user.save();
  
  // Set refresh token as HTTP-only cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });
  
  res.json({ 
    success: true, 
    message: 'Account verified successfully',
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar
    }
  });
};

export const resendOtp = async (req, res) => {
  const { email } = req.body;
  
  console.log(`🔄 Resend OTP request for email: ${email}`);
  
  // Find user with case-insensitive email search and include OTP fields
  const user = await User.findOne({ 
    email: { $regex: new RegExp(`^${email}$`, 'i') } 
  }).select('+otp +otpExpires');
  
  if (!user) {
    console.log(`❌ User not found for email: ${email}`);
    throw new AppError('User not found', 404);
  }
  
  console.log(`✅ User found for OTP resend: ${user.email}`);
  
  // Generate new OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  user.otp = otp;
  user.otpExpires = otpExpires;
  await user.save();
  
  console.log(`📧 New OTP generated for ${user.email}: ${otp}`);
  console.log(`⏰ OTP expires at: ${new Date(otpExpires).toLocaleString()}`);
  
  // Send OTP email - Always log to console for development/testing
  try {
    console.log(`\n📧 Sending verification OTP to: ${user.email}`);
    console.log(`🔑 OTP for ${user.email}: ${otp}`);
    console.log('💡 For development: OTP is logged to console instead of sending email');
    
    // Try to send email if configured, but don't fail if not configured
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const mailOptions = {
        from: `"Saraha App" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Email Verification OTP',
        text: `Your verification OTP is: ${otp}. It will expire in 10 minutes.`
      };
      
      const info = await sendMail(mailOptions);
      console.log('Verification email sent successfully. Message ID:', info.messageId);
    } else {
      console.log('ℹ️  Email not configured - OTP available in console for testing');
    }
    
  } catch (error) {
    console.error('⚠️  Email sending failed (expected in development):');
    console.error('Error:', error.message);
    console.log('📝 OTP for testing:', otp);
    // Don't fail the request - just log the error
  }
  
  res.json({ 
    success: true, 
    message: 'OTP has been resent to your email',
    otp: process.env.NODE_ENV === 'development' ? otp : undefined // Return OTP in development for testing
  });
};

export const login = async (req, res) => {
  try {
    console.log('\n=== LOGIN ATTEMPT ===');
    console.log('🔍 Request received at:', new Date().toISOString());
    console.log('🔍 Request details:', {
      method: req.method,
      url: req.originalUrl,
      contentType: req.headers['content-type'],
      body: req.body ? {
        ...req.body,
        password: req.body.password ? '***' : undefined
      } : 'No body received'
    });

    // Check if request body exists
    if (!req.body) {
      console.log('❌ No request body received');
      return res.status(400).json({
        success: false,
        message: 'Request body is required',
        received: false
      });
    }

    const { email, password } = req.body;
    
    console.log('🔍 Extracted values:', { 
      email: email || 'undefined',
      passwordReceived: !!password
    });
    
    // Basic validation (should be caught by Joi, but just in case)
    if (!email || !password) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Both email and password are required',
        missing: {
          email: !email,
          password: !password
        },
        receivedBody: req.body
      });
    }

    // Try case-insensitive email search
    const user = await User.findOne({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') } 
    });
    
    console.log('🔍 User lookup result:', user ? `Found user: ${user.email}` : 'User not found');
    
    if (!user) {
      console.log('❌ User not found with email:', email);
      return res.status(404).json({
        success: false,
        message: 'User not found',
        email: email
      });
    }
    
    if (!user.verified) {
      console.log('❌ User email not verified:', email);
      return res.status(400).json({
        success: false,
        message: 'Please verify your email first',
        email: email,
        verified: false
      });
    }
    
    const validPassword = await comparePassword(password, user.password);
    if (!validPassword) {
      console.log('❌ Invalid password for email:', email);
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password',
        auth: false
      });
    }
    
    // If we get here, login is successful
    const { accessToken, refreshToken } = generateTokens(user._id);
    
    // Update user's refresh tokens
    if (!user.refreshTokens) {
      user.refreshTokens = [];
    }
    
    const hashedRefreshToken = await hashPassword(refreshToken);
    user.refreshTokens.push(hashedRefreshToken);
    
    // Keep only the last 5 refresh tokens
    if (user.refreshTokens.length > 5) {
      user.refreshTokens.shift();
    }
    
    await user.save();
    
    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });
    
    console.log('✅ Login successful for user:', user.email);
    
    return res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar
      }
    });
    
  } catch (error) {
    console.error('❌ Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
  
  // Try case-insensitive email search
  const user = await User.findOne({ 
    email: { $regex: new RegExp(`^${email}$`, 'i') } 
  });
  
  console.log('🔍 User lookup result:', user ? `Found user: ${user.email}` : 'User not found');
  
  if (!user) throw new AppError('User not found', 404);
  if (!user.verified) throw new AppError('Please verify your email', 400);
  
  const valid = await comparePassword(password, user.password);
  if (!valid) throw new AppError('Invalid credentials', 400);
  
  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user._id);
  
  // Initialize tokens array if it doesn't exist
  if (!user.refreshTokens) {
    user.refreshTokens = [];
  }
  
  // Store hashed refresh token
  const hashedRefreshToken = await hashPassword(refreshToken);
  user.refreshTokens.push(hashedRefreshToken);
  
  // Keep only the last 5 refresh tokens (for security)
  if (user.refreshTokens.length > 5) {
    user.refreshTokens.shift();
  }
  
  await user.save();
  
  // Set refresh token as HTTP-only cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });
  
  res.json({ 
    success: true, 
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar
    }
  });
};

export const googleLogin = async (req, res) => {
  res.status(501).json({ success: false, message: 'Google login not implemented' });
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email }).select('+otp +otpExpires');
  if (!user) {
    console.log(`Email ${email} not found in database`);
    return res.status(404).json({ 
      success: false, 
      message: 'This email is not registered' 
    });
  }
  
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  // Save OTP to user (store plain text OTP for verification)
  user.otp = otp;
  user.otpExpires = otpExpires;
  await user.save();
  
  // Try to send email with OTP - Always log to console for development/testing
  try {
    console.log(`\n📧 Sending OTP email to: ${email}`);
    console.log(`🔑 OTP for ${email}: ${otp}`);
    console.log('💡 For development: OTP is logged to console instead of sending email');
    
    // Try to send email if configured, but don't fail if not configured
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const mailOptions = {
        from: `"Saraha App" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Password Reset OTP',
        text: `Your password reset OTP is: ${otp}. It will expire in 10 minutes.`
      };
      
      console.log('Sending email with options:', {
        to: mailOptions.to,
        subject: mailOptions.subject
      });
      
      const info = await sendMail(mailOptions);
      console.log('Email sent successfully. Message ID:', info.messageId);
    } else {
      console.log('ℹ️  Email not configured - OTP available in console for testing');
    }
    
    console.log(`\n📨 OTP for ${email} is ${otp}`);
    
  } catch (error) {
    console.error('⚠️  Email sending failed (expected in development):');
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response
    });
    
    console.log('📝 OTP for testing:', otp);
    // Don't return error - just log and continue
  }
  
  res.json({ 
    success: true, 
    message: 'OTP has been sent to your email' 
  });
};

export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  
  if (!email || !otp || !newPassword) {
    throw new AppError('Email, OTP and new password are required', 400);
  }
  
  const user = await User.findOne({ email }).select('+password +otp +otpExpires');
  if (!user) {
    throw new AppError('Invalid request', 400);
  }
  
  // Verify OTP
  if (!user.otp || !user.otpExpires || user.otpExpires < Date.now()) {
    throw new AppError('OTP has expired. Please request a new one.', 400);
  }
  
  // Compare plain text OTP (no hashing needed for OTP verification)
  const isOtpValid = otp === user.otp;
  if (!isOtpValid) {
    throw new AppError('Invalid OTP', 400);
  }

  // Update password and clear OTP fields
  user.password = await hashPassword(newPassword);
  user.otp = undefined;
  user.otpExpires = undefined;

  // Invalidate all active sessions
  user.refreshTokens = [];
  await user.save();

  res.json({ 
    success: true,
    message: 'Password reset successfully'
  });
};

export const refreshToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
  if (!refreshToken) throw new AppError('Refresh token is required', 400);

  // Verify refresh token
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET + '_refresh');
  } catch (err) {
    res.clearCookie('refreshToken');
    throw new AppError('Invalid or expired refresh token', 401);
  }
  
  const user = await User.findById(decoded.id);
  if (!user || !user.refreshTokens) {
    res.clearCookie('refreshToken');
    throw new AppError('User not found', 404);
  }
  
  // Check if refresh token exists in user's tokens
  const refreshTokenExists = await Promise.all(
    user.refreshTokens.map(async (storedToken) => {
      return await comparePassword(refreshToken, storedToken);
    })
  ).then(results => results.some(result => result === true));
  
  if (!refreshTokenExists) {
    user.refreshTokens = [];
    await user.save();
    res.clearCookie('refreshToken');
    throw new AppError('Invalid refresh token', 401);
  }
  
  // Generate new tokens
  const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(user._id);
  
  // Remove the old refresh token and add the new one
  user.refreshTokens = user.refreshTokens.filter(
    (_, index) => !refreshTokenExists[index]
  );
  
  const hashedNewRefreshToken = await hashPassword(newRefreshToken);
  user.refreshTokens.push(hashedNewRefreshToken);
  
  await user.save();
  
  // Set new refresh token as HTTP-only cookie
  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });
  
  res.json({ 
    success: true, 
    accessToken: newAccessToken,
    refreshToken: newRefreshToken
  });
};

export const logout = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
  
  // Add access token to blacklist
  if (token) {
    await Token.create({ token, expiresAt: new Date(Date.now() + 15 * 60 * 1000) });
  }
  
  // Remove refresh token from user's tokens
  if (refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET + '_refresh');
      const user = await User.findById(decoded.id);
      
      if (user && user.refreshTokens) {
        // Remove the specific refresh token
        const hashedToken = await hashPassword(refreshToken);
        user.refreshTokens = user.refreshTokens.filter(
          storedToken => storedToken !== hashedToken
        );
        await user.save();
      }
    } catch (err) {
      
    }
  }
  
  // Clear refresh token cookie
  res.clearCookie('refreshToken');
  
  res.json({ success: true, message: 'Logged out successfully' });
};

export const requestPasswordChangeOtp = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError('Authentication required', 401);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  // Save OTP to user
  user.otp = otp;
  user.otpExpires = otpExpires;
  await user.save();
  
  // Send OTP email - Always log to console for development/testing
  try {
    console.log(`\n📧 Sending password change OTP to: ${user.email}`);
    console.log(`🔑 OTP for password change: ${otp}`);
    console.log('💡 For development: OTP is logged to console instead of sending email');
    
    // Try to send email if configured, but don't fail if not configured
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const mailOptions = {
        from: `"Saraha App" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Password Change Verification OTP',
        text: `Your password change verification OTP is: ${otp}. It will expire in 10 minutes.`
      };
      
      const info = await sendMail(mailOptions);
      console.log('OTP email sent successfully. Message ID:', info.messageId);
    } else {
      console.log('ℹ️  Email not configured - OTP available in console for testing');
    }
    
  } catch (error) {
    console.error('⚠️  Email sending failed (expected in development):');
    console.error('Error:', error.message);
    console.log('📝 OTP for testing:', otp);
    // Don't return error - just log and continue
  }
  
  res.json({ 
    success: true, 
    message: 'Verification OTP has been sent to your email' 
  });
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword, otp } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError('Authentication required', 401);
  }

  if (!otp) {
    throw new AppError('OTP is required for password change', 400);
  }

  // Find user and select required fields
  const user = await User.findById(userId).select('+password +otp +otpExpires');
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Verify OTP first
  if (!user.otp || !user.otpExpires || user.otpExpires < Date.now()) {
    throw new AppError('OTP has expired. Please request a new one.', 400);
  }

  const isOtpValid = otp === user.otp;
  if (!isOtpValid) {
    throw new AppError('Invalid OTP', 400);
  }

  // Verify current password
  const isMatch = await comparePassword(currentPassword, user.password);
  if (!isMatch) {
    throw new AppError('Current password is incorrect', 400);
  }

  // Update password and clear OTP fields
  user.password = await hashPassword(newPassword);
  user.otp = undefined;
  user.otpExpires = undefined;
  
  // Invalidate all active sessions by clearing refresh tokens
  user.refreshTokens = [];
  
  await user.save();

  res.json({ 
    success: true, 
    message: 'Password updated successfully. Please log in again.' 
  });
};

export const revokeToken = async (req, res) => {
  res.status(501).json({ success: false, message: 'Revoke not implemented' });
};
