import { editLockService } from '../../services';
import { EditLock } from '../../models';
import { createTestUser, createTestEvent } from '../helpers/test-utils';

describe('EditLockService', () => {
  describe('acquireLock', () => {
    it('should acquire lock successfully for unlocked event', async () => {
      const user = await createTestUser();
      const event = await createTestEvent(user._id.toString());

      const lock = await editLockService.acquireLock(
        event._id.toString(),
        user._id.toString(),
        user.email
      );

      expect(lock.eventId.toString()).toBe(event._id.toString());
      expect(lock.userId.toString()).toBe(user._id.toString());
      expect(lock.userEmail).toBe(user.email);
      expect(lock.expiresAt).toBeInstanceOf(Date);
      expect(lock.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('should extend lock if user already owns it', async () => {
      const user = await createTestUser();
      const event = await createTestEvent(user._id.toString());

      const lock1 = await editLockService.acquireLock(
        event._id.toString(),
        user._id.toString(),
        user.email
      );

      const lock2 = await editLockService.acquireLock(
        event._id.toString(),
        user._id.toString(),
        user.email
      );

      expect(lock2._id.toString()).toBe(lock1._id.toString());
      expect(lock2.expiresAt.getTime()).toBeGreaterThan(lock1.expiresAt.getTime());
    });

    it('should throw error if event is locked by another user', async () => {
      const user1 = await createTestUser({ email: 'user1@example.com' });
      const user2 = await createTestUser({ email: 'user2@example.com' });
      const event = await createTestEvent(user1._id.toString());

      await editLockService.acquireLock(event._id.toString(), user1._id.toString(), user1.email);

      await expect(
        editLockService.acquireLock(event._id.toString(), user2._id.toString(), user2.email)
      ).rejects.toThrow();
    });

    it('should acquire lock if previous lock expired', async () => {
      const user1 = await createTestUser({ email: 'user1@example.com' });
      const user2 = await createTestUser({ email: 'user2@example.com' });
      const event = await createTestEvent(user1._id.toString());

      const lock1 = await editLockService.acquireLock(
        event._id.toString(),
        user1._id.toString(),
        user1.email
      );

      lock1.expiresAt = new Date(Date.now() - 1000);
      await lock1.save();

      const lock2 = await editLockService.acquireLock(
        event._id.toString(),
        user2._id.toString(),
        user2.email
      );

      expect(lock2.userId.toString()).toBe(user2._id.toString());
    });

    it('should delete expired lock before creating new one', async () => {
      const user1 = await createTestUser({ email: 'user1@example.com' });
      const user2 = await createTestUser({ email: 'user2@example.com' });
      const event = await createTestEvent(user1._id.toString());

      await editLockService.acquireLock(event._id.toString(), user1._id.toString(), user1.email);

      await EditLock.updateOne({ eventId: event._id }, { expiresAt: new Date(Date.now() - 1000) });

      await editLockService.acquireLock(event._id.toString(), user2._id.toString(), user2.email);

      const locks = await EditLock.find({ eventId: event._id });
      expect(locks).toHaveLength(1);
      expect(locks[0].userId.toString()).toBe(user2._id.toString());
    });
  });

  describe('releaseLock', () => {
    it('should release lock successfully', async () => {
      const user = await createTestUser();
      const event = await createTestEvent(user._id.toString());

      await editLockService.acquireLock(event._id.toString(), user._id.toString(), user.email);

      await editLockService.releaseLock(event._id.toString(), user._id.toString());

      const lock = await EditLock.findOne({ eventId: event._id });
      expect(lock).toBeNull();
    });

    it('should not throw error if no lock exists', async () => {
      const user = await createTestUser();
      const event = await createTestEvent(user._id.toString());

      await expect(
        editLockService.releaseLock(event._id.toString(), user._id.toString())
      ).resolves.not.toThrow();
    });

    it('should throw error if trying to release another users lock', async () => {
      const user1 = await createTestUser({ email: 'user1@example.com' });
      const user2 = await createTestUser({ email: 'user2@example.com' });
      const event = await createTestEvent(user1._id.toString());

      await editLockService.acquireLock(event._id.toString(), user1._id.toString(), user1.email);

      await expect(
        editLockService.releaseLock(event._id.toString(), user2._id.toString())
      ).rejects.toThrow();
    });
  });

  describe('maintainLock', () => {
    it('should extend lock expiry', async () => {
      const user = await createTestUser();
      const event = await createTestEvent(user._id.toString());

      const lock1 = await editLockService.acquireLock(
        event._id.toString(),
        user._id.toString(),
        user.email
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      const lock2 = await editLockService.maintainLock(event._id.toString(), user._id.toString());

      expect(lock2.expiresAt.getTime()).toBeGreaterThan(lock1.expiresAt.getTime());
    });

    it('should throw error if no lock exists', async () => {
      const user = await createTestUser();
      const event = await createTestEvent(user._id.toString());

      await expect(
        editLockService.maintainLock(event._id.toString(), user._id.toString())
      ).rejects.toThrow();
    });

    it('should throw error if lock expired', async () => {
      const user = await createTestUser();
      const event = await createTestEvent(user._id.toString());

      await editLockService.acquireLock(event._id.toString(), user._id.toString(), user.email);

      await EditLock.updateOne({ eventId: event._id }, { expiresAt: new Date(Date.now() - 1000) });

      await expect(
        editLockService.maintainLock(event._id.toString(), user._id.toString())
      ).rejects.toThrow();
    });

    it('should throw error if trying to maintain another users lock', async () => {
      const user1 = await createTestUser({ email: 'user1@example.com' });
      const user2 = await createTestUser({ email: 'user2@example.com' });
      const event = await createTestEvent(user1._id.toString());

      await editLockService.acquireLock(event._id.toString(), user1._id.toString(), user1.email);

      await expect(
        editLockService.maintainLock(event._id.toString(), user2._id.toString())
      ).rejects.toThrow();
    });

    it('should delete expired lock and throw error', async () => {
      const user = await createTestUser();
      const event = await createTestEvent(user._id.toString());

      await editLockService.acquireLock(event._id.toString(), user._id.toString(), user.email);

      await EditLock.updateOne({ eventId: event._id }, { expiresAt: new Date(Date.now() - 1000) });

      await expect(
        editLockService.maintainLock(event._id.toString(), user._id.toString())
      ).rejects.toThrow();

      const lock = await EditLock.findOne({ eventId: event._id });
      expect(lock).toBeNull();
    });
  });

  describe('isLocked', () => {
    it('should return true if event is locked', async () => {
      const user = await createTestUser();
      const event = await createTestEvent(user._id.toString());

      await editLockService.acquireLock(event._id.toString(), user._id.toString(), user.email);

      const isLocked = await editLockService.isLocked(event._id.toString());
      expect(isLocked).toBe(true);
    });

    it('should return false if event is not locked', async () => {
      const user = await createTestUser();
      const event = await createTestEvent(user._id.toString());

      const isLocked = await editLockService.isLocked(event._id.toString());
      expect(isLocked).toBe(false);
    });

    it('should return false and delete if lock expired', async () => {
      const user = await createTestUser();
      const event = await createTestEvent(user._id.toString());

      await editLockService.acquireLock(event._id.toString(), user._id.toString(), user.email);

      await EditLock.updateOne({ eventId: event._id }, { expiresAt: new Date(Date.now() - 1000) });

      const isLocked = await editLockService.isLocked(event._id.toString());
      expect(isLocked).toBe(false);

      const lock = await EditLock.findOne({ eventId: event._id });
      expect(lock).toBeNull();
    });
  });

  describe('getLockInfo', () => {
    it('should return lock information', async () => {
      const user = await createTestUser();
      const event = await createTestEvent(user._id.toString());

      await editLockService.acquireLock(event._id.toString(), user._id.toString(), user.email);

      const lockInfo = await editLockService.getLockInfo(event._id.toString());

      expect(lockInfo).toBeTruthy();
      expect(lockInfo?.eventId.toString()).toBe(event._id.toString());
      expect(lockInfo?.userEmail).toBe(user.email);
    });

    it('should return null if no lock exists', async () => {
      const user = await createTestUser();
      const event = await createTestEvent(user._id.toString());

      const lockInfo = await editLockService.getLockInfo(event._id.toString());
      expect(lockInfo).toBeNull();
    });

    it('should return null and delete if lock expired', async () => {
      const user = await createTestUser();
      const event = await createTestEvent(user._id.toString());

      await editLockService.acquireLock(event._id.toString(), user._id.toString(), user.email);

      await EditLock.updateOne({ eventId: event._id }, { expiresAt: new Date(Date.now() - 1000) });

      const lockInfo = await editLockService.getLockInfo(event._id.toString());
      expect(lockInfo).toBeNull();

      const lock = await EditLock.findOne({ eventId: event._id });
      expect(lock).toBeNull();
    });
  });

  describe('forceReleaseLock', () => {
    it('should force release any lock (admin operation)', async () => {
      const user = await createTestUser();
      const event = await createTestEvent(user._id.toString());

      await editLockService.acquireLock(event._id.toString(), user._id.toString(), user.email);

      await editLockService.forceReleaseLock(event._id.toString());

      const lock = await EditLock.findOne({ eventId: event._id });
      expect(lock).toBeNull();
    });

    it('should not throw error if no lock exists', async () => {
      const user = await createTestUser();
      const event = await createTestEvent(user._id.toString());

      await expect(editLockService.forceReleaseLock(event._id.toString())).resolves.not.toThrow();
    });
  });

  describe('Concurrent Lock Scenarios', () => {
    it('should handle race condition when multiple users try to acquire simultaneously', async () => {
      const user1 = await createTestUser({ email: 'user1@example.com' });
      const user2 = await createTestUser({ email: 'user2@example.com' });
      const event = await createTestEvent(user1._id.toString());

      const promises = [
        editLockService.acquireLock(event._id.toString(), user1._id.toString(), user1.email),
        editLockService.acquireLock(event._id.toString(), user2._id.toString(), user2.email),
      ];

      const results = await Promise.allSettled(promises);

      const succeeded = results.filter((r) => r.status === 'fulfilled');
      const failed = results.filter((r) => r.status === 'rejected');

      expect(succeeded.length).toBe(1);
      expect(failed.length).toBe(1);

      const locks = await EditLock.find({ eventId: event._id });
      expect(locks).toHaveLength(1);
    });

    it('should handle maintain lock during expiry edge case', async () => {
      const user = await createTestUser();
      const event = await createTestEvent(user._id.toString());

      await editLockService.acquireLock(event._id.toString(), user._id.toString(), user.email);

      await EditLock.updateOne({ eventId: event._id }, { expiresAt: new Date(Date.now() + 100) });

      await new Promise((resolve) => setTimeout(resolve, 150));

      await expect(
        editLockService.maintainLock(event._id.toString(), user._id.toString())
      ).rejects.toThrow();
    });

    it('should allow reacquire after release', async () => {
      const user = await createTestUser();
      const event = await createTestEvent(user._id.toString());

      await editLockService.acquireLock(event._id.toString(), user._id.toString(), user.email);

      await editLockService.releaseLock(event._id.toString(), user._id.toString());

      const lock = await editLockService.acquireLock(
        event._id.toString(),
        user._id.toString(),
        user.email
      );

      expect(lock).toBeTruthy();
      expect(lock.userId.toString()).toBe(user._id.toString());
    });

    it('should handle multiple maintains in sequence', async () => {
      const user = await createTestUser();
      const event = await createTestEvent(user._id.toString());

      const lock1 = await editLockService.acquireLock(
        event._id.toString(),
        user._id.toString(),
        user.email
      );

      await new Promise((resolve) => setTimeout(resolve, 50));
      const lock2 = await editLockService.maintainLock(event._id.toString(), user._id.toString());

      await new Promise((resolve) => setTimeout(resolve, 50));
      const lock3 = await editLockService.maintainLock(event._id.toString(), user._id.toString());

      expect(lock3.expiresAt.getTime()).toBeGreaterThan(lock2.expiresAt.getTime());
      expect(lock2.expiresAt.getTime()).toBeGreaterThan(lock1.expiresAt.getTime());
    });
  });

  describe('Lock Cleanup Scenarios', () => {
    it('should cleanup expired locks during isLocked check', async () => {
      const user = await createTestUser();
      const event1 = await createTestEvent(user._id.toString(), { title: 'Event 1' });
      const event2 = await createTestEvent(user._id.toString(), { title: 'Event 2' });

      await editLockService.acquireLock(event1._id.toString(), user._id.toString(), user.email);
      await editLockService.acquireLock(event2._id.toString(), user._id.toString(), user.email);

      await EditLock.updateOne({ eventId: event1._id }, { expiresAt: new Date(Date.now() - 1000) });

      await editLockService.isLocked(event1._id.toString());
      await editLockService.isLocked(event2._id.toString());

      const locks = await EditLock.find({});
      expect(locks).toHaveLength(1);
      expect(locks[0].eventId.toString()).toBe(event2._id.toString());
    });

    it('should cleanup expired lock during getLockInfo', async () => {
      const user = await createTestUser();
      const event = await createTestEvent(user._id.toString());

      await editLockService.acquireLock(event._id.toString(), user._id.toString(), user.email);

      await EditLock.updateOne({ eventId: event._id }, { expiresAt: new Date(Date.now() - 1000) });

      const lockInfo = await editLockService.getLockInfo(event._id.toString());
      expect(lockInfo).toBeNull();

      const locks = await EditLock.find({});
      expect(locks).toHaveLength(0);
    });
  });
});
