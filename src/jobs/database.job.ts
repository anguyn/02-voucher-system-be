import { Job } from 'agenda';
import { agenda } from '../config/agenda';
import { checkDatabaseConnection } from '../config/database';
import { checkRedisConnection } from '../config/redis';

/**
 * Database Health Check Job
 * Runs every minute to verify database connection
 */
agenda.define('check-database-health', async (job: Job) => {
  try {
    const mongoStatus = await checkDatabaseConnection();

    const redisStatus = await checkRedisConnection();

    if (!mongoStatus) {
      console.warn('⚠️  MongoDB connection is unhealthy');
      job.fail('MongoDB connection failed');
    }

    if (!redisStatus) {
      console.warn('⚠️  Redis connection is unhealthy');
      job.fail('Redis connection failed');
    }

    if (mongoStatus && redisStatus) {
      console.log('✅ Database health check passed');
      job.attrs.lastFinishedAt = new Date();
    }
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    job.fail((error as Error).message);
  }
});

/**
 * Start database health check job
 */
export const startDatabaseHealthCheck = async (): Promise<void> => {
  await agenda.start();

  await agenda.every('1 minute', 'check-database-health');

  console.log('✅ Database health check job scheduled (every 1 minute)');
};

export default {
  startDatabaseHealthCheck,
};
