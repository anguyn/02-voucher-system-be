import { Response } from 'express';
import { AuthRequest } from '../types';
import { editLockService } from '../services';
import { successResponse, errorResponse, conflictResponse } from '../utils/response.util';
import { t } from '../config/i18n';

export class EditLockController {
  /**
   * Acquire edit lock
   */
  async acquireLock(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { eventId } = req.params;
      const lock = await editLockService.acquireLock(
        eventId,
        req.user!.userId,
        req.user!.email,
        req.language
      );

      successResponse(res, t('event.lock_acquired', {}, req.language), lock);
    } catch (error) {
      conflictResponse(res, (error as Error).message);
    }
  }

  /**
   * Release edit lock
   */
  async releaseLock(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { eventId } = req.params;
      await editLockService.releaseLock(eventId, req.user!.userId, req.language);

      successResponse(res, t('event.lock_released', {}, req.language));
    } catch (error) {
      errorResponse(res, (error as Error).message);
    }
  }

  /**
   * Extend edit lock
   */
  async maintainLock(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { eventId } = req.params;
      const lock = await editLockService.maintainLock(eventId, req.user!.userId, req.language);

      successResponse(res, t('event.lock_maintained', {}, req.language), lock);
    } catch (error) {
      errorResponse(res, (error as Error).message);
    }
  }

  /**
   * Get lock info
   */
  async getLockInfo(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { eventId } = req.params;
      const lock = await editLockService.getLockInfo(eventId);

      successResponse(res, 'Lock info retrieved', lock);
    } catch (error) {
      errorResponse(res, (error as Error).message);
    }
  }
}

export default new EditLockController();
