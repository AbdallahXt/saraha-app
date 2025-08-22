import jwt from 'jsonwebtoken';
import User from '../../DB/model/user.model.js';
import { AppError } from '../../utils/error/index.js';

export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('No token provided', 401));
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) throw new AppError('User not found', 404);
    req.user = { id: user._id };
    next();
  } catch (err) {
    next(new AppError('Invalid token', 401));
  }
};
