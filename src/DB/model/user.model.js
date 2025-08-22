import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true,
    lowercase: true,
    trim: true
  },
  password: { 
    type: String, 
    required: true,
    minlength: 6
  },
  avatar: { 
    type: String,
    default: null
  },
  refreshTokens: { 
    type: [String], 
    default: [] 
  },
  verified: { 
    type: Boolean, 
    default: false,
    index: true
  },
  otp: { 
    type: String,
    select: false,
    default: null
  },
  otpExpires: { 
    type: Date,
    index: { expireAfterSeconds: 0 },
    default: null
  },
  googleId: { 
    type: String,
    sparse: true,
    index: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  lastLogin: { 
    type: Date,
    index: true
  },
  isActive: { 
    type: Boolean, 
    default: true,
    index: true
  }
});

// Compound indexes for common query patterns
userSchema.index({ username: 1, email: 1 });
userSchema.index({ verified: 1, createdAt: -1 });
userSchema.index({ isActive: 1, lastLogin: -1 });

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.otp;
  delete obj.otpExpires;
  delete obj.googleId;
  delete obj.tokens;
  return obj;
};

export default mongoose.model('User', userSchema);
