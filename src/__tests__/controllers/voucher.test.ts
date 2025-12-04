import request from 'supertest';
import app from '../../app';
import { Voucher } from '../../models';
import {
  createTestUser,
  createActiveEvent,
  createTestVoucher,
  generateAuthTokens,
} from '../helpers/test-utils';

describe('Voucher Controller', () => {
  describe('POST /api/v1/vouchers/issue', () => {
    it('should issue voucher successfully for active event', async () => {
      const user = await createTestUser();
      const event = await createActiveEvent(user._id.toString());
      const { accessToken } = generateAuthTokens(user);

      const res = await request(app)
        .post('/api/v1/vouchers/issue')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ eventId: event._id.toString() })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('code');
      expect(res.body.data.eventId).toBe(event._id.toString());
      expect(res.body.data.eventTitle).toBe(event.title);

      const voucher = await Voucher.findOne({ code: res.body.data.code });
      expect(voucher).toBeTruthy();
      expect(voucher?.userId.toString()).toBe(user._id.toString());
    });

    it('should fail if user already claimed voucher for event', async () => {
      const user = await createTestUser();
      const event = await createActiveEvent(user._id.toString());
      const { accessToken } = generateAuthTokens(user);

      await request(app)
        .post('/api/v1/vouchers/issue')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ eventId: event._id.toString() })
        .expect(201);

      const res = await request(app)
        .post('/api/v1/vouchers/issue')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ eventId: event._id.toString() })
        .expect(456);

      expect(res.body.success).toBe(false);
    });

    it('should fail if event has no more vouchers', async () => {
      const user = await createTestUser();
      const event = await createActiveEvent(user._id.toString());
      const { accessToken } = generateAuthTokens(user);

      event.maxVouchers = 1;
      event.issuedVouchers = 1;
      await event.save();

      const res = await request(app)
        .post('/api/v1/vouchers/issue')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ eventId: event._id.toString() })
        .expect(456);

      expect(res.body.success).toBe(false);
    });

    it('should fail if event is not active', async () => {
      const user = await createTestUser();
      const event = await createActiveEvent(user._id.toString());
      const { accessToken } = generateAuthTokens(user);

      event.isActive = false;
      await event.save();

      const res = await request(app)
        .post('/api/v1/vouchers/issue')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ eventId: event._id.toString() })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should fail if event not started yet', async () => {
      const user = await createTestUser();
      const { accessToken } = generateAuthTokens(user);

      const event = await createActiveEvent(user._id.toString());

      event.startDate = new Date(Date.now() + 1000 * 60 * 60 * 24);
      await event.save();

      const res = await request(app)
        .post('/api/v1/vouchers/issue')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ eventId: event._id.toString() })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should fail if event has ended', async () => {
      const user = await createTestUser();
      const { accessToken } = generateAuthTokens(user);

      const event = await createActiveEvent(user._id.toString());

      event.endDate = new Date(Date.now() - 1000 * 60 * 60);
      await event.save();

      const res = await request(app)
        .post('/api/v1/vouchers/issue')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ eventId: event._id.toString() })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should fail without authentication', async () => {
      const user = await createTestUser();
      const event = await createActiveEvent(user._id.toString());

      const res = await request(app)
        .post('/api/v1/vouchers/issue')
        .send({ eventId: event._id.toString() })
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/vouchers/use', () => {
    it('should use voucher successfully', async () => {
      const user = await createTestUser();
      const event = await createActiveEvent(user._id.toString());
      const voucher = await createTestVoucher(event._id.toString(), user._id.toString());
      const { accessToken } = generateAuthTokens(user);

      const res = await request(app)
        .post('/api/v1/vouchers/use')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code: voucher.code })
        .expect(200);

      expect(res.body.success).toBe(true);

      const usedVoucher = await Voucher.findById(voucher._id);
      expect(usedVoucher?.isUsed).toBe(true);
      expect(usedVoucher?.usedAt).toBeTruthy();
    });

    it('should fail with invalid voucher code', async () => {
      const user = await createTestUser();
      const { accessToken } = generateAuthTokens(user);

      const res = await request(app)
        .post('/api/v1/vouchers/use')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code: 'INVALID-CODE' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should fail if voucher already used', async () => {
      const user = await createTestUser();
      const event = await createActiveEvent(user._id.toString());
      const voucher = await createTestVoucher(event._id.toString(), user._id.toString());
      const { accessToken } = generateAuthTokens(user);

      voucher.isUsed = true;
      voucher.usedAt = new Date();
      await voucher.save();

      const res = await request(app)
        .post('/api/v1/vouchers/use')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code: voucher.code })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should fail if voucher is expired', async () => {
      const user = await createTestUser();
      const event = await createActiveEvent(user._id.toString());
      const voucher = await createTestVoucher(event._id.toString(), user._id.toString());
      const { accessToken } = generateAuthTokens(user);

      voucher.expiresAt = new Date(Date.now() - 1000 * 60 * 60);
      await voucher.save();

      const res = await request(app)
        .post('/api/v1/vouchers/use')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code: voucher.code })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should fail if voucher belongs to another user', async () => {
      const user1 = await createTestUser({ email: 'user1@example.com' });
      const user2 = await createTestUser({ email: 'user2@example.com' });
      const event = await createActiveEvent(user1._id.toString());
      const voucher = await createTestVoucher(event._id.toString(), user1._id.toString());
      const { accessToken } = generateAuthTokens(user2);

      const res = await request(app)
        .post('/api/v1/vouchers/use')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code: voucher.code })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/vouchers/my-vouchers', () => {
    it('should get user vouchers with pagination', async () => {
      const user = await createTestUser();
      const event = await createActiveEvent(user._id.toString());
      const { accessToken } = generateAuthTokens(user);

      await createTestVoucher(event._id.toString(), user._id.toString());
      await createTestVoucher(event._id.toString(), user._id.toString());

      const res = await request(app)
        .get('/api/v1/vouchers/my-vouchers')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.data).toHaveLength(2);
      expect(res.body.data.pagination).toHaveProperty('total', 2);
    });

    it('should filter vouchers by status', async () => {
      const user = await createTestUser();
      const event = await createActiveEvent(user._id.toString());
      const { accessToken } = generateAuthTokens(user);

      await createTestVoucher(event._id.toString(), user._id.toString());

      const usedVoucher = await createTestVoucher(event._id.toString(), user._id.toString());
      usedVoucher.isUsed = true;
      await usedVoucher.save();

      const res = await request(app)
        .get('/api/v1/vouchers/my-vouchers')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ status: 'available' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.data).toHaveLength(1);
      expect(res.body.data.data[0].isUsed).toBe(false);
    });

    it('should fail without authentication', async () => {
      const res = await request(app).get('/api/v1/vouchers/my-vouchers').expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/vouchers/:code', () => {
    it('should get voucher by code', async () => {
      const user = await createTestUser();
      const event = await createActiveEvent(user._id.toString());
      const voucher = await createTestVoucher(event._id.toString(), user._id.toString());
      const { accessToken } = generateAuthTokens(user);

      const res = await request(app)
        .get(`/api/v1/vouchers/${voucher.code}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.code).toBe(voucher.code);
      expect(res.body.data.eventTitle).toBe(event.title);
    });

    it('should fail with invalid code', async () => {
      const user = await createTestUser();
      const { accessToken } = generateAuthTokens(user);

      const res = await request(app)
        .get('/api/v1/vouchers/INVALID-CODE')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should fail if voucher belongs to another user', async () => {
      const user1 = await createTestUser({ email: 'user1@example.com' });
      const user2 = await createTestUser({ email: 'user2@example.com' });
      const event = await createActiveEvent(user1._id.toString());
      const voucher = await createTestVoucher(event._id.toString(), user1._id.toString());
      const { accessToken } = generateAuthTokens(user2);

      const res = await request(app)
        .get(`/api/v1/vouchers/${voucher.code}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });
});
