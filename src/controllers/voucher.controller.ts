import { Response } from 'express';
import { AuthRequest } from '../types';
import { voucherService } from '../services';
import { User } from '../models';
import {
  successResponse,
  createdResponse,
  errorResponse,
  customErrorResponse,
} from '../utils/response.util';
import { t } from '../config/i18n';
import { emailQueue } from '../queues/email.queue';

export class VoucherController {
  /**
   * Issue voucher for event
   */
  async issueVoucher(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { eventId } = req.body;
      const voucher = await voucherService.issueVoucher(eventId, req.user!.userId, req.language);

      const user = await User.findById(req.user!.userId);

      if (user) {
        await emailQueue.add('send-voucher-email', {
          email: user.email,
          voucherCode: voucher.code,
          eventTitle: voucher.eventTitle,
          expiresAt: voucher.expiresAt,
          language: user.language,
        });
      }

      createdResponse(res, t('voucher.issued', {}, req.language), voucher);
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (errorMessage.includes('not_available') || errorMessage.includes('No vouchers')) {
        customErrorResponse(res, errorMessage, 456);
      } else {
        errorResponse(res, errorMessage);
      }
    }
  }

  /**
   * Use voucher
   */
  async useVoucher(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { code } = req.body;
      await voucherService.useVoucher(code, req.user!.userId, req.language);

      successResponse(res, t('voucher.used', {}, req.language));
    } catch (error) {
      errorResponse(res, (error as Error).message);
    }
  }

  /**
   * Get user's vouchers
   */
  async getUserVouchers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await voucherService.getUserVouchers(req.user!.userId, req.query as any);

      successResponse(res, t('voucher.list_retrieved', {}, req.language), result);
    } catch (error) {
      errorResponse(res, (error as Error).message);
    }
  }

  /**
   * Get voucher by code
   */
  async getVoucherByCode(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { code } = req.params;
      const voucher = await voucherService.getVoucherByCode(code, req.user!.userId, req.language);

      successResponse(res, t('voucher.list_retrieved', {}, req.language), voucher);
    } catch (error) {
      errorResponse(res, (error as Error).message);
    }
  }

  /**
   * Get event vouchers stats (Admin)
   */
  async getEventStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { eventId } = req.params;
      const stats = await voucherService.getEventVouchersStats(eventId);

      successResponse(res, 'Stats retrieved successfully', stats);
    } catch (error) {
      errorResponse(res, (error as Error).message);
    }
  }
}

export default new VoucherController();
