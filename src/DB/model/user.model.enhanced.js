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
    trim: true,
    match: [/\S+@\S+\.\S+/, 'is invalid']
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
  verified: { 
    type: Boolean, 
    default: false,
    index: true
  },
  otp: { 
    type: String,
    select: false
  },
  otpExpires: { 
    type: Date,
    index: { expireAfterSeconds: 0 }
  },
  googleId: { 
    type: String,
    sparse: true,
    index: true
  },
  tokens: [{ 
    type: String,
    select: false
  }],
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

// Hide sensitive fields in output
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.otp;
  delete obj.otpExpires;
  delete obj.googleId;
  delete obj.tokens;
  return obj;
};

// Static methods for common queries
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findByUsername = function(username) {
  return this.findOne({ username: username.toLowerCase() });
};

userSchema.statics.findActiveUsers = function() {
  return this.find({ isActive: true });
};

export default mongoose.model('User', userSchema);
