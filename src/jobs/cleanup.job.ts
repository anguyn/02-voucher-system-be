import { Job } from 'agenda';
import { agenda } from '../config/agenda';
import { RefreshToken, EditLock } from '../models';

/**
 * Cleanup Expired Refresh Tokens
 * Runs daily to remove expired tokens
 */
agenda.define('cleanup-expired-tokens', async (job: Job) => {
  try {
    const now = new Date();

    const tokensResult = await RefreshToken.deleteMany({
      expiresAt: { $lt: now },
    });

    console.log(`🗑️  Cleaned up ${tokensResult.deletedCount} expired refresh tokens`);

    job.attrs.lastFinishedAt = new Date();
  } catch (error) {
    console.error('❌ Cleanup expired tokens job failed:', error);
    job.fail((error as Error).message);
  }
});

/**
 * Cleanup Expired Edit Locks
 * Runs every 3 minutes to remove expired locks
 */
agenda.define('cleanup-expired-locks', async (job: Job) => {
  try {
    const now = new Date();

    const locksResult = await EditLock.deleteMany({
      expiresAt: { $lt: now },
    });

    if (locksResult.deletedCount > 0) {
      console.log(`🗑️  Cleaned up ${locksResult.deletedCount} expired edit locks`);
    }

    job.attrs.lastFinishedAt = new Date();
  } catch (error) {
    console.error('❌ Cleanup expired locks job failed:', error);
    job.fail((error as Error).message);
  }
});

/**
 * Start cleanup jobs
 */
export const startCleanupJobs = async (): Promise<void> => {
  await agenda.every('0 3 * * *', 'cleanup-expired-tokens');
  console.log('✅ Cleanup expired tokens job scheduled (daily at 3 AM)');

  await agenda.every('3 minutes', 'cleanup-expired-locks');
  console.log('✅ Cleanup expired locks job scheduled (every 3 minutes)');
};

export default {
  startCleanupJobs,
};
