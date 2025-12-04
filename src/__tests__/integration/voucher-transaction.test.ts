import mongoose from 'mongoose';
import { voucherService } from '../../services';
import { Event, Voucher } from '../../models';
import { createTestUser, createActiveEvent } from '../helpers/test-utils';

/**
 * CRITICAL TRANSACTION TESTS
 * These tests verify MongoDB transaction atomicity and consistency
 * in the voucher issuing process
 */
describe('Voucher Transaction & Atomicity Tests', () => {
  describe('Transaction Rollback Scenarios', () => {
    it('should rollback entire transaction if any operation fails', async () => {
      const user = await createTestUser();
      const event = await createActiveEvent(user._id.toString());

      const initialIssuedCount = event.issuedVouchers;
      const initialVoucherCount = await Voucher.countDocuments({ eventId: event._id });

      const originalCreate = Voucher.create;
      jest.spyOn(Voucher, 'create').mockImplementationOnce(() => {
        throw new Error('Database error during voucher creation');
      });

      try {
        await voucherService.issueVoucher(event._id.toString(), user._id.toString());
        fail('Should have thrown an error');
      } catch (error) {}

      const eventAfter = await Event.findById(event._id);
      expect(eventAfter?.issuedVouchers).toBe(initialIssuedCount);

      const voucherCountAfter = await Voucher.countDocuments({ eventId: event._id });
      expect(voucherCountAfter).toBe(initialVoucherCount);

      Voucher.create = originalCreate;
    });

    it('should rollback if event update fails after voucher check', async () => {
      const user = await createTestUser();
      const event = await createActiveEvent(user._id.toString());

      const initialVoucherCount = await Voucher.countDocuments({ eventId: event._id });

      const originalUpdate = Event.findOneAndUpdate;
      jest.spyOn(Event, 'findOneAndUpdate').mockImplementationOnce(() => {
        throw new Error('Event update failed');
      });

      try {
        await voucherService.issueVoucher(event._id.toString(), user._id.toString());
        fail('Should have thrown an error');
      } catch (error) {}

      const voucherCountAfter = await Voucher.countDocuments({ eventId: event._id });
      expect(voucherCountAfter).toBe(initialVoucherCount);

      Event.findOneAndUpdate = originalUpdate;
    });

    it('should maintain consistency with network interruption simulation', async () => {
      const user = await createTestUser();
      const event = await createActiveEvent(user._id.toString());

      event.maxVouchers = 10;
      event.issuedVouchers = 9;
      await event.save();

      let callCount = 0;
      const originalCreate = Voucher.create;
      jest.spyOn(Voucher, 'create').mockImplementation((...args: any[]) => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Network interruption');
        }
        return originalCreate.apply(Voucher, args);
      });

      try {
        await voucherService.issueVoucher(event._id.toString(), user._id.toString());
        fail('Should have thrown an error');
      } catch (error) {}

      const finalEvent = await Event.findById(event._id);
      const voucherCount = await Voucher.countDocuments({ eventId: event._id });

      expect(finalEvent?.issuedVouchers).toBe(9);
      expect(voucherCount).toBe(0);

      Voucher.create = originalCreate;
    });
  });

  describe('Race Condition Tests - Critical for Concurrency', () => {
    it('should handle race condition with 100 concurrent requests', async () => {
      const event = await createActiveEvent((await createTestUser())._id.toString());

      event.maxVouchers = 50;
      event.issuedVouchers = 0;
      await event.save();

      const users = await Promise.all(
        Array.from({ length: 100 }, (_, i) => createTestUser({ email: `race${i}@example.com` }))
      );

      const promises = users.map((user) =>
        voucherService.issueVoucher(event._id.toString(), user._id.toString())
      );

      const results = await Promise.allSettled(promises);

      const succeeded = results.filter((r) => r.status === 'fulfilled');
      const failed = results.filter((r) => r.status === 'rejected');

      expect(succeeded.length).toBe(50);
      expect(failed.length).toBe(50);

      const finalEvent = await Event.findById(event._id);
      expect(finalEvent?.issuedVouchers).toBe(50);

      const voucherCount = await Voucher.countDocuments({ eventId: event._id });
      expect(voucherCount).toBe(50);

      const userIds = await Voucher.distinct('userId', { eventId: event._id });
      expect(userIds.length).toBe(50);
    });

    it('should prevent overselling when exactly at limit', async () => {
      const event = await createActiveEvent((await createTestUser())._id.toString());

      event.maxVouchers = 10;
      event.issuedVouchers = 9;
      await event.save();

      const users = await Promise.all([
        createTestUser({ email: 'race1@example.com' }),
        createTestUser({ email: 'race2@example.com' }),
        createTestUser({ email: 'race3@example.com' }),
        createTestUser({ email: 'race4@example.com' }),
        createTestUser({ email: 'race5@example.com' }),
      ]);

      const promises = users.map((user) =>
        voucherService.issueVoucher(event._id.toString(), user._id.toString())
      );

      const results = await Promise.allSettled(promises);

      const succeeded = results.filter((r) => r.status === 'fulfilled');
      const failed = results.filter((r) => r.status === 'rejected');

      expect(succeeded.length).toBe(1);
      expect(failed.length).toBe(4);

      const finalEvent = await Event.findById(event._id);
      expect(finalEvent?.issuedVouchers).toBe(10);

      const voucherCount = await Voucher.countDocuments({ eventId: event._id });
      expect(voucherCount).toBe(1);
    });

    it('should handle race condition with same user multiple times', async () => {
      const user = await createTestUser();
      const event = await createActiveEvent(user._id.toString());

      const promises = Array(10)
        .fill(null)
        .map(() => voucherService.issueVoucher(event._id.toString(), user._id.toString()));

      const results = await Promise.allSettled(promises);

      const succeeded = results.filter((r) => r.status === 'fulfilled');
      const failed = results.filter((r) => r.status === 'rejected');

      expect(succeeded.length).toBe(1);
      expect(failed.length).toBe(9);

      const vouchers = await Voucher.find({
        eventId: event._id,
        userId: user._id,
      });
      expect(vouchers).toHaveLength(1);
    });

    it('should maintain isolation between different events', async () => {
      const user1 = await createTestUser({ email: 'user1@example.com' });
      const user2 = await createTestUser({ email: 'user2@example.com' });

      const event1 = await createActiveEvent(user1._id.toString());
      const event2 = await createActiveEvent(user2._id.toString());

      event1.maxVouchers = 5;
      event1.issuedVouchers = 4;
      await event1.save();

      event2.maxVouchers = 5;
      event2.issuedVouchers = 4;
      await event2.save();

      const users = await Promise.all([
        createTestUser({ email: 'race1@example.com' }),
        createTestUser({ email: 'race2@example.com' }),
      ]);

      const promises = [
        voucherService.issueVoucher(event1._id.toString(), users[0]._id.toString()),
        voucherService.issueVoucher(event2._id.toString(), users[1]._id.toString()),
      ];

      const results = await Promise.allSettled(promises);

      expect(results.every((r) => r.status === 'fulfilled')).toBe(true);

      const finalEvent1 = await Event.findById(event1._id);
      const finalEvent2 = await Event.findById(event2._id);

      expect(finalEvent1?.issuedVouchers).toBe(5);
      expect(finalEvent2?.issuedVouchers).toBe(5);
    });
  });

  describe('Transaction Retry Logic Tests', () => {
    it('should retry transaction on transient errors', async () => {
      const user = await createTestUser();
      const event = await createActiveEvent(user._id.toString());

      let attemptCount = 0;
      const originalFindOneAndUpdate = Event.findOneAndUpdate;

      jest.spyOn(Event, 'findOneAndUpdate').mockImplementation(function (
        this: any,
        filter: any,
        update: any,
        options: any
      ) {
        attemptCount++;
        if (attemptCount === 1) {
          const error: any = new Error('TransientTransactionError');
          error.hasErrorLabel = (label: string) => label === 'TransientTransactionError';
          throw error;
        }
        return originalFindOneAndUpdate.call(this, filter, update, options);
      });

      const voucher = await voucherService.issueVoucher(event._id.toString(), user._id.toString());

      expect(voucher).toBeDefined();
      expect(attemptCount).toBeGreaterThan(1);

      Event.findOneAndUpdate = originalFindOneAndUpdate;
    });

    it('should fail after max retry attempts', async () => {
      const user = await createTestUser();
      const event = await createActiveEvent(user._id.toString());

      jest.spyOn(Event, 'findOneAndUpdate').mockImplementation(() => {
        const error: any = new Error('TransientTransactionError');
        error.hasErrorLabel = (label: string) => label === 'TransientTransactionError';
        throw error;
      });

      await expect(
        voucherService.issueVoucher(event._id.toString(), user._id.toString())
      ).rejects.toThrow();

      jest.restoreAllMocks();
    });
  });

  describe('Data Consistency Verification', () => {
    it('should maintain referential integrity between Event and Voucher', async () => {
      const user = await createTestUser();
      const event = await createActiveEvent(user._id.toString());

      await voucherService.issueVoucher(event._id.toString(), user._id.toString());

      const voucher = await Voucher.findOne({ userId: user._id });
      const updatedEvent = await Event.findById(event._id);

      expect(voucher?.eventId.toString()).toBe(event._id.toString());
      expect(updatedEvent?.issuedVouchers).toBe(1);

      const actualVoucherCount = await Voucher.countDocuments({ eventId: event._id });
      expect(updatedEvent?.issuedVouchers).toBe(actualVoucherCount);
    });

    it('should ensure voucher codes are unique across all events', async () => {
      const user1 = await createTestUser({ email: 'user1@example.com' });
      const user2 = await createTestUser({ email: 'user2@example.com' });

      const event1 = await createActiveEvent(user1._id.toString());
      const event2 = await createActiveEvent(user2._id.toString());

      const voucher1 = await voucherService.issueVoucher(
        event1._id.toString(),
        user1._id.toString()
      );
      const voucher2 = await voucherService.issueVoucher(
        event2._id.toString(),
        user2._id.toString()
      );

      expect(voucher1.code).not.toBe(voucher2.code);

      const allCodes = await Voucher.distinct('code');
      const uniqueCodes = new Set(allCodes);
      expect(allCodes.length).toBe(uniqueCodes.size);
    });

    it('should maintain accurate count after multiple operations', async () => {
      const event = await createActiveEvent((await createTestUser())._id.toString());

      event.maxVouchers = 20;
      event.issuedVouchers = 0;
      await event.save();

      const users = await Promise.all(
        Array.from({ length: 10 }, (_, i) => createTestUser({ email: `user${i}@example.com` }))
      );

      for (const user of users) {
        await voucherService.issueVoucher(event._id.toString(), user._id.toString());
      }

      const finalEvent = await Event.findById(event._id);
      const actualVoucherCount = await Voucher.countDocuments({ eventId: event._id });

      expect(finalEvent?.issuedVouchers).toBe(10);
      expect(actualVoucherCount).toBe(10);
      expect(finalEvent?.issuedVouchers).toBe(actualVoucherCount);
    });
  });

  describe('Edge Cases', () => {
    it('should handle event with maxVouchers = 1', async () => {
      const user1 = await createTestUser({ email: 'user1@example.com' });
      const user2 = await createTestUser({ email: 'user2@example.com' });
      const event = await createActiveEvent(user1._id.toString());

      event.maxVouchers = 1;
      event.issuedVouchers = 0;
      await event.save();

      const promises = [
        voucherService.issueVoucher(event._id.toString(), user1._id.toString()),
        voucherService.issueVoucher(event._id.toString(), user2._id.toString()),
      ];

      const results = await Promise.allSettled(promises);

      expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
      expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1);

      const finalEvent = await Event.findById(event._id);
      expect(finalEvent?.issuedVouchers).toBe(1);
    });

    it('should handle large maxVouchers value', async () => {
      const user = await createTestUser();
      const event = await createActiveEvent(user._id.toString());

      event.maxVouchers = 1000000;
      event.issuedVouchers = 999999;
      await event.save();

      const voucher = await voucherService.issueVoucher(event._id.toString(), user._id.toString());

      expect(voucher).toBeDefined();

      const finalEvent = await Event.findById(event._id);
      expect(finalEvent?.issuedVouchers).toBe(1000000);
    });

    it('should handle rapid sequential issues from same user', async () => {
      const user = await createTestUser();
      const event = await createActiveEvent(user._id.toString());

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < 5; i++) {
        try {
          await voucherService.issueVoucher(event._id.toString(), user._id.toString());
          successCount++;
        } catch {
          errorCount++;
        }
      }

      expect(successCount).toBe(1);
      expect(errorCount).toBe(4);

      const vouchers = await Voucher.find({ userId: user._id, eventId: event._id });
      expect(vouchers).toHaveLength(1);
    });
  });
});
