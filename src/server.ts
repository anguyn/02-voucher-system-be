import app from './app';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

const server = app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚀 Server is running!');
  console.log('='.repeat(60));
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📍 Base URL: http://${HOST}:${PORT}`);
  console.log('');
  console.log('📋 API Endpoints:');
  console.log(`   ├─ Health Check: http://${HOST}:${PORT}/health`);
  console.log(`   └─ Detailed Health: http://${HOST}:${PORT}/health/detailed`);
  console.log('');
  console.log('📚 API Documentation:');
  console.log(`   ├─ Scalar (Modern): http://${HOST}:${PORT}/docs`);
  console.log(`   ├─ Swagger UI: http://${HOST}:${PORT}/api-docs`);
  console.log(`   └─ OpenAPI JSON: http://${HOST}:${PORT}/openapi.json`);
  console.log('='.repeat(60));
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  console.log(`\n${signal} received, shutting down gracefully...`);
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('⚠️  Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default server;
