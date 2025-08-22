import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  recipient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  content: { 
    type: String, 
    required: true,
    maxlength: 1000,
    index: 'text'
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  senderIp: { 
    type: String,
    index: true
  },
  isRead: { 
    type: Boolean, 
    default: false,
    index: true
  },
  isDeleted: { 
    type: Boolean, 
    default: false,
    index: true
  },
  messageType: { 
    type: String, 
    enum: ['text', 'image', 'video', 'audio'],
    default: 'text',
    index: true
  },
  replyTo: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Message',
    index: true
  }
});

// Compound indexes for optimized queries
messageSchema.index({ recipient: 1, createdAt: -1 });
messageSchema.index({ recipient: 1, isRead: 1, isDeleted: 1 });
messageSchema.index({ createdAt: -1, isDeleted: 1 });
messageSchema.index({ senderIp: 1, createdAt: -1 });

export default mongoose.model('Message', messageSchema, 'saraha');
