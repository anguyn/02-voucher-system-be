import request from 'supertest';
import app from '../../app';
import { Event } from '../../models';
import {
  createTestUser,
  createManagerUser,
  createTestEvent,
  generateAuthTokens,
} from '../helpers/test-utils';

describe('Event Controller', () => {
  describe('POST /api/v1/events', () => {
    it('should create event successfully with proper permissions', async () => {
      const manager = await createManagerUser();
      const { accessToken } = generateAuthTokens(manager);

      const eventData = {
        title: 'New Event',
        description: 'Event description',
        startDate: new Date(Date.now() + 1000 * 60 * 60),
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        maxVouchers: 100,
        isActive: true,
      };

      const res = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(eventData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(eventData.title);
      expect(res.body.data.maxVouchers).toBe(eventData.maxVouchers);

      const event = await Event.findById(res.body.data._id);
      expect(event).toBeTruthy();
      expect(event?.title).toBe(eventData.title);
    });

    it('should fail without proper permissions', async () => {
      const user = await createTestUser();
      const { accessToken } = generateAuthTokens(user);

      const eventData = {
        title: 'New Event',
        description: 'Event description',
        startDate: new Date(Date.now() + 1000 * 60 * 60),
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        maxVouchers: 100,
      };

      const res = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(eventData)
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it('should fail with invalid date range', async () => {
      const manager = await createManagerUser();
      const { accessToken } = generateAuthTokens(manager);

      const eventData = {
        title: 'New Event',
        description: 'Event description',
        startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        endDate: new Date(Date.now() + 1000 * 60 * 60),
        maxVouchers: 100,
      };

      const res = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(eventData)
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should fail without authentication', async () => {
      const eventData = {
        title: 'New Event',
        description: 'Event description',
        startDate: new Date(Date.now() + 1000 * 60 * 60),
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        maxVouchers: 100,
      };

      const res = await request(app).post('/api/v1/events').send(eventData).expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/events', () => {
    it('should get all events with pagination', async () => {
      const manager = await createManagerUser();

      await createTestEvent(manager._id.toString(), { title: 'Event 1' });
      await createTestEvent(manager._id.toString(), { title: 'Event 2' });
      await createTestEvent(manager._id.toString(), { title: 'Event 3' });

      const res = await request(app)
        .get('/api/v1/events')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.data).toHaveLength(3);
      expect(res.body.data.pagination.total).toBe(3);
    });

    it('should filter events by status', async () => {
      const manager = await createManagerUser();

      await createTestEvent(manager._id.toString(), {
        title: 'Upcoming Event',
        startDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
      });

      await createTestEvent(manager._id.toString(), {
        title: 'Active Event',
        startDate: new Date(Date.now() - 1000 * 60 * 60),
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
      });

      const res = await request(app).get('/api/v1/events').query({ status: 'active' }).expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.data).toHaveLength(1);
      expect(res.body.data.data[0].title).toBe('Active Event');
    });

    it('should support sorting', async () => {
      const manager = await createManagerUser();

      await createTestEvent(manager._id.toString(), { title: 'Event A' });
      await createTestEvent(manager._id.toString(), { title: 'Event B' });

      const res = await request(app)
        .get('/api/v1/events')
        .query({ sortBy: 'title', sortOrder: 'asc' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.data[0].title).toBe('Event A');
      expect(res.body.data.data[1].title).toBe('Event B');
    });
  });

  describe('GET /api/v1/events/:eventId', () => {
    it('should get event by ID', async () => {
      const manager = await createManagerUser();
      const event = await createTestEvent(manager._id.toString());

      const res = await request(app).get(`/api/v1/events/${event._id}`).expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(event._id.toString());
      expect(res.body.data.title).toBe(event.title);
    });

    it('should fail with invalid event ID', async () => {
      const res = await request(app).get('/api/v1/events/invalid-id').expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should fail with non-existent event ID', async () => {
      const res = await request(app).get('/api/v1/events/507f1f77bcf86cd799439011').expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/events/:eventId', () => {
    it('should update event successfully', async () => {
      const manager = await createManagerUser();
      const { accessToken } = generateAuthTokens(manager);
      const event = await createTestEvent(manager._id.toString());

      const updateData = {
        title: 'Updated Event Title',
        description: 'Updated description',
      };

      const res = await request(app)
        .put(`/api/v1/events/${event._id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(updateData.title);

      const updatedEvent = await Event.findById(event._id);
      expect(updatedEvent?.title).toBe(updateData.title);
    });

    it('should fail if user is not event creator', async () => {
      const manager1 = await createManagerUser();
      const manager2 = await createManagerUser();
      const { accessToken } = generateAuthTokens(manager2);

      const event = await createTestEvent(manager1._id.toString());

      const res = await request(app)
        .put(`/api/v1/events/${event._id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Updated Title' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should fail without proper permissions', async () => {
      const manager = await createManagerUser();
      const user = await createTestUser();
      const { accessToken } = generateAuthTokens(user);

      const event = await createTestEvent(manager._id.toString());

      const res = await request(app)
        .put(`/api/v1/events/${event._id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Updated Title' })
        .expect(403);

      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/events/:eventId', () => {
    it('should delete event successfully', async () => {
      const manager = await createManagerUser();
      const { accessToken } = generateAuthTokens(manager);
      const event = await createTestEvent(manager._id.toString());

      const res = await request(app)
        .delete(`/api/v1/events/${event._id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

      const deletedEvent = await Event.findById(event._id);
      expect(deletedEvent).toBeNull();
    });

    it('should fail if event has vouchers', async () => {
      const manager = await createManagerUser();
      const { accessToken } = generateAuthTokens(manager);
      const event = await createTestEvent(manager._id.toString());

      event.issuedVouchers = 1;
      await event.save();

      const res = await request(app)
        .delete(`/api/v1/events/${event._id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should fail if user is not event creator', async () => {
      const manager1 = await createManagerUser();
      const manager2 = await createManagerUser();
      const { accessToken } = generateAuthTokens(manager2);

      const event = await createTestEvent(manager1._id.toString());

      const res = await request(app)
        .delete(`/api/v1/events/${event._id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/events/my-events', () => {
    it('should get user created events', async () => {
      const manager = await createManagerUser();
      const { accessToken } = generateAuthTokens(manager);

      await createTestEvent(manager._id.toString(), { title: 'My Event 1' });
      await createTestEvent(manager._id.toString(), { title: 'My Event 2' });

      const otherManager = await createManagerUser();
      await createTestEvent(otherManager._id.toString(), { title: 'Other Event' });

      const res = await request(app)
        .get('/api/v1/events/my-events')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.data).toHaveLength(2);
      expect(res.body.data.data.every((e: any) => e.title.startsWith('My Event'))).toBe(true);
    });
  });
});
