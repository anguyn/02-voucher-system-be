import { EditLock } from '../models';
import { Types } from 'mongoose';
import { t } from '../config/i18n';
import { Language } from '@/types';

const LOCK_DURATION = parseInt(process.env.EDIT_LOCK_DURATION || '300000', 10);

export class EditLockService {
  async acquireLock(eventId: string, userId: string, userEmail: string, language?: Language) {
    const existingLock = await EditLock.findOne({ eventId: new Types.ObjectId(eventId) });

    if (existingLock) {
      const now = new Date();

      if (existingLock.expiresAt < now) {
        await EditLock.deleteOne({ eventId: new Types.ObjectId(eventId) });
      } else {
        if (existingLock.userId.toString() === userId) {
          existingLock.expiresAt = new Date(Date.now() + LOCK_DURATION);
          await existingLock.save();
          return existingLock;
        } else {
          throw new Error(t('event.already_locked', { email: existingLock.userEmail }, language));
        }
      }
    }

    const lock = await EditLock.create({
      eventId: new Types.ObjectId(eventId),
      userId: new Types.ObjectId(userId),
      userEmail,
      lockedAt: new Date(),
      expiresAt: new Date(Date.now() + LOCK_DURATION),
    });

    return lock;
  }

  async releaseLock(eventId: string, userId: string, language?: Language): Promise<void> {
    const lock = await EditLock.findOne({ eventId: new Types.ObjectId(eventId) });

    if (!lock) {
      return;
    }

    if (lock.userId.toString() !== userId) {
      throw new Error(t('event.not_locked_by_you', {}, language));
    }

    await EditLock.deleteOne({ eventId: new Types.ObjectId(eventId) });
  }

  async maintainLock(eventId: string, userId: string, language?: Language) {
    const lock = await EditLock.findOne({ eventId: new Types.ObjectId(eventId) });

    if (!lock) {
      throw new Error(t('event.lock_expired', {}, language));
    }

    const now = new Date();
    if (lock.expiresAt < now) {
      await EditLock.deleteOne({ eventId: new Types.ObjectId(eventId) });
      throw new Error(t('event.lock_expired', {}, language));
    }

    if (lock.userId.toString() !== userId) {
      throw new Error(t('event.not_locked_by_you', {}, language));
    }

    lock.expiresAt = new Date(Date.now() + LOCK_DURATION);
    await lock.save();

    return lock;
  }

  async isLocked(eventId: string): Promise<boolean> {
    const lock = await EditLock.findOne({ eventId: new Types.ObjectId(eventId) });

    if (!lock) {
      return false;
    }

    const now = new Date();
    if (lock.expiresAt < now) {
      await EditLock.deleteOne({ eventId: new Types.ObjectId(eventId) });
      return false;
    }

    return true;
  }

  async getLockInfo(eventId: string) {
    const lock = await EditLock.findOne({ eventId: new Types.ObjectId(eventId) }).populate(
      'userId',
      'firstName lastName email'
    );

    if (!lock) {
      return null;
    }

    const now = new Date();
    if (lock.expiresAt < now) {
      await EditLock.deleteOne({ eventId: new Types.ObjectId(eventId) });
      return null;
    }

    return lock;
  }

  async forceReleaseLock(eventId: string): Promise<void> {
    await EditLock.deleteOne({ eventId: new Types.ObjectId(eventId) });
  }
}

export default new EditLockService();
