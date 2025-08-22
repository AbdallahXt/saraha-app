import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  token: { 
    type: String, 
    required: true,
    unique: true,
    index: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  expiresAt: { 
    type: Date, 
    required: true,
    index: { expireAfterSeconds: 0 }
  },
  isRevoked: { 
    type: Boolean, 
    default: false,
    index: true
  },
  userAgent: { 
    type: String,
    index: true
  },
  ipAddress: { 
    type: String,
    index: true
  }
});

refreshTokenSchema.index({ user: 1, createdAt: -1 });
refreshTokenSchema.index({ token: 1, expiresAt: 1 });
refreshTokenSchema.index({ user: 1, isRevoked: 1 });

export default mongoose.model('RefreshToken', refreshTokenSchema, 'refresh_tokens');
