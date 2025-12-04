import { Resend } from 'resend';
import { EmailJob, Language } from '../types';
import { t } from '../config/i18n';
import {
  welcomeEmailTemplate,
  voucherEmailTemplate,
  eventReminderTemplate,
} from '../templates/email.template';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@anvel.site';
const FROM_NAME = process.env.FROM_NAME || 'Voucher System';

export class EmailService {
  /**
   * Send email using Resend
   */
  async sendEmail(emailData: EmailJob): Promise<void> {
    try {
      await resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
      });

      console.log(`✅ Email sent to ${emailData.to}`);
    } catch (error) {
      console.error(`❌ Failed to send email to ${emailData.to}:`, error);
      throw error;
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(
    email: string,
    firstName: string,
    language: Language = Language.EN
  ): Promise<void> {
    const subject = t('email.subject_welcome', {}, language);
    const message = t('email.welcome_message', { firstName }, language);

    const html = welcomeEmailTemplate({ firstName, message });

    await this.sendEmail({ to: email, subject, html });
  }

  /**
   * Send voucher issued email
   */
  async sendVoucherEmail(
    email: string,
    voucherCode: string,
    eventTitle: string,
    expiresAt: Date,
    language: Language = Language.EN
  ): Promise<void> {
    const subject = t('email.subject_voucher', { eventTitle }, language);
    const message = t('email.voucher_issued', {}, language);

    const expiryDate = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);

    const html = voucherEmailTemplate({
      eventTitle,
      voucherCode,
      expiresAt: expiryDate.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      message,
    });

    await this.sendEmail({ to: email, subject, html, context: { voucherCode, eventTitle } });
  }

  /**
   * Send event reminder email
   */
  async sendEventReminderEmail(
    email: string,
    eventTitle: string,
    startDate: Date,
    language: string = 'en'
  ): Promise<void> {
    const subject = `Reminder: ${eventTitle} starts soon!`;

    const html = eventReminderTemplate({
      eventTitle,
      startDate: startDate.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    });

    await this.sendEmail({ to: email, subject, html });
  }

  /**
   * Test email connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: FROM_EMAIL,
        subject: 'Test Email - Voucher System',
        html: '<p>This is a test email from Voucher System. Email service is working correctly!</p>',
      });

      return true;
    } catch (error) {
      console.error('Email test failed:', error);
      return false;
    }
  }
}

export default new EmailService();
