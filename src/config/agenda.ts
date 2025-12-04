import Agenda from 'agenda';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/voucher-system';

export const agenda = new Agenda({
  db: {
    address: MONGODB_URI,
    collection: 'agenda_jobs',
    options: {
      serverSelectionTimeoutMS: 5000,
    },
  },
  processEvery: '30 seconds',
  maxConcurrency: 20,
});

agenda.on('ready', () => {
  console.log('✅ Agenda is ready');
});

agenda.on('error', (error) => {
  console.error('❌ Agenda error:', error);
});

agenda.on('start', (job) => {
  console.log(`🔄 Job ${job.attrs.name} starting...`);
});

agenda.on('complete', (job) => {
  console.log(`✅ Job ${job.attrs.name} completed`);
});

agenda.on('fail', (error, job) => {
  console.error(`❌ Job ${job.attrs.name} failed:`, error);
});

export default agenda;
