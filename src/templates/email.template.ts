interface WelcomeEmailData {
  firstName: string;
  message: string;
}

interface VoucherEmailData {
  eventTitle: string;
  voucherCode: string;
  expiresAt: string;
  message: string;
}

interface EventReminderData {
  eventTitle: string;
  startDate: string;
}

/**
 * Base email layout
 */
const baseLayout = (content: string): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Voucher System</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">🎟️ Voucher System</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0; color: #999; font-size: 12px;">
                This is an automated email. Please do not reply.
              </p>
              <p style="margin: 10px 0 0 0; color: #999; font-size: 12px;">
                © ${new Date().getFullYear()} Voucher System. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

/**
 * Welcome Email Template
 */
export const welcomeEmailTemplate = (data: WelcomeEmailData): string => {
  const content = `
    <h2 style="color: #333; margin-top: 0;">Welcome, ${data.firstName}! 🎉</h2>
    <p style="color: #666; line-height: 1.6; font-size: 16px;">
      ${data.message}
    </p>
    <p style="color: #666; line-height: 1.6; font-size: 16px;">
      Get started by browsing our events and claiming your vouchers!
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}" 
         style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
         color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">
        Browse Events
      </a>
    </div>
    <p style="color: #666; line-height: 1.6; font-size: 14px;">
      Best regards,<br>
      <strong>The Voucher System Team</strong>
    </p>
  `;

  return baseLayout(content);
};

/**
 * Voucher Email Template
 */
export const voucherEmailTemplate = (data: VoucherEmailData): string => {
  const content = `
    <h2 style="color: #333; margin-top: 0;">Your Voucher is Ready! 🎟️</h2>
    <p style="color: #666; line-height: 1.6; font-size: 16px;">
      ${data.message}
    </p>
    
    <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin: 25px 0;">
      <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">📅 Event: ${data.eventTitle}</h3>
      
      <div style="background: #ffffff; padding: 20px; border-radius: 5px; border: 2px dashed #667eea; text-align: center;">
        <p style="margin: 0; color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
          Voucher Code
        </p>
        <p style="margin: 15px 0; font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 3px; font-family: 'Courier New', monospace;">
          ${data.voucherCode}
        </p>
        <p style="margin: 0; color: #666; font-size: 14px;">
          Tap to copy
        </p>
      </div>
      
      <p style="margin: 15px 0 0 0; color: #666; font-size: 14px; text-align: center;">
        ⏰ Expires on: <strong>${data.expiresAt}</strong>
      </p>
    </div>
    
    <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 0; color: #856404; font-size: 14px;">
        💡 <strong>Tip:</strong> Save this email or screenshot your voucher code for easy access!
      </p>
    </div>
  `;

  return baseLayout(content);
};

/**
 * Event Reminder Email Template
 */
export const eventReminderTemplate = (data: EventReminderData): string => {
  const content = `
    <h2 style="color: #333; margin-top: 0;">Event Reminder 📅</h2>
    <p style="color: #666; line-height: 1.6; font-size: 16px;">
      This is a friendly reminder that <strong style="color: #667eea;">${data.eventTitle}</strong> is starting soon!
    </p>
    
    <div style="background: #e3f2fd; padding: 20px; border-left: 4px solid #2196f3; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0; color: #1565c0; font-size: 14px; font-weight: bold;">
        📆 Start Date & Time
      </p>
      <p style="margin: 0; color: #333; font-size: 18px; font-weight: bold;">
        ${data.startDate}
      </p>
    </div>
    
    <p style="color: #666; line-height: 1.6; font-size: 16px;">
      Don't miss out! Claim your voucher now.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/events" 
         style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
         color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">
        View Event Details
      </a>
    </div>
  `;

  return baseLayout(content);
};

/**
 * Password Reset Email Template (for future use)
 */
export const passwordResetTemplate = (resetLink: string, firstName: string): string => {
  const content = `
    <h2 style="color: #333; margin-top: 0;">Password Reset Request 🔐</h2>
    <p style="color: #666; line-height: 1.6; font-size: 16px;">
      Hi ${firstName},
    </p>
    <p style="color: #666; line-height: 1.6; font-size: 16px;">
      We received a request to reset your password. Click the button below to create a new password:
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetLink}" 
         style="display: inline-block; padding: 12px 30px; background: #dc3545; 
         color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">
        Reset Password
      </a>
    </div>
    
    <p style="color: #666; line-height: 1.6; font-size: 14px;">
      Or copy and paste this link into your browser:
    </p>
    <p style="color: #667eea; line-height: 1.6; font-size: 14px; word-break: break-all;">
      ${resetLink}
    </p>
    
    <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 0; color: #856404; font-size: 14px;">
        ⚠️ This link will expire in 1 hour. If you didn't request this, please ignore this email.
      </p>
    </div>
  `;

  return baseLayout(content);
};

export default {
  welcomeEmailTemplate,
  voucherEmailTemplate,
  eventReminderTemplate,
  passwordResetTemplate,
};
