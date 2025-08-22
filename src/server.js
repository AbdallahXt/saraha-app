import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './DB/setup.js';
import { globalErrorHandler } from './middleware/global.error.js';
import rateLimiter from './middleware/rateLimiter.js';
import authRoutes from './module/auth/auth.controller.js';
import userRoutes from './module/user/user.controller.js';
import messageRoutes from './module/messages/message.controller.js';
import startCronJobs from './utils/cron/index.js';

dotenv.config();

const app = express();

// Enable CORS
app.use(cors());

// Parse JSON bodies with increased limit and strict mode
app.use(express.json({
  limit: '10mb',
  strict: false,
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      console.error('Invalid JSON received:', buf.toString());
      throw new Error('Invalid JSON');
    }
  }
}));

// Debug middleware
app.use((req, res, next) => {
  console.log('\n📨 New Request:', {
    time: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    headers: req.headers,
    body: req.body
  });
  next();
});

// Test endpoint
app.post('/test-endpoint', (req, res) => {
  console.log('Test endpoint hit. Request body:', req.body);
  res.json({
    success: true,
    message: 'Test successful',
    body: req.body,
    headers: req.headers
  });
});

app.use(rateLimiter);

const startServer = async () => {
  try {
    await connectDB();
    
    startCronJobs();
    
    app.use('/api/auth', authRoutes);
    app.use('/api/user', userRoutes);
    app.use('/api/messages', messageRoutes);
    app.use(globalErrorHandler);

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
