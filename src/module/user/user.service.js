import User from '../../DB/model/user.model.js';
import { AppError } from '../../utils/error/index.js';
import cloudinary from '../../utils/cloud/index.js';
import { promisify } from 'util';

export const getProfile = async (req, res) => {
  const user = await User.findById(req.user.id).select('-password -otp -otpExpires -refreshTokens');
  if (!user) throw new AppError('User not found', 404);
  
  const userData = {
    id: user._id,
    username: user.username,
    avatar: user.avatar,
    verified: user.verified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
  
  res.json({ success: true, user: userData });
};

export const updateProfile = async (req, res) => {
  const { username, avatar } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { username, avatar },
    { new: true, runValidators: true }
  ).select('-password -otp -otpExpires');
  if (!user) throw new AppError('User not found', 404);
  res.json({ success: true, user });
};

export const logoutAll = async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { tokens: [] });
  res.json({ success: true, message: 'Logged out from all devices' });
};

export const uploadAvatar = async (req, res) => {
  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  try {
    // Convert buffer to base64
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    // Upload to Cloudinary
    const uploadResult = await promisify(cloudinary.uploader.upload)(dataURI, {
      folder: 'saraha/avatars',
      transformation: [
        { width: 300, height: 300, crop: 'fill' },
        { quality: 'auto' },
        { format: 'webp' }
      ]
    });

    // Delete old avatar if exists
    if (user.avatar) {
      const publicId = user.avatar.split('/').pop().split('.')[0];
      await promisify(cloudinary.uploader.destroy)(`saraha/avatars/${publicId}`);
    }

    // Update user with new avatar URL
    user.avatar = uploadResult.secure_url;
    await user.save();

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      avatar: user.avatar
    });

  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new AppError('Failed to upload avatar', 500);
  }
};
