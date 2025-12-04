import Queue from 'bull';

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

export const emailQueue = new Queue('email-queue', {
  redis: {
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

emailQueue.on('completed', (job) => {
  console.log(`✅ Email job ${job.id} completed successfully`);
});

emailQueue.on('failed', (job, err) => {
  console.error(`❌ Email job ${job?.id} failed:`, err.message);
});

emailQueue.on('error', (error) => {
  console.error('❌ Email queue error:', error);
});

emailQueue.on('waiting', (jobId) => {
  console.log(`⏳ Email job ${jobId} is waiting`);
});

emailQueue.on('active', (job) => {
  console.log(`🔄 Processing email job ${job.id}`);
});

export default emailQueue;
