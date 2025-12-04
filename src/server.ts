import { createServer } from 'http';
import app from './app';
import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from './config/database';
import { redisClient } from './config/redis';
import { initializeSocket } from './config/socket';
import { initializeSockets } from './sockets';
import { initializeJobs } from './jobs';
import './queues/email.processor';

dotenv.config();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

const startServer = async () => {
  try {
    await connectDatabase();

    const httpServer = createServer(app);

    const io = initializeSocket(httpServer);
    initializeSockets(io);

    await initializeJobs();

    httpServer.listen(PORT, () => {
      console.log('='.repeat(60));
      console.log('🚀 Server is running!');
      console.log('='.repeat(60));
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📍 Base URL: http://${HOST}:${PORT}`);
      console.log('🔌 Socket.IO: Enabled');
      console.log('📨 Bull Queue: Running');
      console.log('⏰ Agenda Jobs: Scheduled');
      console.log('='.repeat(60));
    });

    const gracefulShutdown = async (signal: string) => {
      console.log(`\n${signal} received, shutting down gracefully...`);

      httpServer.close(async () => {
        console.log('✅ HTTP server closed');

        try {
          await disconnectDatabase();
          await redisClient.quit();
          console.log('✅ Database and Redis connections closed');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during shutdown:', error);
          process.exit(1);
        }
      });

      setTimeout(() => {
        console.error('⚠️  Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => void gracefulShutdown('SIGINT'));

    return httpServer;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

void startServer();

export default startServer;
