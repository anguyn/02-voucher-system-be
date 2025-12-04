import { Job } from 'bull';
import { emailQueue } from './email.queue';
import { emailService } from '../services';
import { Language } from '../types';

/**
 * Email Job Data Types
 */
interface WelcomeEmailJob {
  email: string;
  firstName: string;
  language: Language;
}

interface VoucherEmailJob {
  email: string;
  voucherCode: string;
  eventTitle: string;
  expiresAt: Date;
  language: Language;
}

interface EventReminderJob {
  email: string;
  eventTitle: string;
  startDate: Date;
  language: Language;
}

/**
 * Process welcome email
 */
emailQueue.process('send-welcome-email', async (job: Job<WelcomeEmailJob>) => {
  const { email, firstName, language } = job.data;

  console.log(`📧 Sending welcome email to ${email}`);

  await emailService.sendWelcomeEmail(email, firstName, language);

  return { success: true, email };
});

/**
 * Process voucher email
 */
emailQueue.process('send-voucher-email', async (job: Job<VoucherEmailJob>) => {
  const { email, voucherCode, eventTitle, expiresAt, language } = job.data;

  console.log(`🎟️ Sending voucher email to ${email}`);

  await emailService.sendVoucherEmail(email, voucherCode, eventTitle, expiresAt, language);

  return { success: true, email, voucherCode };
});

/**
 * Process event reminder email
 */
emailQueue.process('send-reminder-email', async (job: Job<EventReminderJob>) => {
  const { email, eventTitle, startDate, language } = job.data;

  console.log(`📅 Sending event reminder to ${email}`);

  await emailService.sendEventReminderEmail(email, eventTitle, startDate, language);

  return { success: true, email };
});

console.log('✅ Email queue processors initialized');

export default emailQueue;
