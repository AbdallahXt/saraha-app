import cron from 'node-cron';
import RefreshToken from '../../DB/model/refreshToken.model.js';
import Token from '../../DB/model/tooken.model.js';

export const startCronJobs = () => {
  console.log('Starting cron jobs...');

  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();
      const result = await RefreshToken.deleteMany({
        expiresAt: { $lt: now },
        isRevoked: false
      });
      
      if (result.deletedCount > 0) {
        console.log(`Cleaned ${result.deletedCount} expired refresh tokens`);
      }
    } catch (error) {
      console.error('Error cleaning expired refresh tokens:', error.message);
    }
  });

  cron.schedule('0 */6 * * *', async () => {
    try {
      const result = await RefreshToken.deleteMany({
        isRevoked: true
      });
      
      if (result.deletedCount > 0) {
        console.log(`Cleaned ${result.deletedCount} revoked refresh tokens`);
      }
    } catch (error) {
      console.error('Error cleaning revoked tokens:', error.message);
    }
  });

  cron.schedule('*/30 * * * *', async () => {
    try {
      const result = await Token.deleteMany({
        createdAt: { $lt: new Date(Date.now() - 60 * 60 * 1000) }
      });
      
      if (result.deletedCount > 0) {
        console.log(`Cleaned ${result.deletedCount} expired access tokens`);
      }
    } catch (error) {
      console.error('Error cleaning expired access tokens:', error.message);
    }
  });

  cron.schedule('0 0 * * *', () => {
    console.log('Cron jobs are running normally');
  });

  console.log('Cron jobs started successfully');
};

export default startCronJobs;
