import { startDatabaseHealthCheck } from './database.job';
import { startCleanupJobs } from './cleanup.job';

export const initializeJobs = async (): Promise<void> => {
  try {
    await startDatabaseHealthCheck();
    await startCleanupJobs();

    console.log('✅ All scheduled jobs initialized');
  } catch (error) {
    console.error('❌ Failed to initialize jobs:', error);
  }
};

export default {
  initializeJobs,
};
